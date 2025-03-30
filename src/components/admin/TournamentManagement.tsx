import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter  } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { 
   Plus, Edit, Trash2, Search
} from "lucide-react";
import { format } from 'date-fns';


interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  teams: number;
  matches: number;
  format: string;
  hostedBy?: string;
  venue?: string;
  description?: string;
  rules?: string[];
  prize?: string[];
  entryFee?: number;
  userManagers?: string[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

interface TournamentManagementProps {
  adminId: string;
}

const TournamentManagement: React.FC<TournamentManagementProps> = ({ adminId }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of tournaments to display per page
  
  useEffect(() => {
    fetchTournaments();
    fetchUsers();
  }, [adminId]);
  
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/management/tournaments');
      
      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      
      let data = await response.json();
      data= data.map(t => ({
                  id: t._id,
                  name: t.tournamentName,
                  startDate: t.startDate,
                  endDate: t.endDate,
                  status: t.status === 'scheduled' ? 'upcoming' : t.status,
                  teams: t.teams,
                  matches: t.matches,
                  format: t.format,
      
              }))
      setTournaments(data);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/management/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
        console.log("Fetched users:", data);
      } else {
        console.error("Invalid users data format:", data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!openDialog) {
      setSelectedUsers([]);
    }
  }, [openDialog]);

  useEffect(() => {
    if (!openEditDialog) {
      setSelectedUsers([]);
    }
  }, [openEditDialog]);
  
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const response = await fetch('/api/management/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          format: formData.get('format'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          teams: Number(formData.get('teams')),
          hostedBy: formData.get('hostedBy'),
          venue: formData.get('venue'),
          description: formData.get('description'),
          rules: (formData.get('rules') as string).split('\n').filter(rule => rule.trim()),
          prize: (formData.get('prize') as string).split('\n').filter(prize => prize.trim()),
          entryFee: Number(formData.get('entryFee')),
          adminId: adminId,
          userManagers: [...selectedUsers, adminId], // Include current admin
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tournament');
      }

      setOpenDialog(false);
      fetchTournaments();
      form.reset();
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };
  
  const handleDeleteTournament = async (id: string) => {
    try {
      const response = await fetch(`/api/management/tournaments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tournament');
      }

      fetchTournaments();
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  };

  const handleEditClick = async (tournament: Tournament) => {
    try {
        const response = await fetch(`/api/management/tournaments/${tournament.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch tournament details');
        }
        const fullTournament = await response.json();
        setEditingTournament({
            ...fullTournament,
            // Ensure dates are in YYYY-MM-DD format
            startDate: new Date(fullTournament.startDate).toISOString().split('T')[0],
            endDate: new Date(fullTournament.endDate).toISOString().split('T')[0],
        });
        setSelectedUsers(fullTournament.userManagers || []);
        setOpenEditDialog(true);
    } catch (error) {
        console.error('Error fetching tournament details:', error);
    }
};

  const handleEditTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/management/tournaments?id=${editingTournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          format: formData.get('format'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          teams: Number(formData.get('teams')),
          hostedBy: formData.get('hostedBy'),
          venue: formData.get('venue'),
          description: formData.get('description'),
          rules: (formData.get('rules') as string).split('\n').filter(rule => rule.trim()),
          prize: (formData.get('prize') as string).split('\n').filter(prize => prize.trim()),
          entryFee: Number(formData.get('entryFee')),
          matches: Number(formData.get('matches')),
          userManagers: selectedUsers,
        }),
      });

      if (!response.ok) throw new Error('Failed to update tournament');

      setOpenEditDialog(false);
      setEditingTournament(null);
      fetchTournaments();
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  };
  
  const filterTournaments = () => {
    let filtered = [...tournaments];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tournament => 
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(tournament => tournament.status === activeTab);
    }
    
    return filtered;
  };

  // Function to get current page items
  const getCurrentPageItems = () => {
    const filtered = filterTournaments();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  const filteredTournaments = filterTournaments();
  const currentPageItems = getCurrentPageItems();
  const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);
  
  const getStatusBadge = (status: string): React.ReactNode => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ongoing</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tournament Management</h2>
          <p className="text-gray-500">Create and manage cricket tournaments</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              New Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new cricket tournament.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTournament}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="format" className="text-right">Format</Label>
                  <select 
                    id="format" 
                    name="format" 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    <option value="">Select format</option>
                    <option value="T20">T20</option>
                    <option value="ODI">ODI</option>
                    <option value="Test">Test</option>
                  </select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hostedBy" className="text-right">Hosted By</Label>
                  <Input id="hostedBy" name="hostedBy" className="col-span-3" required />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="venue" className="text-right">Venue</Label>
                  <Input id="venue" name="venue" className="col-span-3" required />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <textarea 
                    id="description" 
                    name="description" 
                    className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rules" className="text-right">Rules</Label>
                  <textarea 
                    id="rules" 
                    name="rules" 
                    placeholder="Enter each rule on a new line"
                    className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prize" className="text-right">Prizes</Label>
                  <textarea 
                    id="prize" 
                    name="prize" 
                    placeholder="Enter each prize on a new line"
                    className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="entryFee" className="text-right">Entry Fee</Label>
                  <Input 
                    id="entryFee" 
                    name="entryFee" 
                    type="number" 
                    min="0" 
                    className="col-span-3" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teams" className="text-right">Teams</Label>
                  <Input 
                    id="teams" 
                    name="teams" 
                    type="number" 
                    min="2" 
                    className="col-span-3" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">Start Date</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date" 
                    className="col-span-3" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">End Date</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date" 
                    className="col-span-3" 
                    required 
                  />
                </div>

                               
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userManagers" className="text-right">
                    User Managers
                  </Label>
                  <div className="col-span-3">
                    <div className="border rounded-md p-3">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedUsers.length > 0 && users.length > 0 ? (
                          selectedUsers
                            .filter(userId => userId !== adminId) // Filter out the current admin from display
                            .map(userId => {
                              const user = users.find(u => u._id === userId);
                              return user ? (
                                <Badge key={userId} variant="secondary" className="px-2 py-1">
                                  {user.username}
                                  <button
                                    onClick={() => {
                                      setSelectedUsers(prev => prev.filter(id => id !== userId));
                                    }}
                                    className="ml-1 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ) : null;
                            })
                        ) : (
                          <div className="text-sm text-gray-500">
                            {selectedUsers.includes(adminId) ? 
                              "Only you (admin) selected as manager" : 
                              "No managers selected"}
                          </div>
                        )}
                      </div>
                      <select
                        className="w-full p-2 border rounded-md"
                        value=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value && !selectedUsers.includes(value)) {
                            setSelectedUsers([...selectedUsers, value]);
                          }
                        }}
                      >
                        <option value="">Add a manager...</option>
                        {users
                          .filter(user => !selectedUsers.includes(user._id))
                          .map(user => (
                            <option key={user._id} value={user._id}>
                              {user.username} - {user.email} ({user.role})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Current admin will be automatically added as a manager
                      </p>
                    </div>
                  </div>
                </div>
                
              </div>
              <DialogFooter>
                <Button type="submit">Create Tournament</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tournaments..."
            className="pl-8 w-full md:w-auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No tournaments found
                  </TableCell>
                </TableRow>
              ) : (
                currentPageItems.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell className="font-medium">{tournament.name}</TableCell>
                    <TableCell>{tournament.format}</TableCell>
                    <TableCell>
                      {format(new Date(tournament.startDate), 'MM - dd - yyyy')} to {format(new Date(tournament.endDate), 'MM - dd - yyyy')}
                    </TableCell>
                    <TableCell>{tournament.teams}</TableCell>
                    <TableCell>{tournament.matches}</TableCell>
                    <TableCell>{getStatusBadge(tournament.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(tournament)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTournament(tournament.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min(currentPage * itemsPerPage, filteredTournaments.length)} of {filteredTournaments.length} tournaments
          </div>
          <div className="flex items-center gap-2">
            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              >
              Previous
              </Button>
              <span className="text-sm">
              Page {currentPage} of {totalPages || 1}
              </span>
              <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
              </div>
        </CardFooter>
      </Card>

      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>
              Update the tournament details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTournament}>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.name}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="format" className="text-right">Format</Label>
                <select 
                  id="format" 
                  name="format" 
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={editingTournament?.format}
                  required
                >
                  <option value="">Select format</option>
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hostedBy" className="text-right">Hosted By</Label>
                <Input 
                  id="hostedBy" 
                  name="hostedBy" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.hostedBy}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">Venue</Label>
                <Input 
                  id="venue" 
                  name="venue" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.venue}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <textarea 
                  id="description" 
                  name="description" 
                  className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={editingTournament?.description}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rules" className="text-right">Rules</Label>
                <textarea 
                  id="rules" 
                  name="rules" 
                  placeholder="Enter each rule on a new line"
                  className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={editingTournament?.rules?.join('\n')}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prize" className="text-right">Prizes</Label>
                <textarea 
                  id="prize" 
                  name="prize" 
                  placeholder="Enter each prize on a new line"
                  className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
                  defaultValue={editingTournament?.prize?.join('\n')}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entryFee" className="text-right">Entry Fee</Label>
                <Input 
                  id="entryFee" 
                  name="entryFee" 
                  type="number" 
                  min="0" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.entryFee?.toString()}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="teams" className="text-right">Teams</Label>
                <Input 
                  id="teams" 
                  name="teams" 
                  type="number" 
                  min="2" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.teams.toString()}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">Start Date</Label>
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.startDate}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">End Date</Label>
                <Input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.endDate}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="matches" className="text-right">Matches</Label>
                <Input 
                  id="matches" 
                  name="matches" 
                  type="number" 
                  min="0" 
                  className="col-span-3" 
                  defaultValue={editingTournament?.matches?.toString()}
                  required 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userManagers" className="text-right">
                  User Managers
                </Label>
                <div className="col-span-3">
                  <div className="border rounded-md p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedUsers.length > 0 && users.length > 0 ? (
                        selectedUsers.map(userId => {
                          const user = users.find(u => u._id === userId);
                          return user ? (
                            <Badge key={userId} variant="secondary" className="px-2 py-1">
                              {user.username}
                              {/* Don't allow removing current admin */}
                              {userId !== adminId && (
                                <button
                                  onClick={() => {
                                    setSelectedUsers(prev => prev.filter(id => id !== userId));
                                  }}
                                  className="ml-1 hover:text-red-500"
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <div className="text-sm text-gray-500">No managers selected</div>
                      )}
                    </div>
                    <select
                      className="w-full p-2 border rounded-md"
                      value=""
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && !selectedUsers.includes(value)) {
                          setSelectedUsers([...selectedUsers, value]);
                        }
                      }}
                    >
                      <option value="">Add a manager...</option>
                      {users
                        .filter(user => !selectedUsers.includes(user._id))
                        .map(user => (
                          <option key={user._id} value={user._id}>
                            {user.username} - {user.email} ({user.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Tournament</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentManagement;
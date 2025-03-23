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
   Plus, Edit, Trash2, Search,
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
  
  useEffect(() => {
    fetchTournaments();
  }, [adminId]);
  
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch('/api/tournaments');
      
      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // For demo purposes - mock data
  useEffect(() => {
    // Simulating API response
    setTimeout(() => {
      const mockTournaments: Tournament[] = [
        {
          id: '1',
          name: 'Summer Cricket Cup 2023',
          startDate: '2023-06-01',
          endDate: '2023-06-30',
          status: 'completed',
          teams: 8,
          matches: 28,
          format: 'T20'
        },
        {
          id: '2',
          name: 'Winter League 2024',
          startDate: '2023-11-15',
          endDate: '2024-02-28',
          status: 'ongoing',
          teams: 10,
          matches: 45,
          format: 'ODI'
        },
        {
          id: '3',
          name: 'Spring Championship',
          startDate: '2024-04-10',
          endDate: '2024-05-20',
          status: 'upcoming',
          teams: 6,
          matches: 15,
          format: 'T20'
        },
        {
          id: '4',
          name: 'Regional Cup',
          startDate: '2024-07-05',
          endDate: '2024-07-25',
          status: 'upcoming',
          teams: 4,
          matches: 6,
          format: 'Test'
        },
        {
          id: '5',
          name: 'Champions Trophy',
          startDate: '2023-09-10',
          endDate: '2023-10-15',
          status: 'completed',
          teams: 12,
          matches: 31,
          format: 'T20'
        }
      ];
      
      setTournaments(mockTournaments);
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Creating new tournament");
    setOpenDialog(false);
    // You would normally make an API call here
  };
  
  const handleDeleteTournament = (id: string) => {
    // Handle tournament deletion
    console.log(`Deleting tournament ${id}`);
    // You would normally make an API call here
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
  
  const getStatusBadge = (status: 'upcoming' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>;
      case 'ongoing':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ongoing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  const filteredTournaments = filterTournaments();
  
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new cricket tournament.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTournament}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" className="col-span-3" placeholder="Tournament name" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="format" className="text-right">
                    Format
                  </Label>
                  <Input id="format" className="col-span-3" placeholder="T20, ODI, Test" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input id="startDate" type="date" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input id="endDate" type="date" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="teams" className="text-right">
                    Teams
                  </Label>
                  <Input id="teams" type="number" min="2" className="col-span-3" required />
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
              {filteredTournaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No tournaments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTournaments.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell className="font-medium">{tournament.name}</TableCell>
                    <TableCell>{tournament.format}</TableCell>
                    <TableCell>
                      {format(new Date(tournament.startDate), 'MMM d, yyyy')} - {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{tournament.teams}</TableCell>
                    <TableCell>{tournament.matches}</TableCell>
                    <TableCell>{getStatusBadge(tournament.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
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
            Showing {filteredTournaments.length} of {tournaments.length} tournaments
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TournamentManagement;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Plus, Edit, Trash2, Search,
  Users, 
  FileText, Upload
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
  logo?: string;
  captain: string;
  coach: string;
  players: number;
  status: 'active' | 'inactive';
  tournaments: number;
  wins: number;
  losses: number;
}

interface TeamManagementProps {
  adminId: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ adminId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    fetchTeams();
  }, [adminId]);
  
  const fetchTeams = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      // const response = await fetch('/api/teams');
      // const data = await response.json();
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockTeams: Team[] = [
          {
            id: '1',
            name: 'Royal Challengers',
            captain: 'John Smith',
            coach: 'Mike Johnson',
            players: 16,
            status: 'active',
            tournaments: 3,
            wins: 12,
            losses: 5
          },
          {
            id: '2',
            name: 'Thunderbolts',
            captain: 'David Warner',
            coach: 'Steve Williams',
            players: 15,
            status: 'active',
            tournaments: 2,
            wins: 8,
            losses: 4
          },
          {
            id: '3',
            name: 'Super Kings',
            captain: 'Michael Clarke',
            coach: 'Ricky Ponting',
            players: 18,
            status: 'active',
            tournaments: 3,
            wins: 15,
            losses: 3
          },
          {
            id: '4',
            name: 'Panthers',
            captain: 'Stuart Broad',
            coach: 'Andrew Flintoff',
            players: 14,
            status: 'inactive',
            tournaments: 1,
            wins: 3,
            losses: 6
          },
          {
            id: '5',
            name: 'Strikers',
            captain: 'Kane Williamson',
            coach: 'Brendon McCullum',
            players: 15,
            status: 'active',
            tournaments: 2,
            wins: 9,
            losses: 7
          }
        ];
        
        setTeams(mockTeams);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setLoading(false);
    }
  };
  
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle team creation logic here
    console.log("Creating new team");
    setOpenDialog(false);
  };
  
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setOpenDialog(true);
  };
  
  const handleDeleteTeam = (id: string) => {
    // Handle team deletion logic here
    console.log(`Deleting team ${id}`);
    setTeams(prevTeams => prevTeams.filter(team => team.id !== id));
  };
  
  const filterTeams = () => {
    let filtered = [...teams];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.captain.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status tab
    if (activeTab === 'active') {
      filtered = filtered.filter(team => team.status === 'active');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(team => team.status === 'inactive');
    }
    
    return filtered;
  };
  
  const getStatusBadge = (status: 'active' | 'inactive') => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
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
  
  const filteredTeams = filterTeams();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
          <p className="text-gray-500">Create and manage cricket teams</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
              <DialogDescription>
                {selectedTeam ? 'Update team information' : 'Fill in the details to create a new cricket team'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    placeholder="Team name" 
                    defaultValue={selectedTeam?.name || ''}
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="captain" className="text-right">
                    Captain
                  </Label>
                  <Input 
                    id="captain" 
                    className="col-span-3" 
                    placeholder="Team captain" 
                    defaultValue={selectedTeam?.captain || ''}
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="coach" className="text-right">
                    Coach
                  </Label>
                  <Input 
                    id="coach" 
                    className="col-span-3" 
                    placeholder="Team coach" 
                    defaultValue={selectedTeam?.coach || ''}
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select defaultValue={selectedTeam?.status || 'active'}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="logo" className="text-right">
                    Team Logo
                  </Label>
                  <div className="col-span-3">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">SVG, PNG, JPG (MAX. 800x800px)</p>
                        </div>
                        <input id="logo" type="file" className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">{selectedTeam ? 'Update Team' : 'Create Team'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Teams</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teams..."
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
                <TableHead>Team Name</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Tournaments</TableHead>
                <TableHead className="text-center">W/L</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <span>{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{team.captain}</TableCell>
                    <TableCell>{team.coach}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        {team.players}
                      </div>
                    </TableCell>
                    <TableCell>{team.tournaments}</TableCell>
                    <TableCell className="text-center">{team.wins}/{team.losses}</TableCell>
                    <TableCell>{getStatusBadge(team.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.id)}>
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
            Showing {filteredTeams.length} of {teams.length} teams
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeamManagement;
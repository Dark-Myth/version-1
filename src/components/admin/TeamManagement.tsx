import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Users, Upload, UserCircle, Globe, Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface Team {
  id: string;
  teamName: string;
  shortCode?: string;
  logo?: string;
  captain?: string;
  coach: string;
  players: number;
  playerCount?: number; // Add this field to handle both formats
  status: 'active' | 'inactive';
  tournament?: {
    id: string;
    name: string;
  };
  tournament_id?: string;
  wins?: number;
  losses?: number;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface TeamManagementProps {
  adminId: string;
}

interface Player {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  status: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
  stats: any;
}

interface AvailablePlayer {
  id: string;
  playerName: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  status: string;
}

interface TeamWithPlayers extends Team {
  players: Player[];
}

const TeamManagement: React.FC<TeamManagementProps> = ({ adminId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [openPlayersDialog, setOpenPlayersDialog] = useState(false);
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<TeamWithPlayers | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [globalMode, setGlobalMode] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [tournamentFilter, setTournamentFilter] = useState<string>('all'); // Change default value to 'all' instead of empty string
  const itemsPerPage = 5; // Number of teams to display per page
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<string[]>([]);
  const [loadingAvailablePlayers, setLoadingAvailablePlayers] = useState(false);
  const [openManagePlayersDialog, setOpenManagePlayersDialog] = useState(false);
  const [selectedPlayerTeamId, setSelectedPlayerTeamId] = useState<string | null>(null);
  const [searchPlayerQuery, setSearchPlayerQuery] = useState('');
  const [isSavingPlayers, setIsSavingPlayers] = useState(false);
  
  // Fetch teams and tournaments on component mount
  useEffect(() => {
    fetchTeams();
    fetchTournaments();
  }, [adminId, debouncedSearchQuery, activeTab, globalMode, tournamentFilter]);
  
  // Debounce search query to prevent excessive API calls
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  // Set default tournament when tournaments are loaded
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament && !selectedTeam) {
      const latestTournament = tournaments[0]; // Assuming tournaments are sorted by date
      setSelectedTournament(latestTournament.id);
    }
  }, [tournaments, selectedTournament, selectedTeam]);
  
  // Add this function to manually control dialog state
  const handleOpenNewTeamDialog = () => {
    console.log("Opening new team dialog");
    setSelectedTeam(null);
    setOpenDialog(true);
  };
  
  // Enhance the fetchTeams function with better error handling and tournament filtering
  const fetchTeams = async () => {
    try {
      setLoading(true);
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (debouncedSearchQuery) queryParams.append('search', debouncedSearchQuery);
      if (activeTab !== 'all') queryParams.append('status', activeTab);
      if (globalMode) queryParams.append('global', 'true');
      if (tournamentFilter && tournamentFilter !== 'all' && !globalMode) queryParams.append('tournamentId', tournamentFilter);
      
      console.log(`Fetching teams with params: ${queryParams.toString()}`);
      const response = await fetch(`/api/management/teams?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch teams: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched teams:", data);
      
      // Normalize the players count
      const normalizedTeams = data.map((team: any) => ({
        ...team,
        players: team.playerCount || team.players || 0
      }));
      
      setTeams(normalizedTeams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/management/tournaments');
      
      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      
      const data = await response.json();
      // Filter only upcoming and ongoing tournaments for team creation
      const availableTournaments = data.filter(
        (tournament: any) => ['upcoming', 'ongoing'].includes(tournament.status)
      );
      
      // Sort tournaments by most recent first
      const sortedTournaments = availableTournaments.sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      
      setTournaments(sortedTournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast.error("Failed to load tournaments");
    }
  };
  
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTournament) {
      toast.error("Please select a tournament");
      return;
    }
    
    const form = e.target as HTMLFormElement;
    setIsFormSubmitting(true);
    
    try {
      const teamName = (form.elements.namedItem('name') as HTMLInputElement)?.value;
      const shortCode = (form.elements.namedItem('shortCode') as HTMLInputElement)?.value;
      const coach = (form.elements.namedItem('coach') as HTMLInputElement)?.value;
      const status = (form.elements.namedItem('status') as HTMLSelectElement)?.value || 'active';
      
      if (!teamName || !teamName.trim()) {
        toast.error("Team name is required");
        return;
      }
      
      // Extract form values
      const formValues = {
        teamName: teamName.trim(),
        shortCode: shortCode?.trim() || undefined,
        coach: coach?.trim() || "TBD",
        status: status,
        tournament_id: selectedTournament,
      };
      
      console.log("Creating team with values:", formValues);
      
      const response = await fetch('/api/management/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to create team');
      }

      const responseData = await response.json();
      console.log("Team created:", responseData);
      
      toast.success('Team created successfully');
      setOpenDialog(false);
      fetchTeams();
      form.reset();
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast.error(error.message || 'Failed to create team');
    } finally {
      setIsFormSubmitting(false);
    }
  };
  
  const handleEditTeam = async (team: Team) => {
    try {
      const response = await fetch(`/api/management/teams/${team.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch team details");
      }
      
      const fullTeam = await response.json();
      setSelectedTeam(fullTeam);
      setSelectedTournament(fullTeam.tournament?.id || '');
      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching team details:", error);
      toast.error("Failed to load team details");
    }
  };
  
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    const form = e.target as HTMLFormElement;
    
    try {
      // Extract form values
      const formValues = {
        teamName: form.name.value,
        shortCode: form.shortCode.value || undefined,
        coach: form.coach.value,
        status: form.status.value,
      };
      
      const response = await fetch(`/api/management/teams?id=${selectedTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team');
      }

      toast.success('Team updated successfully');
      setOpenDialog(false);
      setSelectedTeam(null);
      setSelectedTournament('');
      fetchTeams();
    } catch (error: any) {
      console.error("Error updating team:", error);
      toast.error(error.message || 'Failed to update team');
    }
  };
  
  const handleOpenDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
    setOpenDeleteDialog(true);
  };
  
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    try {
      const response = await fetch(`/api/management/teams?id=${teamToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      toast.success('Team deleted successfully');
      setOpenDeleteDialog(false);
      setTeamToDelete(null);
      fetchTeams();
    } catch (error: any) {
      console.error("Error deleting team:", error);
      toast.error(error.message || 'Failed to delete team');
    }
  };
  
  // Fix the handleViewTeamPlayers function to correctly fetch and display team players
  const handleViewTeamPlayers = async (teamId: string) => {
    try {
      console.log(`Fetching team details for ID: ${teamId}`);
      setLoadingPlayers(true);
      setOpenPlayersDialog(true); // Open dialog immediately to show loading state
      
      // Add a delay to ensure dialog renders before fetch starts
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(`/api/management/teams/${teamId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        console.error(`Error response status: ${response.status}`);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch team details: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Team details received:", data);
      
      if (!data.players) {
        console.warn("No players array in team response");
        data.players = [];
      }
      
      setSelectedTeamDetails(data);
    } catch (error) {
      console.error("Error fetching team details:", error);
      toast.error("Failed to load team details");
    } finally {
      setLoadingPlayers(false);
    }
  };
  
  const filterTeams = () => {
    let filtered = [...teams];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(team => 
        team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.captain && team.captain.toLowerCase().includes(searchQuery.toLowerCase()))
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
  
  // Function to get current page items
  const getCurrentPageItems = () => {
    const filtered = filterTeams();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };
  
  const getStatusBadge = (status: 'active' | 'inactive') => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
      default:
        return null;
    }
  };
  
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedTeam(null);
    setSelectedTournament('');
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'batsman':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Batsman</Badge>;
      case 'bowler':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Bowler</Badge>;
      case 'all-rounder':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">All-rounder</Badge>;
      case 'wicket-keeper':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Wicket-keeper</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{role}</Badge>;
    }
  };
  
  const getPlayerStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'injured':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Injured</Badge>;
      case 'retired':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Retired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const fetchAvailablePlayers = async (teamId: string) => {
    try {
      setLoadingAvailablePlayers(true);
      console.log(`Fetching available players for team ID: ${teamId}`);
      
      const response = await fetch(`/api/management/players/available?teamId=${teamId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        console.error(`Error response status: ${response.status}`);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to fetch available players: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Available players:", data);
      setAvailablePlayers(data);
    } catch (error) {
      console.error("Error fetching available players:", error);
      toast.error("Failed to load available players");
    } finally {
      setLoadingAvailablePlayers(false);
    }
  };
  
  const handleOpenManagePlayers = async (teamId: string) => {
    setSelectedPlayerTeamId(teamId);
    setOpenManagePlayersDialog(true);
    setSelectedPlayersToAdd([]);
    
    // Fetch available players
    await fetchAvailablePlayers(teamId);
    
    // Also fetch current team details to see existing players
    await handleViewTeamPlayers(teamId);
  };
  
  const handleAddPlayersToTeam = async () => {
    if (!selectedPlayerTeamId || selectedPlayersToAdd.length === 0) return;
    
    try {
      setIsSavingPlayers(true);
      console.log(`Adding ${selectedPlayersToAdd.length} players to team ID: ${selectedPlayerTeamId}`);
      
      const response = await fetch(`/api/management/teams/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: selectedPlayerTeamId,
          playerIds: selectedPlayersToAdd
        }),
      });
      
      const data = await response.json();
      console.log("Response from add players API:", data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add players to team');
      }
      
      if (data.addedCount === 0) {
        if (data.alreadyInTeam === selectedPlayersToAdd.length) {
          toast.warning('All selected players are already in this team');
        } else {
          toast.warning('Could not add any players. They might be in other teams.');
        }
      } else {
        toast.success(`Added ${data.addedCount} player(s) to team`);
      }
      
      // Refresh the team details and available players
      await fetchAvailablePlayers(selectedPlayerTeamId);
      await handleViewTeamPlayers(selectedPlayerTeamId);
      
      // Clear selection
      setSelectedPlayersToAdd([]);
    } catch (error: any) {
      console.error("Error adding players:", error);
      toast.error(error.message || 'Failed to add players');
    } finally {
      setIsSavingPlayers(false);
    }
  };
  
  const handleRemovePlayerFromTeam = async (teamId: string, playerId: string, playerName: string) => {
    try {
      const confirmRemove = window.confirm(`Are you sure you want to remove ${playerName} from this team?`);
      if (!confirmRemove) return;
      
      const response = await fetch(`/api/management/teams/players`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          playerId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove player from team');
      }
      
      toast.success(`Removed ${playerName} from team`);
      
      // Refresh the team details and available players
      if (openManagePlayersDialog) {
        await fetchAvailablePlayers(teamId);
      }
      await handleViewTeamPlayers(teamId);
    } catch (error: any) {
      console.error("Error removing player:", error);
      toast.error(error.message || 'Failed to remove player');
    }
  };
  
  const handleDesignateRole = async (teamId: string, playerId: string, role: 'captain' | 'viceCaptain' | 'wicketKeeper', playerName: string) => {
    try {
      const confirmUpdate = window.confirm(`Are you sure you want to make ${playerName} the ${role === 'viceCaptain' ? 'Vice Captain' : role === 'wicketKeeper' ? 'Wicket Keeper' : 'Captain'}?`);
      if (!confirmUpdate) return;
      
      const response = await fetch(`/api/management/teams/player-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          playerId,
          role
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update player role`);
      }
      
      toast.success(`Updated team ${role === 'viceCaptain' ? 'Vice Captain' : role === 'wicketKeeper' ? 'Wicket Keeper' : 'Captain'}`);
      
      // Refresh the team details
      await handleViewTeamPlayers(teamId);
    } catch (error: any) {
      console.error("Error updating player role:", error);
      toast.error(error.message || 'Failed to update player role');
    }
  };
  
  const filteredAvailablePlayers = availablePlayers.filter(player => 
    searchPlayerQuery === '' || 
    player.playerName.toLowerCase().includes(searchPlayerQuery.toLowerCase()) ||
    player.role.toLowerCase().includes(searchPlayerQuery.toLowerCase())
  );

  if (loading && teams.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  const filteredTeams = filterTeams();
  const currentPageItems = getCurrentPageItems();
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
          <p className="text-gray-500">Create and manage cricket teams</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          {/* Replace DialogTrigger with a regular button that calls our handler */}
          <Button className="whitespace-nowrap" onClick={handleOpenNewTeamDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
              <DialogDescription>
                {selectedTeam ? 'Update team information' : 'Fill in the details to create a new cricket team'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={selectedTeam ? handleUpdateTeam : handleCreateTeam}>
              <div className="grid gap-4 py-4">
                {!selectedTeam && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tournament" className="text-right">
                      Tournament
                    </Label>
                    <div className="col-span-3">
                      <Select 
                        value={selectedTournament} 
                        onValueChange={setSelectedTournament}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tournament" />
                        </SelectTrigger>
                        <SelectContent>
                          {tournaments.length > 0 ? (
                            tournaments.map(tournament => (
                              <SelectItem key={tournament.id} value={tournament.id}>
                                {tournament.name} - {tournament.status}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No tournaments available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {tournaments.length === 0 && (
                        <p className="text-xs text-amber-500 mt-1">
                          No active tournaments available. Please create a tournament first.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input 
                    id="name" 
                    name="name"
                    className="col-span-3" 
                    placeholder="Team name" 
                    defaultValue={selectedTeam?.teamName || ''}
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="shortCode" className="text-right">
                    Short Code
                  </Label>
                  <Input 
                    id="shortCode" 
                    name="shortCode"
                    className="col-span-3" 
                    placeholder="e.g. RCB, CSK (max 5 chars)" 
                    defaultValue={selectedTeam?.shortCode || ''}
                    maxLength={5}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="coach" className="text-right">
                    Coach
                  </Label>
                  <Input 
                    id="coach" 
                    name="coach"
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
                  <Select 
                    name="status"
                    defaultValue={selectedTeam?.status || 'active'}
                  >
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
                        <input id="logo" name="logo" type="file" className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isFormSubmitting || (!selectedTeam && (!selectedTournament || tournaments.length === 0))}
                >
                  {isFormSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" /> 
                      {selectedTeam ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    selectedTeam ? 'Update Team' : 'Create Team'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="flex items-center gap-4">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Teams</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {!globalMode && tournaments.length > 0 && (
            <Select
              value={tournamentFilter}
              onValueChange={setTournamentFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Tournaments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tournaments</SelectItem> {/* Changed from empty string to 'all' */}
                {tournaments.map(tournament => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={globalMode}
              onCheckedChange={(checked) => {
                setGlobalMode(checked);
                if (checked) {
                  setTournamentFilter('all'); // Update to use 'all' instead of empty string
                }
              }}
              id="global-mode"
            />
            <Label htmlFor="global-mode" className="cursor-pointer text-sm flex items-center">
              <Globe className="h-4 w-4 mr-1 text-blue-500" />
              Global View
            </Label>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teams..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Tournament</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                currentPageItems.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <Button 
                        variant="ghost" 
                        className="p-0 h-auto flex items-center space-x-2 text-left font-medium hover:text-blue-600"
                        onClick={() => {
                          console.log(`Viewing players for team: ${team.id}`);
                          handleViewTeamPlayers(team.id);
                        }}
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <span>{team.teamName}</span>
                      </Button>
                    </TableCell>
                    <TableCell>{team.tournament?.name || 'N/A'}</TableCell>
                    <TableCell>{team.coach}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        {team.players}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(team.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering parent click events
                          handleOpenManagePlayers(team.id);
                          }}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDeleteDialog(team)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min(currentPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams
          </div>
          <div className="flex items-center gap-2">
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
        </CardFooter>
      </Card>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete the team &quot;{teamToDelete?.teamName}&quot;? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Players Dialog - Fixed to display players correctly */}
      <Dialog 
        open={openPlayersDialog} 
        onOpenChange={(open) => {
          console.log(`Setting players dialog to: ${open}`);
          if (!open) {
            setSelectedTeamDetails(null);
          }
          setOpenPlayersDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 text-blue-500 mr-2" />
              {selectedTeamDetails?.teamName} - Players
            </DialogTitle>
            <DialogDescription>
              {selectedTeamDetails?.tournament?.name ? `${selectedTeamDetails.tournament.name} • ` : ''}
              {selectedTeamDetails?.players ? selectedTeamDetails.players.length : 0} Players
            </DialogDescription>
          </DialogHeader>
          
          {loadingPlayers ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
            </div>
          ) : selectedTeamDetails?.players?.length === 0 ? (
            <div className="text-center py-8">
              <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No players in this team</p>
              <Button 
                variant="outline"
                className="mt-4"
                onClick={() => {
                  if (selectedTeamDetails) {
                    handleOpenManagePlayers(selectedTeamDetails.id);
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Players
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedTeamDetails) {
                      handleOpenManagePlayers(selectedTeamDetails.id);
                    }
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Players
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Batting Style</TableHead>
                    <TableHead>Bowling Style</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTeamDetails?.players?.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <div className="flex space-x-1 mt-1">
                              {player.isCaptain && (
                                <Badge variant="outline" className="text-xs px-1 border-amber-300 text-amber-700">C</Badge>
                              )}
                              {player.isViceCaptain && (
                                <Badge variant="outline" className="text-xs px-1 border-blue-300 text-blue-700">VC</Badge>
                              )}
                              {player.isWicketKeeper && (
                                <Badge variant="outline" className="text-xs px-1 border-red-300 text-red-700">WK</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(player.role)}</TableCell>
                      <TableCell>{player.battingStyle || 'N/A'}</TableCell>
                      <TableCell>{player.bowlingStyle || 'N/A'}</TableCell>
                      <TableCell>{getPlayerStatusBadge(player.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select
                            onValueChange={(value) => {
                              if (selectedTeamDetails && value !== 'none') {
                                handleDesignateRole(
                                  selectedTeamDetails.id, 
                                  player.id, 
                                  value as 'captain' | 'viceCaptain' | 'wicketKeeper',
                                  player.name
                                );
                              }
                            }}
                            value="none"
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" disabled>Assign Role</SelectItem>
                              <SelectItem value="captain">Captain</SelectItem>
                              <SelectItem value="viceCaptain">Vice Captain</SelectItem>
                              <SelectItem value="wicketKeeper">Wicket Keeper</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 p-0 h-8 w-8"
                            onClick={() => {
                              if (selectedTeamDetails) {
                                handleRemovePlayerFromTeam(selectedTeamDetails.id, player.id, player.name);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPlayersDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Players Dialog */}
      <Dialog 
        open={openManagePlayersDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlayersToAdd([]);
          }
          setOpenManagePlayersDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Team Players</DialogTitle>
            <DialogDescription>
              Add players to the team by selecting from the list below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search players..."
                  className="pl-8"
                  value={searchPlayerQuery}
                  onChange={(e) => setSearchPlayerQuery(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleAddPlayersToTeam}
                disabled={selectedPlayersToAdd.length === 0 || isSavingPlayers}
              >
                {isSavingPlayers ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" /> 
                    Adding...
                  </span>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected Players
                  </>
                )}
              </Button>
              </div>
            </div>
            
            {loadingAvailablePlayers ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
              </div>
            ) : filteredAvailablePlayers.length === 0 ? (
              <div className="text-center py-8">
                <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No available players found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedPlayersToAdd.length === filteredAvailablePlayers.length && filteredAvailablePlayers.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlayersToAdd(filteredAvailablePlayers.map(player => player.id));
                          } else {
                            setSelectedPlayersToAdd([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Batting Style</TableHead>
                    <TableHead>Bowling Style</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailablePlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedPlayersToAdd.includes(player.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPlayersToAdd(prev => [...prev, player.id]);
                            } else {
                              setSelectedPlayersToAdd(prev => prev.filter(id => id !== player.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {getInitials(player.playerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.playerName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(player.role)}</TableCell>
                      <TableCell>{player.battingStyle || 'N/A'}</TableCell>
                      <TableCell>{player.bowlingStyle || 'N/A'}</TableCell>
                      <TableCell>{getPlayerStatusBadge(player.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenManagePlayersDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;

import React, { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, Search,
  Clock, MapPin, CalendarDays, Shield, 
  X, Loader2, RefreshCw, CheckCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define interfaces for our data types
interface Match {
  _id: string;
  tournament_id: {
    _id: string;
    tournamentName: string;
  };
  team1: {
    _id: string;
    teamName: string;
    logo?: string;
  };
  team2: {
    _id: string;
    teamName: string;
    logo?: string;
  };
  venue: string;
  date: string;
  time: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'tied';
  innings?: {
    _id: string;
    battingTeam: string;
    totalRuns: number;
    wickets: number;
    overs: number;
  }[];
  match_format: 'T10' | 'T20' | 'ODI' | 'Test';
  handler: {
    _id: string;
    name: string;
  };
  winningTeam?: string;
  cancellationReason?: string;
  match_type: string;
  overs?: number;
  
  // Client-side aliases for compatibility
  id?: string;
}

// Update Tournament interface to match the actual data structure
interface Tournament {
  _id: string;
  id?: string;
  tournamentName: string;
  status: string;
  userManagers?: {
    _id: string;
    name: string;
  }[];
  teams?: number; // Number of teams, not array of team IDs
}

interface Team {
  _id: string;
  teamName: string;
  logo?: string;
}

interface User {
  _id: string;
  name: string;
  role?: string;
}

interface MatchSchedulingProps {
  adminId: string;
}

const MatchScheduling: React.FC<MatchSchedulingProps> = ({ adminId }) => {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [tournamentManagers, setTournamentManagers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    tournament_id: '',
    team1: '',
    team2: '',
    venue: '',
    date: '',
    time: '',
    match_type: 'cricket-club',
    match_format: 'T20',
    overs: 20,
    status: 'scheduled',
    handler: '',
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 5;
  
  // Add state for tournament teams
  const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
  
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
  
  useEffect(() => {
    Promise.all([
      fetchMatches(),
      fetchTournaments(),
      fetchTeams(),
    ]).catch(err => {
      console.error('Error loading initial data:', err);
      toast.error('Failed to load data');
    }).finally(() => {
      setLoading(false);
    });
  }, [adminId, debouncedSearchQuery, activeTab]);
  
  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (debouncedSearchQuery) queryParams.append('search', debouncedSearchQuery);
      if (activeTab !== 'all') queryParams.append('status', activeTab);
      
      const response = await fetch(`/api/matches?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch matches');
      }
      
      const data = await response.json();
      console.log("Raw matches data:", data);
      
      // Use the original data without transformation
      // Just add the id alias for compatibility
      const matchesWithIdAlias = data.map((match: any) => ({
        ...match,
        id: match._id,
        tournament_id: {
          ...match.tournament_id,
          id: match.tournament_id?._id
        },
        team1: {
          ...match.team1,
          id: match.team1?._id
        },
        team2: {
          ...match.team2,
          id: match.team2?._id
        },
        innings: match.innings?.map((inning: any) => ({
          ...inning,
          id: inning._id
        })),
        handler: {
          ...match.handler,
          id: match.handler?._id
        }
      }));
      
      console.log("Matches with ID aliases:", matchesWithIdAlias);
      setMatches(matchesWithIdAlias);
      return matchesWithIdAlias;
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to fetch matches');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/management/tournaments');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tournaments');
      }
      
      const data = await response.json();
      console.log("Raw tournaments data:", data);
      
      // Transform API response to match our interface - include userManagers
      const transformedData = data.map((tournament: any) => ({
        id: tournament._id,
        _id: tournament._id,
        tournamentName: tournament.tournamentName,
        status: tournament.status,
        userManagers: tournament.userManagers || [],
        teams: tournament.teams // This is a number, not an array
      }));
      
      setTournaments(transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to fetch tournaments');
      return [];
    }
  };
  
  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch teams');
      }
      
      const data = await response.json();
      
      // Transform API response to match our interface
      const transformedData = data.map((team: any) => ({
        id: team._id,
        teamName: team.teamName,
        logo: team.logo
      }));
      
      setTeams(transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
      return [];
    }
  };
  
// Update the fetchTeamsForTournament function with better error handling
const fetchTeamsForTournament = async (tournamentId: string) => {
  if (!tournamentId) {
    console.warn("Attempted to fetch teams with empty tournament ID");
    setFilteredTeams([]);
    return;
  }
  
  try {
    setLoading(true);
    console.log(`Fetching teams for tournament ${tournamentId}`);
    
    // Use the dedicated API endpoint for tournament teams
    const response = await fetch(`/api/management/tournaments/${tournamentId}/teams`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch teams: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Teams loaded for tournament ${tournamentId}:`, data);
    
    if (Array.isArray(data)) {
      // Transform data to ensure it has the expected format
      const transformedData = data.map((team) => ({
        _id: team._id,
        id: team._id, // Add id as an alias for compatibility
        teamName: team.teamName || "Unknown Team",
        shortCode: team.shortCode || "",
        logo: team.logo || ""
      }));
      
      setTournamentTeams(transformedData);
      setFilteredTeams(transformedData);
      
      if (transformedData.length < 2) {
        toast.warning("This tournament needs at least 2 teams to schedule matches");
      } else {
        toast.success(`Loaded ${transformedData.length} teams for the tournament`);
      }
      
      return transformedData;
    } else {
      console.error("Expected array of teams but got:", typeof data);
      toast.error("Invalid team data received from server");
      setTournamentTeams([]);
      setFilteredTeams([]);
      return [];
    }
  } catch (error) {
    console.error("Error fetching teams for tournament:", error);
    toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    setTournamentTeams([]);
    setFilteredTeams([]);
    return [];
  } finally {
    setLoading(false);
  }
};

// Update function to fetch managers for a tournament and populate selector
const fetchManagersForTournament = async (tournamentId: string) => {
  if (!tournamentId) {
    console.warn("Attempted to fetch managers with empty tournament ID");
    setTournamentManagers([{_id: adminId, name: "You (Admin)"}]);
    return;
  }
  
  try {
    console.log("Fetching managers for tournament:", tournamentId);
    
    // Use the dedicated API endpoint for tournament managers
    const response = await fetch(`/api/management/tournaments/${tournamentId}/managers`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch managers: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Managers for tournament ${tournamentId}:`, data);
    
    if (Array.isArray(data) && data.length > 0) {
      // Make sure data has the expected format
      const formattedManagers = data.map((manager) => ({
        _id: manager._id,
        name: manager.name || "Unknown Manager"
      }));
      
      console.log("Setting tournament managers:", formattedManagers);
      setTournamentManagers(formattedManagers);
      
      // If admin is one of the managers, set as default handler
      const isAdminManager = formattedManagers.some(m => m._id === adminId);
      if (isAdminManager) {
        setFormData(prev => ({
          ...prev,
          handler: adminId
        }));
      } else if (formattedManagers.length > 0) {
        // Otherwise set first manager as default
        setFormData(prev => ({
          ...prev,
          handler: formattedManagers[0]._id
        }));
      }
    } else {
      // Fall back to using the admin as the only manager
      console.warn("No managers found for tournament, using admin as default");
      setTournamentManagers([{_id: adminId, name: "You (Admin)"}]);
      
      setFormData(prev => ({
        ...prev,
        handler: adminId
      }));
    }
  } catch (error) {
    console.error(`Error fetching managers for tournament ${tournamentId}:`, error);
    // Fall back to using the admin as the manager
    setTournamentManagers([{_id: adminId, name: "You (Admin)"}]);
    
    setFormData(prev => ({
      ...prev,
      handler: adminId
    }));
  }
};

// Replace handleTournamentChange function to be more robust
const handleTournamentChange = async (tournamentId: string) => {
  console.log("Tournament changed to:", tournamentId);
  
  // Reset form state for team fields
  setFormData(prev => ({
    ...prev,
    team1: '',
    team2: '',
    tournament_id: tournamentId,
    // Set the logged-in admin as default handler
    handler: adminId
  }));
  
  if (!tournamentId) {
    setFilteredTeams([]);
    setTournamentTeams([]);
    setTournamentManagers([]);
    return;
  }
  
  try {
    // Show loading state
    setLoading(true);
    
    // Fetch teams first to update the UI
    await fetchTeamsForTournament(tournamentId);
    
    // Then fetch managers (less critical for immediate UI)
    await fetchManagersForTournament(tournamentId);
  } catch (error) {
    console.error("Error in handleTournamentChange:", error);
    toast.error("Failed to load tournament data");
  } finally {
    setLoading(false);
  }
};

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

// Replace the handleSelectChange function to prevent duplicate team selections
const handleSelectChange = (name: string, value: string) => {
  if (name === 'tournament_id') {
    // When tournament changes, fetch teams and reset team selections
    handleTournamentChange(value);
  } else if (name === 'team1') {
    // If team1 is selected, make sure it's not the same as team2
    if (value === formData.team2) {
      setFormData(prev => ({ 
        ...prev,
        [name]: value,
        team2: '', // Clear team2 if it's the same as the selected team1
      }));
      toast.warning("Teams cannot be the same - please select a different second team");
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  } else if (name === 'team2') {
    // If team2 is selected, make sure it's not the same as team1
    if (value === formData.team1) {
      toast.warning("Teams cannot be the same - please select a different team");
      return; // Don't update the state if teams would be the same
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  } else {
    // For all other fields, just update normally
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

const resetForm = () => {
  setFormData({
    tournament_id: '',
    team1: '',
    team2: '',
    venue: '',
    date: '',
    time: '',
    match_type: 'cricket-club',
    match_format: 'T20',
    overs: 20,
    status: 'scheduled',
    handler: adminId,
  });
  setFilteredTeams(teams);
  setTournamentManagers([]);
  setSelectedMatch(null);
};

const handleOpenNewMatchDialog = () => {
  resetForm();
  setOpenDialog(true);
};

const handleCreateMatch = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation
  if (formData.team1 === formData.team2) {
    toast.error("Teams cannot be the same");
    return;
  }
  
  if (!formData.tournament_id || !formData.team1 || !formData.team2 || !formData.venue || 
      !formData.date || !formData.time || !formData.handler) {
    toast.error("Please fill all required fields");
    return;
  }
  
  try {
    setActionLoading(true);
    
    const payload = {
      ...formData,
      handler: formData.handler || adminId, // Use selected handler or default to adminId
      overs: parseInt(String(formData.overs))
    };
    
    const response = await fetch('/api/management/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match');
    }
    
    // Refresh the matches list instead of trying to update state directly
    await fetchMatches();
    toast.success("Match scheduled successfully");
    
    setOpenDialog(false);
    resetForm();
  } catch (error) {
    console.error('Error creating match:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create match');
  } finally {
    setActionLoading(false);
  }
};

const handleEditMatch = async (match: Match) => {
  setSelectedMatch(match);
  
  // First set the tournament, then load the teams
  await handleTournamentChange(match.tournament_id._id);
  
  setFormData({
    tournament_id: match.tournament_id._id,
    team1: match.team1._id,
    team2: match.team2._id,
    venue: match.venue,
    date: new Date(match.date).toISOString().split('T')[0],
    time: match.time,
  
    match_type: match.match_type,
    match_format: match.match_format,
    overs: match.overs || 20,
    status: match.status,
    handler: match.handler?._id || adminId,
  });
  
  setOpenDialog(true);
};

const handleUpdateMatch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedMatch) return;
  
  // Validation
  if (formData.team1 === formData.team2) {
    toast.error("Teams cannot be the same");
    return;
  }
  
  try {
    setActionLoading(true);
    
    const payload = {
      id: selectedMatch.id,
      ...formData,
      overs: parseInt(String(formData.overs))
    };
    
    const response = await fetch('/api/management/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update match');
    }
    
    // Refresh the matches list instead of trying to update state directly
    await fetchMatches();
    
    toast.success("Match updated successfully");
    setOpenDialog(false);
    resetForm();
  } catch (error) {
    console.error('Error updating match:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update match');
  } finally {
    setActionLoading(false);
  }
};

const handleOpenDeleteDialog = (match: Match) => {
  setMatchToDelete(match);
  setOpenDeleteDialog(true);
};

const handleDeleteMatch = async () => {
  if (!matchToDelete) return;
  
  try {
    setActionLoading(true);
    
    const response = await fetch(`/api/management/matches?id=${matchToDelete.id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete match');
    }
    
    // Refresh matches list instead of updating state directly
    await fetchMatches();
    toast.success("Match deleted successfully");
    setOpenDeleteDialog(false);
    setMatchToDelete(null);
  } catch (error) {
    console.error('Error deleting match:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to delete match');
  } finally {
    setActionLoading(false);
  }
};

const handleCancelMatch = async (match: Match) => {
  // Ask for cancellation reason
  const reason = prompt("Please provide a reason for cancellation:");
  if (!reason) return;
  
  try {
    setActionLoading(true);
    
    const response = await fetch('/api/management/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: match.id,
        status: 'cancelled',
        cancellationReason: reason
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel match');
    }
    
    // Refresh matches list instead of updating state directly
    await fetchMatches();
    
    toast.success("Match cancelled successfully");
  } catch (error) {
    console.error('Error cancelling match:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to cancel match');
  } finally {
    setActionLoading(false);
  }
};

const handleStartMatch = async (match: Match) => {
  try {
    setActionLoading(true);
    
    const response = await fetch('/api/management/matches', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: match.id,
        status: 'ongoing'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start match');
    }
    
    // Redirect to match scoring page
  } catch (error) {
    console.error('Error starting match:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to start match');
    setActionLoading(false);
  }
};

const filterMatches = () => {
  let filtered = [...matches];
  
  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(match => 
      match.team1.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.team2.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.tournament_id.tournamentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Filter by tab
  if (activeTab === 'today') {
    filtered = filtered.filter(match => isToday(parseISO(match.date)));
  } else if (activeTab === 'upcoming') {
    filtered = filtered.filter(match => 
      isFuture(parseISO(match.date)) && match.status === 'scheduled'
    );
  } else if (activeTab === 'completed') {
    filtered = filtered.filter(match => match.status === 'completed' || match.status === 'tied');
  } else if (activeTab === 'cancelled') {
    filtered = filtered.filter(match => match.status === 'cancelled');
  }
  
  return filtered;
};

// Function to get current page items
const getCurrentPageItems = () => {
  const filtered = filterMatches();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filtered.slice(startIndex, endIndex);
};

const getStatusBadge = (status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'tied', date: string) => {
  const isMatchToday = isToday(parseISO(date));
  const isMatchPast = isPast(parseISO(date));
  
  switch (status) {
    case 'scheduled':
      if (isMatchToday) {
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Today</Badge>;
      } else if (isMatchPast) {
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      } else {
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Scheduled</Badge>;
      }
    case 'ongoing':
      return <Badge className="bg-green-50 text-green-700 border-green-200">Live</Badge>;
    case 'completed':
      return <Badge className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
    case 'tied':
      return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Tied</Badge>;
    default:
      return null;
  }
};

const getMatchScore = (match: Match) => {
  if (!match.innings || match.innings.length === 0) {
    return '-';
  }
  
  // For debugging
  console.log("Match ID:", match._id);
  console.log("Innings:", match.innings);
  
  try {
    // Group innings by team - use direct string comparison with match.team1._id and match.team2._id
    const team1Innings = match.innings.filter(i => 
      String(i.battingTeam) === String(match.team1._id)
    );
    
    const team2Innings = match.innings.filter(i => 
      String(i.battingTeam) === String(match.team2._id)
    );
    
    const team1Score = team1Innings.length > 0 ? 
      `${team1Innings[0].totalRuns}/${team1Innings[0].wickets} (${team1Innings[0].overs})` : '-';
      
    const team2Score = team2Innings.length > 0 ? 
      `${team2Innings[0].totalRuns}/${team2Innings[0].wickets} (${team2Innings[0].overs})` : '-';
      
    return (
      <div className="flex flex-col text-xs">
        <span>{team1Score}</span>
        <span>{team2Score}</span>
      </div>
    );
  } catch (error) {
    console.error("Error displaying match score:", error);
    return <div className="text-xs text-red-500">Error displaying score</div>;
  }
};

if (loading && matches.length === 0) {
  return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
    </div>
  );
}

const filteredMatches = filterMatches();
const currentPageItems = getCurrentPageItems();
const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);

return (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Match Scheduling</h2>
        <p className="text-gray-500">Schedule and manage cricket matches</p>
      </div>
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <Button className="whitespace-nowrap" onClick={handleOpenNewMatchDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Match
        </Button>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedMatch ? 'Edit Match' : 'Schedule New Match'}</DialogTitle>
            <DialogDescription>
              {selectedMatch ? 'Update match details' : 'Fill in the details to schedule a new match'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={selectedMatch ? handleUpdateMatch : handleCreateMatch}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tournament_id" className="text-right">
                  Tournament
                </Label>
                <Select 
                  value={formData.tournament_id} 
                  onValueChange={(value) => handleSelectChange('tournament_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id || tournament._id}>
                        {tournament.tournamentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="handler" className="text-right">
                  Match Handler
                </Label>
                <Select 
                  value={formData.handler || adminId} 
                  onValueChange={(value) => handleSelectChange('handler', value)}
                  disabled={!formData.tournament_id}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={formData.tournament_id ? "Select handler" : "Select tournament first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tournamentManagers.length > 0 ? (
                      tournamentManagers.map((manager) => (
                        <SelectItem key={manager._id} value={manager._id}>
                          {manager.name} {manager._id === adminId ? "(You)" : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={adminId}>You (Admin)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="team1" className="text-right">
                  Team 1
                </Label>
                <Select 
                  value={formData.team1} 
                  onValueChange={(value) => handleSelectChange('team1', value)}
                  disabled={!formData.tournament_id || filteredTeams.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={formData.tournament_id ? 
                      (filteredTeams.length > 0 ? "Select team" : "No teams available") : 
                      "Select tournament first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams.map((team) => (
                      <SelectItem key={team._id || team.id} value={team._id || team.id}>
                        {team.teamName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="team2" className="text-right">
                  Team 2
                </Label>
                <Select 
                  value={formData.team2} 
                  onValueChange={(value) => handleSelectChange('team2', value)}
                  disabled={!formData.tournament_id}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={formData.tournament_id ? "Select team" : "Select tournament first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams
                      .filter(team => team.id !== formData.team1) // Don't allow selecting the same team
                      .map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.teamName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">
                  Venue
                </Label>
                <Input 
                  id="venue"
                  name="venue"
                  className="col-span-3"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="Enter venue name" 
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input 
                  id="date"
                  name="date"
                  type="date" 
                  className="col-span-3"
                  value={formData.date}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Input 
                  id="time"
                  name="time"
                  type="time" 
                  className="col-span-3"
                  value={formData.time}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="match_format" className="text-right">
                  Format
                </Label>
                <Select 
                  value={formData.match_format} 
                  onValueChange={(value) => handleSelectChange('match_format', value as any)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T10">T10</SelectItem>
                    <SelectItem value="T20">T20</SelectItem>
                    <SelectItem value="ODI">ODI</SelectItem>
                    <SelectItem value="Test">Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.match_format !== 'Test' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="overs" className="text-right">
                    Overs
                  </Label>
                  <Select 
                    value={String(formData.overs)} 
                    onValueChange={(value) => handleSelectChange('overs', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select overs" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.match_format === 'T10' && <SelectItem value="10">10 Overs</SelectItem>}
                      {formData.match_format === 'T20' && <SelectItem value="20">20 Overs</SelectItem>}
                      {formData.match_format === 'ODI' && <SelectItem value="50">50 Overs</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="match_type" className="text-right">
                  Match Type
                </Label>
                <Select 
                  value={formData.match_type} 
                  onValueChange={(value) => handleSelectChange('match_type', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select match type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter-house">Inter-House</SelectItem>
                    <SelectItem value="inter-college">Inter-College</SelectItem>
                    <SelectItem value="cricket-club">Cricket Club</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOpenDialog(false);
                  resetForm();
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {selectedMatch ? 'Updating...' : 'Scheduling...'}
                  </>
                ) : (
                  selectedMatch ? 'Update Match' : 'Schedule Match'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    
    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto flex flex-wrap">
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search matches..."
          className="pl-8 w-full md:w-auto"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
    
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teams</TableHead>
              <TableHead>Tournament</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  No matches found
                </TableCell>
              </TableRow>
            ) : (
              currentPageItems.map((match) => (
                <TableRow key={match._id || match.id} >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Shield className="h-3 w-3 text-blue-500 mr-1" />
                          <span>{match.team1.teamName}</span>
                        </div>
                        <div className="text-xs text-gray-400 my-1">vs</div>
                        <div className="flex items-center">
                          <Shield className="h-3 w-3 text-red-500 mr-1" />
                          <span>{match.team2.teamName}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{match.tournament_id.tournamentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {match.venue}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm font-medium">
                        <CalendarDays className="h-3 w-3 text-gray-400 mr-1" />
                        {format(parseISO(match.date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 text-gray-400 mr-1" />
                        {match.time}
                      </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(match.status, match.date)}</TableCell>
                    <TableCell>
                      {match.status !== 'scheduled' && match.status !== 'cancelled' ? (
                        match.innings && match.innings.length > 0 ? (
                          getMatchScore(match)
                        ) : (
                          <div className="text-xs text-gray-400">No score data</div>
                        )
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {match.status === 'scheduled' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditMatch(match)} disabled={actionLoading}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleStartMatch(match)} disabled={actionLoading}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-amber-600" onClick={() => handleCancelMatch(match)} disabled={actionLoading}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(match.status === 'completed' || match.status === 'cancelled' || match.status === 'tied') && (
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(match)} disabled={actionLoading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {match.status === 'ongoing' && (
                        <Button variant="ghost" size="icon" className="text-green-600"  disabled={actionLoading}>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                
              )))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min(currentPage * itemsPerPage, filteredMatches.length)} of {filteredMatches.length} matches
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
            <DialogTitle>Delete Match</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete the match between &quot;{matchToDelete?.team1.teamName}&quot; and &quot;{matchToDelete?.team2.teamName}&quot;? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMatch} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchScheduling;
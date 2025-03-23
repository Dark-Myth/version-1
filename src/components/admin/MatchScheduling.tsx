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
import { Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { 
  Plus, Edit, Trash2, Search,
  Clock, MapPin, CalendarDays, Shield, 
  X, Loader2, RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';

interface Match {
  id: string;
  team1: string;
  team2: string;
  tournament: string;
  venue: string;
  date: string;
  time: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  score1?: string;
  score2?: string;
  overs1?: string;
  overs2?: string;
  umpires?: string[];
  referee?: string;
}

interface Tournament {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

interface Venue {
  id: string;
  name: string;
  city: string;
}

interface MatchSchedulingProps {
  adminId: string;
}

const MatchScheduling: React.FC<MatchSchedulingProps> = ({ adminId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    Promise.all([
      fetchMatches(),
      fetchTournaments(),
      fetchTeams(),
      fetchVenues()
    ]).then(() => setLoading(false));
  }, [adminId]);
  
  const fetchMatches = async () => {
    // Replace with your actual API endpoint
    // const response = await fetch('/api/matches');
    // const data = await response.json();
    
    // Mock data for demonstration
    setTimeout(() => {
      const mockMatches: Match[] = [
        {
          id: '1',
          team1: 'Royal Challengers',
          team2: 'Thunderbolts',
          tournament: 'Winter League 2024',
          venue: 'Main Stadium',
          date: '2024-03-23',
          time: '14:30',
          status: 'scheduled',
          umpires: ['John Doe', 'Jane Smith'],
          referee: 'Mike Johnson'
        },
        {
          id: '2',
          team1: 'Super Kings',
          team2: 'Strikers',
          tournament: 'Winter League 2024',
          venue: 'Secondary Ground',
          date: '2024-03-22',
          time: '10:00',
          status: 'ongoing',
          score1: '210/8',
          score2: '65/4',
          overs1: '20.0',
          overs2: '8.2',
          umpires: ['Robert Brown', 'William White'],
          referee: 'David Green'
        },
        {
          id: '3',
          team1: 'Panthers',
          team2: 'Eagles',
          tournament: 'Winter League 2024',
          venue: 'City Ground',
          date: '2024-03-21',
          time: '15:00',
          status: 'completed',
          score1: '186/7',
          score2: '188/5',
          overs1: '20.0',
          overs2: '19.2',
          umpires: ['Thomas Gray', 'Richard Black'],
          referee: 'Paul Yellow'
        },
        {
          id: '4',
          team1: 'Lions',
          team2: 'Tigers',
          tournament: 'Winter League 2024',
          venue: 'Regional Stadium',
          date: '2024-03-20',
          time: '10:00',
          status: 'cancelled',
          umpires: ['Alex Blue', 'Kevin Red'],
          referee: 'Gary Orange'
        },
        {
          id: '5',
          team1: 'Royal Challengers',
          team2: 'Super Kings',
          tournament: 'Winter League 2024',
          venue: 'Main Stadium',
          date: '2024-03-24',
          time: '15:00',
          status: 'scheduled',
          umpires: ['John Doe', 'Jane Smith'],
          referee: 'Mike Johnson'
        }
      ];
      
      setMatches(mockMatches);
    }, 500);
    
    return Promise.resolve();
  };
  
  const fetchTournaments = async () => {
    const mockTournaments: Tournament[] = [
      { id: '1', name: 'Winter League 2024' },
      { id: '2', name: 'Summer Cup 2024' },
      { id: '3', name: 'Champions Trophy' }
    ];
    
    setTournaments(mockTournaments);
    return Promise.resolve();
  };
  
  const fetchTeams = async () => {
    const mockTeams: Team[] = [
      { id: '1', name: 'Royal Challengers' },
      { id: '2', name: 'Thunderbolts' },
      { id: '3', name: 'Super Kings' },
      { id: '4', name: 'Panthers' },
      { id: '5', name: 'Strikers' },
      { id: '6', name: 'Eagles' },
      { id: '7', name: 'Lions' },
      { id: '8', name: 'Tigers' }
    ];
    
    setTeams(mockTeams);
    return Promise.resolve();
  };
  
  const fetchVenues = async () => {
    const mockVenues: Venue[] = [
      { id: '1', name: 'Main Stadium', city: 'Mumbai' },
      { id: '2', name: 'Secondary Ground', city: 'Delhi' },
      { id: '3', name: 'City Ground', city: 'Bangalore' },
      { id: '4', name: 'Regional Stadium', city: 'Chennai' }
    ];
    
    setVenues(mockVenues);
    return Promise.resolve();
  };
  
  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle match creation/update logic
    console.log(selectedMatch ? "Updating match" : "Creating new match");
    setOpenDialog(false);
    setSelectedMatch(null);
  };
  
  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setOpenDialog(true);
  };
  
  const handleDeleteMatch = (id: string) => {
    // Handle match deletion logic
    console.log(`Deleting match ${id}`);
    setMatches(prevMatches => prevMatches.filter(match => match.id !== id));
  };
  
  const handleCancelMatch = (id: string) => {
    // Handle match cancellation logic
    console.log(`Cancelling match ${id}`);
    setMatches(prevMatches => 
      prevMatches.map(match => 
        match.id === id 
          ? { ...match, status: 'cancelled' } 
          : match
      )
    );
  };
  
  const filterMatches = () => {
    let filtered = [...matches];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(match => 
        match.team1.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.team2.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.tournament.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      filtered = filtered.filter(match => match.status === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(match => match.status === 'cancelled');
    }
    
    return filtered;
  };
  
  const getStatusBadge = (status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled', date: string) => {
    const isMatchToday = isToday(parseISO(date));
    const isMatchPast = isPast(parseISO(date));
    
    switch (status) {
      case 'scheduled':
        if (isMatchToday) {
          return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Today</Badge>;
        } else if (isMatchPast) {
          return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
        } else {
          return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Scheduled</Badge>;
        }
      case 'ongoing':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Live</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
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
  
  const filteredMatches = filterMatches();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Match Scheduling</h2>
          <p className="text-gray-500">Schedule and manage cricket matches</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Match
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedMatch ? 'Edit Match' : 'Schedule New Match'}</DialogTitle>
              <DialogDescription>
                {selectedMatch ? 'Update match details' : 'Fill in the details to schedule a new match'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMatch}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tournament" className="text-right">
                    Tournament
                  </Label>
                  <Select defaultValue={selectedMatch?.tournament || ''}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map(tournament => (
                        <SelectItem key={tournament.id} value={tournament.name}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team1" className="text-right">
                    Team 1
                  </Label>
                  <Select defaultValue={selectedMatch?.team1 || ''}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="team2" className="text-right">
                    Team 2
                  </Label>
                  <Select defaultValue={selectedMatch?.team2 || ''}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.name}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="venue" className="text-right">
                    Venue
                  </Label>
                  <Select defaultValue={selectedMatch?.venue || ''}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map(venue => (
                        <SelectItem key={venue.id} value={venue.name}>
                          {venue.name}, {venue.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Input 
                    id="date" 
                    type="date" 
                    className="col-span-3"
                    defaultValue={selectedMatch?.date || ''} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Time
                  </Label>
                  <Input 
                    id="time" 
                    type="time" 
                    className="col-span-3"
                    defaultValue={selectedMatch?.time || ''} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="umpire1" className="text-right">
                    Umpire 1
                  </Label>
                  <Input 
                    id="umpire1" 
                    className="col-span-3"
                    defaultValue={selectedMatch?.umpires?.[0] || ''} 
                    placeholder="Umpire name"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="umpire2" className="text-right">
                    Umpire 2
                  </Label>
                  <Input 
                    id="umpire2" 
                    className="col-span-3"
                    defaultValue={selectedMatch?.umpires?.[1] || ''} 
                    placeholder="Umpire name"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="referee" className="text-right">
                    Match Referee
                  </Label>
                  <Input 
                    id="referee" 
                    className="col-span-3"
                    defaultValue={selectedMatch?.referee || ''} 
                    placeholder="Referee name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setOpenDialog(false);
                  setSelectedMatch(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{selectedMatch ? 'Update Match' : 'Schedule Match'}</Button>
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teams</TableHead>
                <TableHead>Tournament</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No matches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <Shield className="h-3 w-3 text-blue-500 mr-1" />
                            <span>{match.team1}</span>
                          </div>
                          <div className="text-xs text-gray-400 my-1">vs</div>
                          <div className="flex items-center">
                            <Shield className="h-3 w-3 text-red-500 mr-1" />
                            <span>{match.team2}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{match.tournament}</TableCell>
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
                    <TableCell className="text-right">
                      {match.status === 'scheduled' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEditMatch(match)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-amber-600" onClick={() => handleCancelMatch(match.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(match.status === 'completed' || match.status === 'cancelled') && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMatch(match.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {match.status === 'ongoing' && (
                        <Button variant="ghost" size="icon" className="text-green-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-gray-500">
            Showing {filteredMatches.length} of {matches.length} matches
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchMatches}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MatchScheduling;
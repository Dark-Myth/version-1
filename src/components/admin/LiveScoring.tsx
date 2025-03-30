import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, Play, RefreshCw, Shield, 
  Calendar, Loader2, PlusCircle, AlertCircle
} from "lucide-react";

// Define types for the component
interface Team {
  _id: string;
  teamName: string;
  shortCode?: string;
}

interface Player {
  _id: string;
  playerName: string;
}

interface Ball {
  ball_number: number;
  batsman: Player | string;
  bowler: Player | string;
  runs: number;
  wicket: {
    fallen: boolean;
    wicketType?: string;
    fielder?: Player | string;
  };
  extras: {
    wides: number;
    no_balls: number;
    byes: number;
    leg_byes: number;
  };
}

interface Over {
  _id: string;
  over_number: number;
  bowler: Player | string;
  balls: Ball[];
}

interface Innings {
  _id: string;
  team: {
    batting_team: Team;
    bowling_team: Team;
  };
  runs: number;
  wickets: number;
  overs: Over[];
  extras: {
    wides: number;
    no_balls: number;
    byes: number;
    leg_byes: number;
  };
}

interface Match {
  _id: string;
  tournament_id: {
    _id: string;
    tournamentName: string;
  };
  team1: Team;
  team2: Team;
  date: string;
  time: string;
  venue: string;
  innings: Innings[];
  status: string;
  match_format: string;
  overs: number;
}

interface LiveScoringProps {
  adminId: string;
}

const LiveScoring: React.FC<LiveScoringProps> = ({ adminId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  // Active match and innings state
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [activeInnings, setActiveInnings] = useState<Innings | null>(null);
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  
  // Dialog states
  const [startMatchDialogOpen, setStartMatchDialogOpen] = useState(false);
  const [wicketDialogOpen, setWicketDialogOpen] = useState(false);
  
  // Player selection state
  const [selectedBattingTeam, setSelectedBattingTeam] = useState<string>('');
  const [selectedBatsman, setSelectedBatsman] = useState<string>('');
  const [selectedBowler, setSelectedBowler] = useState<string>('');
  const [selectedFielder, setSelectedFielder] = useState<string>('');
  const [wicketType, setWicketType] = useState<string>('');
  const [mockBatsmen, setMockBatsmen] = useState<Player[]>([]);
  const [mockBowlers, setMockBowlers] = useState<Player[]>([]);
  const [realBatsmen, setRealBatsmen] = useState<Player[]>([]);
  const [realBowlers, setRealBowlers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchMatches();
  }, [adminId]);
  
  const fetchMatches = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      console.log("Fetching matches for handler:", adminId);
      const response = await fetch(`/api/management/live-score?handler=${adminId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch matches: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Fetched matches:", data);
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Create mock players for demonstration
  const createMockPlayers = (teamId: string, prefix: string): Player[] => {
    return Array.from({ length: 5 }, (_, i) => ({
      _id: `${teamId}_${prefix}_${i + 1}`,
      playerName: `${prefix} Player ${i + 1}`
    }));
  };
  
  const handleStartMatch = async (matchId: string) => {
    setIsProcessing(prev => ({ ...prev, [matchId]: true }));
    
    try {
      const match = matches.find(m => m._id === matchId);
      if (!match) {
        throw new Error("Match not found");
      }
      
      setActiveMatch(match);
      setStartMatchDialogOpen(true);
    } finally {
      setIsProcessing(prev => ({ ...prev, [matchId]: false }));
    }
  };
  
  const confirmStartMatch = async () => {
    if (!activeMatch || !selectedBattingTeam) {
      toast.error("Please select a batting team");
      return;
    }

    setIsProcessing(prev => ({ ...prev, [activeMatch._id]: true }));
    
    try {
      const bowlingTeamId = activeMatch.team1._id === selectedBattingTeam 
        ? activeMatch.team2._id 
        : activeMatch.team1._id;

      const response = await fetch('/api/management/live-score', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          action: 'startMatch',
          inningsData: {
            battingTeam: selectedBattingTeam,
            bowlingTeam: bowlingTeamId
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start match: ${response.status} ${errorText}`);
      }

      const updatedMatch = await response.json();
      console.log("Match started:", updatedMatch);
      
      // Update matches list with the updated match
      setMatches(prevMatches => 
        prevMatches.map(m => m._id === updatedMatch._id ? updatedMatch : m)
      );

      toast.success("Match started successfully");
      setStartMatchDialogOpen(false);
      
      // Reset selected batting team
      setSelectedBattingTeam('');
    } catch (error) {
      console.error("Error confirming match start:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [activeMatch._id]: false }));
    }
  };
  
  const fetchTeamPlayers = async (teamId: string): Promise<Player[]> => {
    try {
      setIsLoadingPlayers(true);
      const response = await fetch(`/api/teams/${teamId}/players`);
      
      if (!response.ok) {
        // If the API returns an error, fall back to mock data
        console.warn("API returned error, using mock data instead");
        return createMockPlayers(teamId, teamId === activeMatch?.team1._id ? "Batting" : "Bowling");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching players:", error);
      // On error, fall back to mock data
      return createMockPlayers(teamId, teamId === activeMatch?.team1._id ? "Batting" : "Bowling");
    } finally {
      setIsLoadingPlayers(false);
    }
  };
  
  const handleOpenScoring = async (match: Match) => {
    setActiveMatch(match);
    setScoringDialogOpen(true);
    setApiError(null);
    
    try {
      // Get the latest match details including innings
      const response = await fetch(`/api/matches/${match._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch match details");
      }
      
      const matchDetails = await response.json();
      
      // Find current innings (most recent) if it exists
      let currentInnings = null;
      if (matchDetails.innings && matchDetails.innings.length > 0) {
        currentInnings = matchDetails.innings[matchDetails.innings.length - 1];
        
        // Make sure we have the complete innings data
        setActiveInnings(currentInnings);
        
        // Update the UI with current score
        console.log("Current innings:", currentInnings);
        
        // Fetch real players from API
        try {
          const battingTeamId = currentInnings.team.batting_team._id;
          const bowlingTeamId = currentInnings.team.bowling_team._id;
          
          console.log("Fetching players for teams:", battingTeamId, bowlingTeamId);
          
          const [battingPlayersResponse, bowlingPlayersResponse] = await Promise.all([
            fetch(`/api/teams/${battingTeamId}/players`),
            fetch(`/api/teams/${bowlingTeamId}/players`)
          ]);
          
          if (!battingPlayersResponse.ok || !bowlingPlayersResponse.ok) {
            throw new Error("Failed to fetch players");
          }
          
          const battingPlayers = await battingPlayersResponse.json();
          const bowlingPlayers = await bowlingPlayersResponse.json();
          
          console.log("Fetched players:", { battingPlayers, bowlingPlayers });
          
          setRealBatsmen(battingPlayers);
          setRealBowlers(bowlingPlayers);
          
          // If we have real players, clear the mock players
          setMockBatsmen([]);
          setMockBowlers([]);
        } catch (error) {
          console.error("Error loading players, falling back to mock data:", error);
          // Fall back to mock players if API fails
          const mockBatsmen = createMockPlayers(currentInnings.team.batting_team._id, "Batting");
          const mockBowlers = createMockPlayers(currentInnings.team.bowling_team._id, "Bowling");
          
          setMockBatsmen(mockBatsmen);
          setMockBowlers(mockBowlers);
          
          console.log("Using mock players:", { mockBatsmen, mockBowlers });
          
          // Clear real players arrays
          setRealBatsmen([]);
          setRealBowlers([]);
        }
      } else {
        // No innings found - this should not happen for ongoing matches
        // but we'll create a mock innings anyway
        console.warn("No innings found for ongoing match:", match._id);
        
        // Create a mock innings
        const mockInnings: Innings = {
          _id: `innings_${match._id}`,
          team: {
            batting_team: match.team1,
            bowling_team: match.team2
          },
          runs: 0,
          wickets: 0,
          overs: [],
          extras: {
            wides: 0,
            no_balls: 0,
            byes: 0,
            leg_byes: 0
          }
        };
        
        setActiveInnings(mockInnings);
        
        // Create mock players
        const mockBatsmen = createMockPlayers(match.team1._id, "Batting");
        const mockBowlers = createMockPlayers(match.team2._id, "Bowling");
        
        setMockBatsmen(mockBatsmen);
        setMockBowlers(mockBowlers);
        
        // Clear real players arrays
        setRealBatsmen([]);
        setRealBowlers([]);
      }
    } catch (error) {
      console.error("Error setting up scoring:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      // Create fallback mock data
      const mockInnings: Innings = {
        _id: `innings_${match._id}`,
        team: {
          batting_team: match.team1,
          bowling_team: match.team2
        },
        runs: 0,
        wickets: 0,
        overs: [],
        extras: {
          wides: 0,
          no_balls: 0,
          byes: 0,
          leg_byes: 0
        }
      };
      
      setActiveInnings(mockInnings);
      
      // Create mock players as fallback
      const mockBatsmen = createMockPlayers(match.team1._id, "Batting");
      const mockBowlers = createMockPlayers(match.team2._id, "Bowling");
      
      setMockBatsmen(mockBatsmen);
      setMockBowlers(mockBowlers);
      
      // Clear real players arrays
      setRealBatsmen([]);
      setRealBowlers([]);
    }
  };
  
  const handleAddRuns = async (runs: number) => {
    if (!activeMatch || !activeInnings || !selectedBatsman || !selectedBowler) {
      toast.error("Please select batsman and bowler");
      return;
    }
    
    setApiError(null);
    try {
      // Add debugging info
      console.log("Adding runs:", {
        matchId: activeMatch._id,
        inningsId: activeInnings._id,
        batsmanId: selectedBatsman,
        bowlerId: selectedBowler,
        runs
      });
      
      // Call the ball-update API
      const response = await fetch('/api/management/ball-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          batsmanId: selectedBatsman,
          bowlerId: selectedBowler,
          runs: runs,
          isWicket: false,
          extras: null
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to update score: ${errorText}`);
      }
      
      // Update the innings with the response data
      const updatedInnings = await response.json();
      console.log("Updated innings:", updatedInnings);
      setActiveInnings(updatedInnings);
      toast.success(`Added ${runs} run${runs !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error adding runs:", error);
      setApiError(error instanceof Error ? error.message : "Unknown error");
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const handleAddExtras = async (extraType: string, runs: number = 1) => {
    if (!activeMatch || !activeInnings || !selectedBatsman || !selectedBowler) {
      toast.error("Please select batsman and bowler");
      return;
    }
    
    try {
      const extras: any = {};
      
      switch (extraType) {
        case "wide":
          extras.wides = runs;
          break;
        case "no_ball":
          extras.no_balls = runs;
          break;
        case "bye":
          extras.byes = runs;
          break;
        case "leg_bye":
          extras.leg_byes = runs;
          break;
      }
      
      // Call the ball-update API
      const response = await fetch('/api/management/ball-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          batsmanId: selectedBatsman,
          bowlerId: selectedBowler,
          runs: 0, // No regular runs for extras
          isWicket: false,
          extras: extras
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update extras");
      }
      
      // Update the innings with the response data
      const updatedInnings = await response.json();
      setActiveInnings(updatedInnings);
      toast.success(`Added ${extraType} (${runs})`);
    } catch (error) {
      console.error("Error adding extras:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const openWicketDialog = () => {
    if (!selectedBatsman || !selectedBowler) {
      toast.error("Please select batsman and bowler first");
      return;
    }
    setWicketDialogOpen(true);
  };
  
  const handleWicket = async () => {
    if (!activeMatch || !activeInnings || !selectedBatsman || !selectedBowler || !wicketType) {
      toast.error("Please select wicket type");
      return;
    }
    
    const needsFielder = ["caught", "stumped", "run out"].includes(wicketType);
    
    if (needsFielder && !selectedFielder) {
      toast.error("Please select fielder for this type of dismissal");
      return;
    }
    
    try {
      // Call the ball-update API
      const response = await fetch('/api/management/ball-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          batsmanId: selectedBatsman,
          bowlerId: selectedBowler,
          runs: 0,
          isWicket: true,
          wicketType: wicketType,
          fielderId: needsFielder ? selectedFielder : undefined,
          extras: null
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to record wicket");
      }
      
      // Update the innings with the response data
      const updatedInnings = await response.json();
      setActiveInnings(updatedInnings);
      toast.success(`Wicket! ${wicketType}`);
      
      // Reset form
      setWicketType('');
      setSelectedFielder('');
      setWicketDialogOpen(false);
      
      // Reset batsman selection for next ball
      setSelectedBatsman('');
    } catch (error) {
      console.error("Error recording wicket:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'ongoing':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Live</Badge>;
      default:
        return null;
    }
  };
  
  const formatMatchDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  // Filter matches by status
  const ongoingMatches = matches.filter(match => match.status === 'ongoing');
  const scheduledMatches = matches.filter(match => match.status === 'scheduled');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Scoring</h2>
          <p className="text-gray-500">Manage and update match scores in real-time</p>
        </div>
        
        <Button onClick={fetchMatches} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Matches
        </Button>
      </div>
      
      <Tabs defaultValue="ongoing">
        <TabsList>
          <TabsTrigger value="ongoing" className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-green-500" />
            Ongoing ({ongoingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center">
            <Play className="h-4 w-4 mr-2 text-blue-500" />
            Scheduled ({scheduledMatches.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ongoing" className="space-y-4 mt-4">
          {ongoingMatches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700">No Ongoing Matches</h3>
                <p className="text-gray-500 max-w-md mt-2">
                  There are no matches currently in progress. Start a scheduled match to begin scoring.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingMatches.map(match => (
                <Card key={match._id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{match.tournament_id.tournamentName}</CardTitle>
                      {getStatusBadge(match.status)}
                    </div>
                    <CardDescription>{match.venue} • {formatMatchDate(match.date)} {match.time}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-medium">{match.team1.teamName}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-10 mb-3">
                      {match.match_format} ({match.overs} overs)
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <Shield className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="font-medium">{match.team2.teamName}</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="flex border-t">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-none py-2 h-auto text-blue-600"
                      onClick={() => handleOpenScoring(match)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Update Score
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4 mt-4">
          {scheduledMatches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700">No Scheduled Matches</h3>
                <p className="text-gray-500 max-w-md mt-2">
                  There are no matches scheduled for today. Create a new match to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match</TableHead>
                      <TableHead>Tournament</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledMatches.map(match => (
                      <TableRow key={match._id}>
                        <TableCell className="font-medium">
                          {match.team1.teamName} vs {match.team2.teamName}
                        </TableCell>
                        <TableCell>{match.tournament_id.tournamentName}</TableCell>
                        <TableCell>{match.venue}</TableCell>
                        <TableCell>{match.time}</TableCell>
                        <TableCell>{getStatusBadge(match.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleStartMatch(match._id)}
                            disabled={isProcessing[match._id]}
                            className="text-green-600 border-green-200"
                          >
                            {isProcessing[match._id] ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-1" />
                            )}
                            Start Match
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Start Match Dialog */}
      {activeMatch && (
        <Dialog open={startMatchDialogOpen} onOpenChange={setStartMatchDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Start Match</DialogTitle>
              <DialogDescription>
                {activeMatch.team1.teamName} vs {activeMatch.team2.teamName} • {activeMatch.tournament_id.tournamentName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Select Batting Team</h3>
                  <Select
                    value={selectedBattingTeam}
                    onValueChange={setSelectedBattingTeam}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batting team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={activeMatch.team1._id}>
                        {activeMatch.team1.teamName}
                      </SelectItem>
                      <SelectItem value={activeMatch.team2._id}>
                        {activeMatch.team2.teamName}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <h3 className="text-sm font-medium text-blue-700 mb-1">Match Information</h3>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span>{activeMatch.match_format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overs:</span>
                      <span>{activeMatch.overs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Venue:</span>
                      <span>{activeMatch.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setStartMatchDialogOpen(false)}
                disabled={isProcessing[activeMatch._id]}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmStartMatch}
                disabled={!selectedBattingTeam || isProcessing[activeMatch._id]}
              >
                {isProcessing[activeMatch._id] ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Match
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Scoring Dialog */}
      <Dialog open={scoringDialogOpen} onOpenChange={setScoringDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Live Scoring</DialogTitle>
            {activeMatch && (
              <DialogDescription>
                {activeMatch.team1.teamName} vs {activeMatch.team2.teamName}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {activeInnings && activeMatch && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {activeInnings.team.batting_team.teamName}: {activeInnings.runs}/{activeInnings.wickets}
                  </span>
                  <span>
                    Overs: {activeInnings.overs.length}.{activeInnings.overs.length > 0 ? activeInnings.overs[activeInnings.overs.length - 1]?.balls?.length || 0 : 0}
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-blue-700">
                  <span>Extras: {activeInnings.extras.wides + activeInnings.extras.no_balls + activeInnings.extras.byes + activeInnings.extras.leg_byes}</span>
                </div>
              </div>
              
              {apiError && (
                <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm">
                  <p className="font-medium">Error: {apiError}</p>
                  <p className="text-xs mt-1">Try refreshing the page or check the console for details.</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {/* Batsman selector */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Batsman</label>
                  <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
                    <SelectTrigger disabled={isLoadingPlayers}>
                      <SelectValue placeholder={isLoadingPlayers ? "Loading players..." : "Select batsman"} />
                    </SelectTrigger>
                    <SelectContent>
                      {realBatsmen.length > 0 ? 
                        realBatsmen.map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName}
                          </SelectItem>
                        ))
                        :
                        mockBatsmen.map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName} (Mock)
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bowler selector */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Bowler</label>
                  <Select value={selectedBowler} onValueChange={setSelectedBowler}>
                    <SelectTrigger disabled={isLoadingPlayers}>
                      <SelectValue placeholder={isLoadingPlayers ? "Loading players..." : "Select bowler"} />
                    </SelectTrigger>
                    <SelectContent>
                      {realBowlers.length > 0 ? 
                        realBowlers.map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName}
                          </SelectItem>
                        ))
                        :
                        mockBowlers.map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName} (Mock)
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Add Runs</h3>
                <div className="grid grid-cols-6 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAddRuns(0)}>0</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddRuns(1)}>1</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddRuns(2)}>2</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddRuns(3)}>3</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddRuns(4)}>4</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddRuns(6)}>6</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Extras</h3>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAddExtras("wide")}>Wide</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddExtras("no_ball")}>No Ball</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddExtras("bye")}>Bye</Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddExtras("leg_bye")}>Leg Bye</Button>
                </div>
              </div>
              
              <div>
                <Button variant="destructive" onClick={openWicketDialog} className="w-full mt-2">
                  Record Wicket
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoringDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Wicket Dialog */}
      <Dialog open={wicketDialogOpen} onOpenChange={setWicketDialogOpen}>
        <DialogContent className="sm:max-w-[400px] w-[800px]">
          <DialogHeader>
            <DialogTitle>Record Wicket</DialogTitle>
            <DialogDescription>Select the type of dismissal</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Wicket Type</label>
              <Select value={wicketType} onValueChange={setWicketType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wicket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bowled">Bowled</SelectItem>
                  <SelectItem value="caught">Caught</SelectItem>
                  <SelectItem value="lbw">LBW</SelectItem>
                  <SelectItem value="run out">Run Out</SelectItem>
                  <SelectItem value="stumped">Stumped</SelectItem>
                  <SelectItem value="hit wicket">Hit Wicket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Show fielder selector for caught, run out, stumped */}
            {wicketType && ["caught", "run out", "stumped"].includes(wicketType) && (
              <div>
                <label className="text-sm font-medium mb-1 block">Fielder</label>
                <Select value={selectedFielder} onValueChange={setSelectedFielder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fielder" />
                  </SelectTrigger>
                  <SelectContent>
                    {realBowlers.length > 0 ? 
                      realBowlers.map(player => (
                        <SelectItem key={player._id} value={player._id}>
                          {player.playerName}
                        </SelectItem>
                      ))
                      :
                      mockBowlers.map(player => (
                        <SelectItem key={player._id} value={player._id}>
                          {player.playerName} (Mock)
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setWicketDialogOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleWicket} disabled={!wicketType}>
              Confirm Wicket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveScoring;
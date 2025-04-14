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
  Calendar, Loader2
} from "lucide-react";

import { useRouter } from "next/navigation";

// Define types for the component
interface Team {
  _id: string;
  teamName: string;
  shortCode?: string;
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
  status: string;
  match_format: string;
  overs: number;
}

interface LiveScoringProps {
  adminId: string;
}

const LiveScoring: React.FC<LiveScoringProps> = ({ adminId }) => {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  // Active match state
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [startMatchDialogOpen, setStartMatchDialogOpen] = useState(false);
  
  // Player selection state for toss
  const [selectedTossWinner, setSelectedTossWinner] = useState<string>('');
  const [tossDecision, setTossDecision] = useState<string>('');

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
    if (!activeMatch || !selectedTossWinner || !tossDecision) {
      toast.error("Please select toss winner and decision");
      return;
    }

    setIsProcessing(prev => ({ ...prev, [activeMatch._id]: true }));
    
    try {
      // Determine batting and bowling teams based on toss decision
      let battingTeamId, bowlingTeamId;
      
      if (tossDecision === 'bat') {
        battingTeamId = selectedTossWinner;
        bowlingTeamId = activeMatch.team1._id === selectedTossWinner 
          ? activeMatch.team2._id 
          : activeMatch.team1._id;
      } else {
        // If toss winner chose to field
        bowlingTeamId = selectedTossWinner;
        battingTeamId = activeMatch.team1._id === selectedTossWinner 
          ? activeMatch.team2._id 
          : activeMatch.team1._id;
      }

      const response = await fetch('/api/management/live-score', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          action: 'startMatch',
          inningsData: {
            battingTeam: battingTeamId,
            bowlingTeam: bowlingTeamId,
            tossWinner: selectedTossWinner,
            tossDecision: tossDecision
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
      
      // Reset selected values
      setSelectedTossWinner('');
      setTossDecision('');
      
      // Navigate to the scoring page for this match
      router.push(`/scoring/${activeMatch._id}`);
    } catch (error) {
      console.error("Error confirming match start:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [activeMatch._id]: false }));
    }
  };
  
  const handleOpenScoring = (matchId: string) => {
    // Navigate to the scoring page for the selected match
    router.push(`/scoring/${matchId}`);
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
                      onClick={() => handleOpenScoring(match._id)}
                    >
                      Continue Scoring
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
                  <h3 className="text-sm font-medium mb-2">Toss Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Which team won the toss?</label>
                      <Select
                        value={selectedTossWinner}
                        onValueChange={setSelectedTossWinner}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select toss winner" />
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
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">What did they elect to do?</label>
                      <Select
                        value={tossDecision}
                        onValueChange={setTossDecision}
                        disabled={!selectedTossWinner}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bat">Bat First</SelectItem>
                          <SelectItem value="field">Field First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {selectedTossWinner && tossDecision && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-blue-700 mb-1">First Innings</h3>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Batting:</span>
                        <span>
                          {tossDecision === 'bat' 
                            ? (selectedTossWinner === activeMatch.team1._id ? activeMatch.team1.teamName : activeMatch.team2.teamName)
                            : (selectedTossWinner === activeMatch.team1._id ? activeMatch.team2.teamName : activeMatch.team1.teamName)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Bowling:</span>
                        <span>
                          {tossDecision === 'bat'
                            ? (selectedTossWinner === activeMatch.team1._id ? activeMatch.team2.teamName : activeMatch.team1.teamName)
                            : (selectedTossWinner === activeMatch.team1._id ? activeMatch.team1.teamName : activeMatch.team2.teamName)
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
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
                disabled={!selectedTossWinner || !tossDecision || isProcessing[activeMatch._id]}
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
    </div>
  );
};

export default LiveScoring;
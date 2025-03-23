import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
  Clock, Play,
   Save, RefreshCw,  Shield 
} from "lucide-react";

interface Match {
  id: string;
  team1: string;
  team2: string;
  tournament: string;
  venue: string;
  date: string;
  time: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  score1?: string;
  score2?: string;
  overs1?: string;
  overs2?: string;
}

interface LiveScoringProps {
  adminId: string;
}

const LiveScoring: React.FC<LiveScoringProps> = ({ adminId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [scoringOpen, setScoringOpen] = useState(false);
  
  useEffect(() => {
    fetchMatches();
  }, []);
  
  const fetchMatches = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      // const response = await fetch('/api/matches');
      // const data = await response.json();
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockMatches: Match[] = [
          {
            id: '1',
            team1: 'Team Alpha',
            team2: 'Team Beta',
            tournament: 'Winter League 2024',
            venue: 'Main Stadium',
            date: '2024-03-22',
            time: '14:30',
            status: 'ongoing',
            score1: '156/4',
            score2: '89/2',
            overs1: '20.0',
            overs2: '12.3'
          },
          {
            id: '2',
            team1: 'Team Charlie',
            team2: 'Team Delta',
            tournament: 'Winter League 2024',
            venue: 'Secondary Ground',
            date: '2024-03-22',
            time: '10:00',
            status: 'ongoing',
            score1: '210/8',
            score2: '65/4',
            overs1: '20.0',
            overs2: '8.2'
          },
          {
            id: '3',
            team1: 'Team Echo',
            team2: 'Team Foxtrot',
            tournament: 'Winter League 2024',
            venue: 'Training Field',
            date: '2024-03-22',
            time: '16:00',
            status: 'scheduled'
          },
          {
            id: '4',
            team1: 'Team Golf',
            team2: 'Team Hotel',
            tournament: 'Winter League 2024',
            venue: 'City Ground',
            date: '2024-03-22',
            time: '09:30',
            status: 'completed',
            score1: '186/7',
            score2: '188/5',
            overs1: '20.0',
            overs2: '19.2'
          }
        ];
        
        setMatches(mockMatches);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setLoading(false);
    }
  };
  
  const handleStartMatch = (match: Match) => {
    // API call to start the match
    console.log(`Starting match: ${match.id}`);
    
    // Update local state
    setMatches(prevMatches => 
      prevMatches.map(m => 
        m.id === match.id 
          ? { ...m, status: 'ongoing', score1: '0/0', score2: '', overs1: '0.0', overs2: '' } 
          : m
      )
    );
  };
  
  const handleEndMatch = (match: Match) => {
    // API call to end the match
    console.log(`Ending match: ${match.id}`);
    
    // Update local state
    setMatches(prevMatches => 
      prevMatches.map(m => 
        m.id === match.id 
          ? { ...m, status: 'completed' } 
          : m
      )
    );
  };
  
  const handleOpenScoring = (match: Match) => {
    setActiveMatch(match);
    setScoringOpen(true);
  };
  
  const getStatusBadge = (status: 'scheduled' | 'ongoing' | 'completed') => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'ongoing':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Live</Badge>;
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
        
        <Button onClick={fetchMatches}>
          <RefreshCw className="h-4 w-4 mr-2" />
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
                <Card key={match.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{match.tournament}</CardTitle>
                      {getStatusBadge(match.status)}
                    </div>
                    <CardDescription>{match.venue} • {match.date} {match.time}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-medium">{match.team1}</span>
                      </div>
                      <span className="font-semibold">{match.score1}</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-10 mb-3">
                      {match.overs1} overs
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                          <Shield className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="font-medium">{match.team2}</span>
                      </div>
                      <span className="font-semibold">{match.score2}</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-10">
                      {match.overs2 ? `${match.overs2} overs` : "Yet to bat"}
                    </div>
                  </CardContent>
                  <div className="flex border-t">
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-none py-2 h-auto text-blue-600"
                      onClick={() => handleOpenScoring(match)}
                    >
                      Update Score
                    </Button>
                    <div className="border-r h-10"></div>
                    <Button 
                      variant="ghost" 
                      className="flex-1 rounded-none py-2 h-auto text-gray-600"
                      onClick={() => handleEndMatch(match)}
                    >
                      End Match
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
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {match.team1} vs {match.team2}
                        </TableCell>
                        <TableCell>{match.tournament}</TableCell>
                        <TableCell>{match.venue}</TableCell>
                        <TableCell>{match.time}</TableCell>
                        <TableCell>{getStatusBadge(match.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleStartMatch(match)}
                            className="text-green-600 border-green-200"
                          >
                            <Play className="h-4 w-4 mr-1" />
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
      
      {/* Scoring Dialog */}
      {activeMatch && (
        <Dialog open={scoringOpen} onOpenChange={setScoringOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Live Scoring</DialogTitle>
              <DialogDescription>
                {activeMatch.team1} vs {activeMatch.team2} • {activeMatch.tournament}
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{activeMatch.team1}</h3>
                  <div className="flex space-x-2 mb-3">
                    <Input placeholder="Runs" className="w-20" defaultValue={activeMatch.score1?.split('/')[0] || '0'} />
                    <span className="flex items-center">/</span>
                    <Input placeholder="Wickets" className="w-20" defaultValue={activeMatch.score1?.split('/')[1] || '0'} />
                    <Input placeholder="Overs" className="w-20" defaultValue={activeMatch.overs1 || '0.0'} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{activeMatch.team2}</h3>
                  <div className="flex space-x-2 mb-3">
                    <Input placeholder="Runs" className="w-20" defaultValue={activeMatch.score2?.split('/')[0] || '0'} />
                    <span className="flex items-center">/</span>
                    <Input placeholder="Wickets" className="w-20" defaultValue={activeMatch.score2?.split('/')[1] || '0'} />
                    <Input placeholder="Overs" className="w-20" defaultValue={activeMatch.overs2 || '0.0'} />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Current Over</h3>
                <div className="flex space-x-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm">1</div>
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm">4</div>
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm">0</div>
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm">W</div>
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm">0</div>
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm">2</div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="sm">0</Button>
                  <Button variant="outline" size="sm">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">4</Button>
                  <Button variant="outline" size="sm">6</Button>
                  <Button variant="outline" size="sm">Wide</Button>
                  <Button variant="outline" size="sm">No Ball</Button>
                  <Button variant="outline" size="sm">Leg Bye</Button>
                  <Button variant="outline" size="sm">Bye</Button>
                  <Button variant="outline" size="sm" className="text-red-600">Wicket</Button>
                  <Button variant="outline" size="sm">End Over</Button>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setScoringOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setScoringOpen(false)}>
                <Save className="h-4 w-4 mr-2" />
                Save Score
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LiveScoring;
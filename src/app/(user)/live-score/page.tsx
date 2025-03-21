"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, Calendar, MapPin, Trophy, Shield, 
  RefreshCcw, ArrowRight, AlertCircle, Users, 
   ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import Innings from "@/models/inningsModel";

// Types based on your models
interface Ball {
  ball_number: number;
  batsman: {
    _id: string;
    playerName: string;
  };
  bowler: {
    _id: string;
    playerName: string;
  };
  runs: number;
  wicket: {
    fallen: boolean;
    wicketType?: string;
    fielder?: {
      _id: string;
      playerName: string;
    };
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
  bowler: string;
  balls: Ball[];
}

interface Innings {
  _id: string;
  team: {
    batting_team: {
      _id: string;
      teamName: string;
      shortCode?: string;
    };
    bowling_team: {
      _id: string;
      teamName: string;
      shortCode?: string;
    };
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
  totalScore?: number;
}

interface Match {
  _id: string;
  tournament_id: {
    _id: string;
    tournamentName: string;
  };
  team1: {
    _id: string;
    teamName: string;
    shortCode?: string;
  };
  team2: {
    _id: string;
    teamName: string;
    shortCode?: string;
  };
  date: string;
  time: string;
  venue: string;
  innings: Innings[];
  status: string;
  winningTeam?: {
    _id: string;
    teamName: string;
  };
  match_type: string;
  match_format: string;
  overs: number;
  comments?: string;
}

const LiveScore = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch live matches
  const fetchLiveMatches = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/live-score");
      
      if (!response.ok) {
        throw new Error("Failed to fetch live matches");
      }
      
      const data = await response.json();
      setMatches(data);
      
      // If no selected match and we have matches, select the first one
      if (!selectedMatch && data.length > 0) {
        setSelectedMatch(data[0]._id);
        // Expand the first match by default
        setExpandedMatches({ [data[0]._id]: true });
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Auto-refresh logic
  useEffect(() => {
    fetchLiveMatches();
    
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchLiveMatches();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);
  
  // Toggle expanded view for a match
  const toggleExpand = (matchId: string) => {
    setExpandedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };
  
  // Format match date for display
  const formatMatchDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  // Format match time for display
  const formatMatchTime = (timeString: string) => {
    if (timeString.includes(':') && (timeString.includes('AM') || timeString.includes('PM'))) {
      return timeString;
    }
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
    } catch (e) {
      return timeString;
    }
  };
  
  // Get match status text and color
  const getMatchStatus = (match: Match) => {
    if (match.status === "ongoing") {
      return { text: "Live", color: "bg-red-100 text-red-800" };
    }
    if (match.status === "completed") {
      return { text: "Completed", color: "bg-green-100 text-green-800" };
    }
    return { text: "Scheduled", color: "bg-blue-100 text-blue-800" };
  };
  
  // Get current innings and batting/bowling teams
  const getCurrentInnings = (match: Match) => {
    if (!match.innings || match.innings.length === 0) {
      return null;
    }
    
    // For ongoing matches, the last innings is the current one
    if (match.status === "ongoing") {
      return match.innings[match.innings.length - 1];
    }
    
    // For completed matches, return the last innings
    return match.innings[match.innings.length - 1];
  };
  
  // Calculate team scores from innings
  const getTeamScores = (match: Match) => {
    const scores: Record<string, { runs: number; wickets: number; overs: number }> = {};
    
    match.innings.forEach(innings => {
      const battingTeamId = innings.team.batting_team._id;
      
      // Calculate total overs bowled
      let totalOvers = 0;
      if (innings.overs && innings.overs.length > 0) {
        const lastOver = innings.overs[innings.overs.length - 1];
        const legalBalls = lastOver.balls.filter(
          ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
        ).length;
        
        totalOvers = (innings.overs.length - 1) + (legalBalls / 6);
      }
      
      // Store team score
      scores[battingTeamId] = {
        runs: innings.runs + 
          innings.extras.wides + 
          innings.extras.no_balls + 
          innings.extras.byes + 
          innings.extras.leg_byes,
        wickets: innings.wickets,
        overs: totalOvers
      };
    });
    
    return scores;
  };
  
  // Calculate run rate
  const getRunRate = (runs: number, overs: number) => {
    if (overs === 0) return 0;
    return (runs / overs).toFixed(2);
  };
  
  // Calculate required run rate (for second innings)
  const getRequiredRunRate = (match: Match) => {
    if (match.innings.length < 2 || match.status === "completed") {
      return null;
    }
    
    const firstInnings = match.innings[0];
    const secondInnings = match.innings[1];
    
    const target = firstInnings.runs + 
      firstInnings.extras.wides + 
      firstInnings.extras.no_balls + 
      firstInnings.extras.byes + 
      firstInnings.extras.leg_byes + 1;
    
    const currentScore = secondInnings.runs + 
      secondInnings.extras.wides + 
      secondInnings.extras.no_balls + 
      secondInnings.extras.byes + 
      secondInnings.extras.leg_byes;
    
    const runsNeeded = target - currentScore;
    
    // Calculate overs remaining
    let oversBowled = 0;
    if (secondInnings.overs && secondInnings.overs.length > 0) {
      const lastOver = secondInnings.overs[secondInnings.overs.length - 1];
      const legalBalls = lastOver.balls.filter(
        ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
      ).length;
      
      oversBowled = (secondInnings.overs.length - 1) + (legalBalls / 6);
    }
    
    const oversRemaining = match.overs - oversBowled;
    
    if (oversRemaining <= 0) return null;
    
    return (runsNeeded / oversRemaining).toFixed(2);
  };

  // Get target and runs needed
  const getTarget = (match: Match) => {
    if (match.innings.length < 2) {
      return null;
    }
    
    const firstInnings = match.innings[0];
    const secondInnings = match.innings[1];
    
    const target = firstInnings.runs + 
      firstInnings.extras.wides + 
      firstInnings.extras.no_balls + 
      firstInnings.extras.byes + 
      firstInnings.extras.leg_byes + 1;
    
    const currentScore = secondInnings.runs + 
      secondInnings.extras.wides + 
      secondInnings.extras.no_balls + 
      secondInnings.extras.byes + 
      secondInnings.extras.leg_byes;
    
    return {
      target,
      runsNeeded: target - currentScore
    };
  };
  
  // Get last 5 balls for the current innings
  const getLastFiveBalls = (match: Match) => {
    const currentInnings = getCurrentInnings(match);
    if (!currentInnings || !currentInnings.overs || currentInnings.overs.length === 0) {
      return [];
    }
    
    const allBalls: { text: string; isWicket: boolean }[] = [];
    
    // Iterate through overs in reverse
    for (let i = currentInnings.overs.length - 1; i >= 0; i--) {
      const over = currentInnings.overs[i];
      // Iterate through balls in reverse
      for (let j = over.balls.length - 1; j >= 0; j--) {
        const ball = over.balls[j];
        
        let text = '';
        let isWicket = false;
        
        if (ball.wicket?.fallen) {
          text = 'W';
          isWicket = true;
        } else if (ball.extras.wides > 0) {
          text = `${ball.runs + ball.extras.wides}Wd`;
        } else if (ball.extras.no_balls > 0) {
          text = `${ball.runs}Nb`;
        } else if (ball.extras.byes > 0) {
          text = `${ball.extras.byes}B`;
        } else if (ball.extras.leg_byes > 0) {
          text = `${ball.extras.leg_byes}Lb`;
        } else {
          text = ball.runs.toString();
        }
        
        allBalls.push({ text, isWicket });
        
        // If we have 5 balls, stop
        if (allBalls.length >= 5) {
          break;
        }
      }
      
      // If we have 5 balls, stop
      if (allBalls.length >= 5) {
        break;
      }
    }
    
    // Reverse to show oldest to newest
    return allBalls.reverse();
  };
  
  // Get match result text
  const getMatchResult = (match: Match) => {
    if (match.status !== "completed") {
      return null;
    }
    
    if (!match.winningTeam) {
      return "Match Tied";
    }
    
    // Calculate scores
    const scores = getTeamScores(match);
    
    // Find winning and losing team scores
    const winningTeamId = match.winningTeam._id;
    const winningTeamScore = scores[winningTeamId];
    
    // Get the other team's ID and score
    const losingTeamId = Object.keys(scores).find(id => id !== winningTeamId);
    
    if (!losingTeamId) {
      return `${match.winningTeam.teamName} won`;
    }
    
    const losingTeamScore = scores[losingTeamId];
    
    // Calculate win margin
    const runDifference = winningTeamScore.runs - losingTeamScore.runs;
    
    if (match.innings.length === 2) {
      // If team batting second won
      if (match.innings[1].team.batting_team._id === winningTeamId) {
        return `${match.winningTeam.teamName} won by ${10 - winningTeamScore.wickets} wickets`;
      } else {
        // If team batting first won
        return `${match.winningTeam.teamName} won by ${runDifference} runs`;
      }
    }
    
    return `${match.winningTeam.teamName} won`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-start mx-auto mt-[6%] p-auto px-auto flex-1 bg-white my-auto max-sm:mt-[1%] lg:mx-[5%]"
    >
      <Card className="w-full max-w-7xl shadow-sm border-gray-200 m-auto max-sm:mt-[15%] mb-auto">
        <CardHeader className="border-b bg-white py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <CardTitle className="text-xl font-medium text-gray-800">
                Live Scores
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => fetchLiveMatches()}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3.5 w-3.5" />
                )}
                <span className="text-sm">Refresh</span>
              </Button>
              <Button 
                size="sm" 
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-sm"
              >
                {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center space-x-4">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 text-right">
                        <Skeleton className="h-6 w-32 mb-2 ml-auto" />
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-6">
              {matches.map((match) => {
                const isExpanded = expandedMatches[match._id] || false;
                const status = getMatchStatus(match);
                const scores = getTeamScores(match);
                const currentInnings = getCurrentInnings(match);
                const lastFiveBalls = getLastFiveBalls(match);
                const matchResult = getMatchResult(match);
                
                return (
                  <motion.div 
                    key={match._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden"
                  >
                    <Card className={`overflow-hidden border-l-4 ${status.color.includes('red') ? 'border-l-red-500' : status.color.includes('green') ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                      <div className="p-4">
                        {/* Match header with tournament info and status */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 font-medium">
                              {match.tournament_id.tournamentName}
                            </span>
                          </div>
                          <Badge className={status.color}>
                            {status.text}
                          </Badge>
                        </div>
                        
                        {/* Teams and scores */}
                        <div className="flex justify-between items-center py-4">
                          <div className="flex-1">
                            <div className="text-lg font-semibold">{match.team1.teamName}</div>
                            {scores[match.team1._id] && (
                              <div className="text-2xl font-bold">
                                {scores[match.team1._id].runs}/{scores[match.team1._id].wickets}
                                <span className="text-sm text-gray-500 ml-1">
                                  ({scores[match.team1._id].overs.toFixed(1)})
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="px-4">
                            <span className="text-gray-400 font-semibold">VS</span>
                          </div>
                          
                          <div className="flex-1 text-right">
                            <div className="text-lg font-semibold">{match.team2.teamName}</div>
                            {scores[match.team2._id] && (
                              <div className="text-2xl font-bold">
                                {scores[match.team2._id].runs}/{scores[match.team2._id].wickets}
                                <span className="text-sm text-gray-500 ml-1">
                                  ({scores[match.team2._id].overs.toFixed(1)})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Last 5 balls and run rate */}
                        {match.status === "ongoing" && currentInnings && (
                          <div className="flex justify-between items-center mt-2 mb-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">LAST 5 BALLS:</span>
                              <div className="flex items-center space-x-1">
                                {lastFiveBalls.map((ball, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full 
                                      ${ball.isWicket 
                                        ? 'bg-red-100 text-red-800' 
                                        : ball.text === '0' 
                                          ? 'bg-gray-100 text-gray-800' 
                                          : 'bg-green-100 text-green-800'}`}
                                  >
                                    {ball.text}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            {/* Run rate */}
                            {currentInnings && (
                              <div className="text-xs">
                                <span className="text-gray-500">CRR:</span>
                                <span className="font-semibold ml-1">
                                  {getRunRate(
                                    currentInnings.runs + 
                                    currentInnings.extras.wides + 
                                    currentInnings.extras.no_balls + 
                                    currentInnings.extras.byes + 
                                    currentInnings.extras.leg_byes,
                                    currentInnings.overs.length > 0 
                                      ? (currentInnings.overs.length - 1) + 
                                        (currentInnings.overs[currentInnings.overs.length - 1].balls.filter(
                                          ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
                                        ).length / 6) 
                                      : 0
                                  )}
                                </span>
                                
                                {/* Required run rate if it's the second innings */}
                                {match.innings.length > 1 && match.innings[1]._id === currentInnings._id && (
                                  <>
                                    <span className="text-gray-500 ml-2">REQ:</span>
                                    <span className="font-semibold ml-1">
                                      {getRequiredRunRate(match) || 'N/A'}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Match result for completed matches */}
                        {matchResult && (
                          <div className="bg-green-50 p-2 rounded-md text-center mt-2 mb-3">
                            <span className="font-medium text-green-800">{matchResult}</span>
                          </div>
                        )}
                        
                        {/* Target for second innings */}
                        {match.status === "ongoing" && match.innings.length > 1 && match.innings[1]._id === currentInnings?._id && (
                          <div className="bg-blue-50 p-2 rounded-md text-sm mt-2 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-blue-800">
                                Target: {getTarget(match)?.target}
                              </span>
                              <span className="text-blue-800">
                                Need {getTarget(match)?.runsNeeded} from {
                                  (match.overs - (currentInnings.overs.length > 0 
                                    ? (currentInnings.overs.length - 1) + 
                                    (currentInnings.overs[currentInnings.overs.length - 1].balls.filter(
                                        ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
                                      ).length / 6) 
                                    : 0
                                  )).toFixed(1)
                                } overs
                              </span>
                            </div>
                            <Progress 
                              value={((currentInnings.runs + 
                                       currentInnings.extras.wides + 
                                       currentInnings.extras.no_balls + 
                                       currentInnings.extras.byes + 
                                       currentInnings.extras.leg_byes) / 
                                      (getTarget(match)?.target - 1)) * 100} 
                              className="h-1.5 mt-1"
                            />
                          </div>
                        )}
                        
                        {/* Match metadata */}
                        <div className="flex flex-wrap justify-between text-xs text-gray-500 py-2 border-t">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatMatchDate(match.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatMatchTime(match.time)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{match.venue}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3.5 w-3.5" />
                            <span>{match.match_format} ({match.overs} overs)</span>
                          </div>
                        </div>
                        
                        {/* Match commentary or additional information */}
                        {match.comments && (
                          <div className="mt-3 text-sm text-gray-600 italic">
                            &quot;{match.comments}&quot;
                          </div>
                        )}
                        
                        {/* Toggle button for detailed view */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 flex items-center justify-center text-gray-500"
                          onClick={() => toggleExpand(match._id)}
                        >
                          {isExpanded ? (
                            <>
                              <span>Hide Details</span>
                              <ChevronUp className="ml-1 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <span>Show Details</span>
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        
                        {/* Expanded match details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t">
                            <Tabs defaultValue="innings" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="innings">Innings</TabsTrigger>
                                <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="innings" className="mt-4">
                                {match.innings.length > 0 ? (
                                  <div className="space-y-4">
                                    {match.innings.map((innings, index) => (
                                      <Card key={innings._id} className="overflow-hidden">
                                        <CardHeader className="py-3 border-b">
                                          <CardTitle className="text-base flex justify-between">
                                            <span>
                                              {innings.team.batting_team.teamName} - Innings {index + 1}
                                            </span>
                                            <span>
                                              {innings.runs}/{innings.wickets} ({innings.overs.length > 0 
                                                ? (innings.overs.length - 1) + 
                                                  (innings.overs[innings.overs.length - 1].balls.filter(
                                                    ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
                                                  ).length / 6) 
                                                : 0} overs)
                                            </span>
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-3 text-sm">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <h4 className="font-medium mb-1">Extras</h4>
                                              <div className="space-y-1">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Wides</span>
                                                  <span>{innings.extras.wides}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">No Balls</span>
                                                  <span>{innings.extras.no_balls}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Byes</span>
                                                  <span>{innings.extras.byes}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Leg Byes</span>
                                                  <span>{innings.extras.leg_byes}</span>
                                                </div>
                                                <div className="flex justify-between font-medium pt-1 border-t">
                                                  <span>Total Extras</span>
                                                  <span>
                                                    {innings.extras.wides + 
                                                     innings.extras.no_balls + 
                                                     innings.extras.byes + 
                                                     innings.extras.leg_byes}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <h4 className="font-medium mb-1">Bowling Team</h4>
                                              <div className="space-y-1">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Team</span>
                                                  <span>{innings.team.bowling_team.teamName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Wickets Taken</span>
                                                  <span>{innings.wickets}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Overs Bowled</span>
                                                  <span>
                                                    {innings.overs.length > 0 
                                                      ? (innings.overs.length - 1) + 
                                                        (innings.overs[innings.overs.length - 1].balls.filter(
                                                          ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
                                                        ).length / 6).toFixed(1) 
                                                      : 0}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Economy Rate</span>
                                                  <span>
                                                    {getRunRate(
                                                      innings.runs + 
                                                      innings.extras.wides + 
                                                      innings.extras.no_balls + 
                                                      innings.extras.byes + 
                                                      innings.extras.leg_byes,
                                                      innings.overs.length > 0 
                                                        ? (innings.overs.length - 1) + 
                                                          (innings.overs[innings.overs.length - 1].balls.filter(
                                                            ball => ball.extras.wides === 0 && ball.extras.no_balls === 0
                                                          ).length / 6) 
                                                        : 1
                                                    )}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">No innings data available yet</p>
                                  </div>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="scorecard" className="mt-4">
                                <div className="space-y-4">
                                  {/* This would be expanded to show detailed batting and bowling figures */}
                                  <div className="text-center py-8">
                                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500">Detailed scorecard coming soon</p>
                                    <Button 
                                      variant="outline" 
                                      className="mt-2"
                                      asChild
                                    >
                                      <Link href={`/matches/${match._id}`}>
                                        View Full Scorecard
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Live Matches</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                There are no matches currently in progress. Check back later or view all matches to see upcoming games.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                asChild
              >
                <Link href="/matches">
                  View All Matches
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LiveScore;
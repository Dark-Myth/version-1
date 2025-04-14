"use client";

import React, { useState, useEffect, use } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, ArrowLeft, RotateCw,
  Shield, RefreshCw, ClipboardList
} from "lucide-react";
import BallDisplay from "@/components/admin/BallDisplay";
import ScorecardDisplay from "@/components/admin/ScorecardDisplay";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
  current_batsmen?: {
    striker: string | { _id: string };
    non_striker: string | { _id: string };
  };
  current_bowler?: string | { _id: string };
  batsmen?: Array<{
    player_id: string | { _id: string };
    runs: number;
    balls_faced: number;
    fours: number;
    sixes: number;
    out: boolean;
    dismissal_type?: string;
  }>;
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

export default function LiveScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const matchId = unwrappedParams.id;
  const { data: session } = useSession();

  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  // Active match and innings state
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [activeInnings, setActiveInnings] = useState<Innings | null>(null);
  
  // Dialog states
  const [inningsDialogOpen, setInningsDialogOpen] = useState(false);
  const [wicketDialogOpen, setWicketDialogOpen] = useState(false);
  
  // Player selection state
  const [selectedBatsman, setSelectedBatsman] = useState<string>('');
  const [selectedBowler, setSelectedBowler] = useState<string>('');
  const [selectedFielder, setSelectedFielder] = useState<string>('');
  const [wicketType, setWicketType] = useState<string>('');
  const [realBatsmen, setRealBatsmen] = useState<Player[]>([]);
  const [realBowlers, setRealBowlers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Add new state variables
  const [inningsBattingTeam, setInningsBattingTeam] = useState<string>('');
  const [inningsBowlingTeam, setInningsBowlingTeam] = useState<string>('');
  const [inningsNumber, setInningsNumber] = useState<number>(1);
  const [isCreatingInnings, setIsCreatingInnings] = useState(false);

  // New state variables for batsmen management
  const [activeBatsmen, setActiveBatsmen] = useState<string[]>([]);
  const [strikeBatsman, setStrikeBatsman] = useState<string>('');
  const [nonStrikeBatsman, setNonStrikeBatsman] = useState<string>('');
  const [dismissedBatsmen, setDismissedBatsmen] = useState<Set<string>>(new Set());
  const [batsmenDialogOpen, setBatsmenDialogOpen] = useState<boolean>(false);
  const [newBatsmanMode, setNewBatsmanMode] = useState<boolean>(false);

  // Add a state variable to track if an over is complete
  const [isOverComplete, setIsOverComplete] = useState<boolean>(false);

  // Add these new state variables
  const [activeTab, setActiveTab] = useState<string>("scoring");
  const [bowlerStats, setBowlerStats] = useState<any[]>([]);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching match details for ID: ${matchId}`);
      const response = await fetch(`/api/management/live-score/match-details/${matchId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`Failed to fetch match details: ${response.status} - ${errorText}`);
      }
      
      const matchDetails = await response.json();
      console.log("Match details:", matchDetails);
      setActiveMatch(matchDetails);
      
      // Find current innings (most recent) if it exists
      if (matchDetails.innings && matchDetails.innings.length > 0) {
        const currentInnings = matchDetails.innings[matchDetails.innings.length - 1];
        setActiveInnings(currentInnings);
        setInningsNumber(matchDetails.innings.length + 1);
        console.log("Current innings:", currentInnings);
        
        // Process bowling data for scorecard display
        if (currentInnings.overs && currentInnings.overs.length > 0) {
          const bowlingStats = processBowlingStats(currentInnings);
          setBowlerStats(bowlingStats);

          // Check if the current over is complete (exactly 6 valid balls bowled)
          const lastOver = currentInnings.overs[currentInnings.overs.length - 1];
          if (lastOver.balls) {
            const validBallsCount = lastOver.balls.filter(ball => 
              !(ball.extras?.wides > 0 || ball.extras?.no_balls > 0)
            ).length;
            console.log(`Current over has ${validBallsCount} valid balls`);
            const isComplete = validBallsCount === 6;
            setIsOverComplete(isComplete);
          }
        }
        
        if (currentInnings.team && 
            currentInnings.team.batting_team && 
            currentInnings.team.bowling_team) {
          await loadPlayers(currentInnings);
          
          // Initialize dismissed batsmen set from innings model data
          const newDismissedSet = new Set<string>();
          if (currentInnings.batsmen && Array.isArray(currentInnings.batsmen)) {
            console.log("Processing batsmen:", currentInnings.batsmen);
            currentInnings.batsmen.forEach(batsman => {
              if (batsman.out) {
                const batsmanId = typeof batsman.player_id === 'string' 
                  ? batsman.player_id 
                  : batsman.player_id?._id;
                
                if (batsmanId) {
                  newDismissedSet.add(batsmanId);
                  console.log(`Added dismissed batsman: ${batsmanId}, Dismissal type: ${batsman.dismissal_type || 'not specified'}`);
                }
              }
            });
            console.log("Dismissed batsmen set:", [...newDismissedSet]);
            setDismissedBatsmen(newDismissedSet);
          }
          
          // Set striker and non-striker from innings data
          if (currentInnings.current_batsmen) {
            const striker = currentInnings.current_batsmen.striker;
            const nonStriker = currentInnings.current_batsmen.non_striker;
            
            let strikerId = '';
            let nonStrikerId = '';
            
            if (striker) {
              strikerId = typeof striker === 'string' ? striker : striker._id;
              console.log("Setting striker:", strikerId);
              setStrikeBatsman(strikerId);
            }
            
            if (nonStriker) {
              nonStrikerId = typeof nonStriker === 'string' ? nonStriker : nonStriker._id;
              console.log("Setting non-striker:", nonStrikerId);
              setNonStrikeBatsman(nonStrikerId);
            }
            
            if (striker && nonStriker) {
              setActiveBatsmen([strikerId, nonStrikerId]);
            }
          }
          
          // Set current bowler from innings data
          if (currentInnings.current_bowler) {
            const currentBowler = currentInnings.current_bowler;
            const bowlerId = typeof currentBowler === 'string' ? currentBowler : currentBowler._id;
            setSelectedBowler(bowlerId);
            console.log("Setting current bowler:", bowlerId);
          }
          
          // Only open batsmen dialog if we're missing batsmen
          const needsBatsmenSelection = (!currentInnings.current_batsmen?.striker || 
                                        !currentInnings.current_batsmen?.non_striker);
          
          if (needsBatsmenSelection) {
            setTimeout(() => {
              setBatsmenDialogOpen(true);
            }, 500);
          }
        } else {
          throw new Error("Innings data is incomplete - missing team information");
        }
      } else {
        setInningsBattingTeam('');
        setInningsBowlingTeam('');
        setInningsNumber(1);
        setInningsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error setting up scoring:", error);
      setApiError(error instanceof Error ? error.message : "Unknown error");
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const processBowlingStats = (innings: Innings) => {
    if (!innings.overs || !Array.isArray(innings.overs)) return [];
    
    const bowlerMap = new Map();
    
    innings.overs.forEach(over => {
      if (!over.bowler || !over.balls) return;
      
      const bowlerId = typeof over.bowler === 'string' ? over.bowler : over.bowler._id;
      const bowlerName = typeof over.bowler === 'object' ? over.bowler.playerName : undefined;
      
      if (!bowlerId) return;
      
      if (!bowlerMap.has(bowlerId)) {
        bowlerMap.set(bowlerId, {
          player_id: over.bowler,
          overs: 0,
          maidens: 0,
          runs_given: 0,
          wickets: 0,
          balls_bowled: 0
        });
      }
      
      const stats = bowlerMap.get(bowlerId);
      
      // Count valid balls
      const validBalls = over.balls.filter(ball => 
        !(ball.extras?.wides > 0 || ball.extras?.no_balls > 0)
      ).length;
      
      // Add to balls bowled
      stats.balls_bowled += validBalls;
      
      // Count runs in this over
      let runsInOver = 0;
      over.balls.forEach(ball => {
        // Count runs
        runsInOver += ball.runs || 0;
        
        // Add extras
        if (ball.extras) {
          runsInOver += (ball.extras.wides || 0);
          runsInOver += (ball.extras.no_balls || 0);
          runsInOver += (ball.extras.byes || 0);
          runsInOver += (ball.extras.leg_byes || 0);
        }
        
        // Count wickets
        if (ball.wicket && ball.wicket.fallen) {
          stats.wickets++;
        }
      });
      
      // Add runs to total
      stats.runs_given += runsInOver;
      
      // Check if this is a maiden over (complete over with no runs)
      if (validBalls === 6 && runsInOver === 0) {
        stats.maidens++;
      }
      
      bowlerMap.set(bowlerId, stats);
    });
    
    return Array.from(bowlerMap.values());
  };

  const fetchTeamPlayers = async (teamId: string): Promise<Player[]> => {
    try {
      setIsLoadingPlayers(true);
      console.log(`Fetching players for team ID: ${teamId}`);
      
      const response = await fetch(`/api/management/live-score/team-details/${teamId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch players: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} players for team ${teamId}`);
      return data;
    } catch (error) {
      console.error("Error fetching players:", error);
      toast.error(`Failed to load players: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const loadPlayers = async (currentInnings: Innings) => {
    try {
      if (!currentInnings.team || !currentInnings.team.batting_team || !currentInnings.team.bowling_team) {
        throw new Error("Innings is missing team information");
      }
      
      const battingTeamId = currentInnings.team.batting_team._id;
      const bowlingTeamId = currentInnings.team.bowling_team._id;
      
      if (!battingTeamId || !bowlingTeamId) {
        throw new Error("Missing team IDs in innings data");
      }
      
      console.log("Fetching players for teams:", battingTeamId, bowlingTeamId);
      
      setIsLoadingPlayers(true);
      
      const [battingPlayers, bowlingPlayers] = await Promise.all([
        fetchTeamPlayers(battingTeamId),
        fetchTeamPlayers(bowlingTeamId)
      ]);
      
      if (battingPlayers.length === 0) {
        toast.error(`No batting players found for team ${currentInnings.team.batting_team.teamName}`);
      }
      
      if (bowlingPlayers.length === 0) {
        toast.error(`No bowling players found for team ${currentInnings.team.bowling_team.teamName}`);
      }
      
      console.log("Fetched batting players:", battingPlayers);
      console.log("Fetched bowling players:", bowlingPlayers);
      
      setRealBatsmen(battingPlayers);
      setRealBowlers(bowlingPlayers);
    } catch (error) {
      console.error("Error loading players:", error);
      toast.error(`Failed to load players: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const createNewInnings = async () => {
    if (!activeMatch || !inningsBattingTeam || !inningsBowlingTeam) {
      toast.error("Please select both batting and bowling teams");
      return;
    }
    
    setIsCreatingInnings(true);
    
    try {
      const response = await fetch('/api/management/innings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsNumber: inningsNumber,
          battingTeam: inningsBattingTeam,
          bowlingTeam: inningsBowlingTeam
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create innings: ${errorText}`);
      }
      
      const newInnings = await response.json();
      console.log("Created new innings:", newInnings);
      
      setActiveInnings(newInnings);
      
      await loadPlayers(newInnings);
      
      setInningsDialogOpen(false);
      
      toast.success(`Innings ${inningsNumber} started`);
      
      // Automatically create first over right after innings creation
      try {
        // Create an empty over without selecting a bowler yet
        const overResponse = await fetch('/api/management/new-over', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            matchId: activeMatch._id,
            inningsId: newInnings._id,
            bowlerId: "", // Empty string for now, will select bowler later
            createEmptyOver: true // Flag to indicate we just want an empty over structure
          })
        });
        
        if (overResponse.ok) {
          const updatedInnings = await overResponse.json();
          setActiveInnings(updatedInnings);
          
          // Open dialog to select batsmen
          setTimeout(() => {
            setBatsmenDialogOpen(true);
          }, 500);
        } else {
          const errorText = await overResponse.text();
          console.error("Error creating initial over:", errorText);
          toast.error(`Failed to create initial over: ${errorText}`);
        }
      } catch (error) {
        console.error("Error creating initial over:", error);
      }
      
    } catch (error) {
      console.error("Error creating innings:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreatingInnings(false);
    }
  };

  const createNewOver = async () => {
    if (!activeMatch || !activeInnings) {
      toast.error("No active innings found");
      return null;
    }
    
    try {
      const response = await fetch('/api/management/new-over', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          bowlerId: selectedBowler || "", // Use empty string if bowler not selected
          createEmptyOver: !selectedBowler // Mark as empty over if no bowler selected
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from new-over:", errorText);
        throw new Error(`Failed to create new over: ${errorText}`);
      }
      
      const updatedInnings = await response.json();
      setActiveInnings(updatedInnings);
      
      if (selectedBowler) {
        try {
          const bowlerResponse = await fetch(`/api/management/innings/update-bowler`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              matchId: activeMatch._id,
              inningsId: activeInnings._id,
              bowlerId: selectedBowler
            })
          });
          
          if (!bowlerResponse.ok) {
            console.error("Failed to update current bowler in database");
          }
        } catch (error) {
          console.error("Error updating current bowler:", error);
        }
      } else {
        // If no bowler selected, prompt for bowler selection
        toast.info("Please select a bowler to continue");
      }
      
      return updatedInnings;
    } catch (error) {
      console.error("Error creating new over:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      return null;
    }
  };

  const swapBatsmen = async () => {
    const temp = strikeBatsman;
    setStrikeBatsman(nonStrikeBatsman);
    setNonStrikeBatsman(temp);
    
    if (activeMatch && activeInnings) {
      try {
        const response = await fetch(`/api/management/innings/update-batsmen`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            matchId: activeMatch._id,
            inningsId: activeInnings._id,
            striker: nonStrikeBatsman,
            nonStriker: strikeBatsman
          })
        });
        
        if (!response.ok) {
          console.error("Failed to update current batsmen in database");
        }
      } catch (error) {
        console.error("Error updating current batsmen:", error);
      }
    }
    
    toast.info("Batsmen switched positions");
  };

  const selectBatsmen = async (striker: string, nonStriker: string) => {
    if (striker === nonStriker) {
      toast.error("Cannot select the same player for both batting positions");
      return;
    }
    
    setStrikeBatsman(striker);
    setNonStrikeBatsman(nonStriker);
    setActiveBatsmen([striker, nonStriker]);
    setBatsmenDialogOpen(false);
    
    if (activeMatch && activeInnings) {
      try {
        const response = await fetch(`/api/management/innings/update-batsmen`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            matchId: activeMatch._id,
            inningsId: activeInnings._id,
            striker,
            nonStriker
          })
        });
        
        if (!response.ok) {
          console.error("Failed to update current batsmen in database");
        }
      } catch (error) {
        console.error("Error updating current batsmen:", error);
      }
    }
    
    if (newBatsmanMode) {
      setNewBatsmanMode(false);
      toast.success("New batsman has taken the crease");
    } else {
      toast.success("Batsmen selected successfully");
    }
  };

  const selectNewBatsman = async (newBatsman: string) => {
    if (activeBatsmen.includes(newBatsman)) {
      toast.error("This batsman is already at the crease");
      return;
    }
    
    if (dismissedBatsmen.has(newBatsman)) {
      toast.error("This batsman has already been dismissed");
      return;
    }
    
    setStrikeBatsman(newBatsman);
    const updatedActiveBatsmen = [newBatsman, nonStrikeBatsman];
    setActiveBatsmen(updatedActiveBatsmen);
    setBatsmenDialogOpen(false);
    setNewBatsmanMode(false);
    
    if (activeMatch && activeInnings) {
      try {
        const response = await fetch(`/api/management/innings/update-batsmen`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            matchId: activeMatch._id,
            inningsId: activeInnings._id,
            striker: newBatsman,
            nonStriker: nonStrikeBatsman
          })
        });
        
        if (!response.ok) {
          console.error("Failed to update current batsmen in database");
        }
      } catch (error) {
        console.error("Error updating current batsmen:", error);
      }
    }
    
    toast.success("New batsman has taken the crease");
  };

  const handleAddRuns = async (runs: number) => {
    if (!strikeBatsman || !nonStrikeBatsman) {
      toast.error("Please select both batsmen first");
      setBatsmenDialogOpen(true);
      return;
    }
    
    if (!activeMatch || !activeInnings || !strikeBatsman || !selectedBowler) {
      toast.error("Please select batsman and bowler");
      return;
    }
    
    if (!activeInnings.overs || activeInnings.overs.length === 0) {
      toast.error("Please start a new over first");
      return;
    }
    
    setApiError(null);
    try {
      console.log("Adding runs:", {
        matchId: activeMatch._id,
        inningsId: activeInnings._id,
        batsmanId: strikeBatsman,
        bowlerId: selectedBowler,
        runs
      });
      
      // Check if this is a four or six for tracking
      const isFour = runs === 4;
      const isSix = runs === 6;
      
      const response = await fetch('/api/management/ball-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          batsmanId: strikeBatsman,
          bowlerId: selectedBowler,
          runs: runs,
          isWicket: false,
          extras: null,
          updateBatsmanStats: true,
          isFour,
          isSix
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        
        throw new Error(`Failed to update score: ${errorText}`);
      } else {
        const updatedInnings = await response.json();
        console.log("Updated innings:", updatedInnings);
        setActiveInnings(updatedInnings);
        
        // Process bowling stats for updated scorecard
        if (updatedInnings.overs && updatedInnings.overs.length > 0) {
          const bowlingStats = processBowlingStats(updatedInnings);
          setBowlerStats(bowlingStats);
        }
        
        // Check if over is complete after adding runs
        checkForOverCompletion(updatedInnings);
        
        if (runs % 2 === 1) {
          await swapBatsmen();
        }
      }
      
      toast.success(`Added ${runs} run${runs !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error adding runs:", error);
      setApiError(error instanceof Error ? error.message : "Unknown error");
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleAddExtras = async (extraType: string, runs: number = 1) => {
    if (!strikeBatsman || !nonStrikeBatsman) {
      toast.error("Please select both batsmen first");
      setBatsmenDialogOpen(true);
      return;
    }
    
    if (!activeMatch || !activeInnings || !strikeBatsman || !selectedBowler) {
      toast.error("Please select batsman and bowler");
      return;
    }
    
    if (!activeInnings.overs || activeInnings.overs.length === 0) {
      toast.error("Please start a new over first");
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
      
      const response = await fetch('/api/management/ball-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          batsmanId: strikeBatsman,
          bowlerId: selectedBowler,
          runs: 0,
          isWicket: false,
          extras: extras
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update extras: ${errorText}`);
      } else {
        const updatedInnings = await response.json();
        setActiveInnings(updatedInnings);
        
        // Process bowling stats for updated scorecard
        if (updatedInnings.overs && updatedInnings.overs.length > 0) {
          const bowlingStats = processBowlingStats(updatedInnings);
          setBowlerStats(bowlingStats);
        }
        
        // Check if over is complete after adding extras
        checkForOverCompletion(updatedInnings);
        
        if ((extraType === "bye" || extraType === "leg_bye") && runs % 2 === 1) {
          await swapBatsmen();
        }
      }
      
      toast.success(`Added ${extraType} (${runs})`);
    } catch (error) {
      console.error("Error adding extras:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const openWicketDialog = () => {
    if (!strikeBatsman || !nonStrikeBatsman) {
      toast.error("Please select both batsmen first");
      setBatsmenDialogOpen(true);
      return;
    }
    
    if (!strikeBatsman || !selectedBowler) {
      toast.error("Please select batsman on strike and bowler first");
      return;
    }
    setWicketDialogOpen(true);
  };

  const handleWicket = async () => {
    if (!activeMatch || !activeInnings || !strikeBatsman || !selectedBowler || !wicketType) {
      toast.error("Please select wicket type");
      return;
    }
    
    const needsFielder = ["caught", "stumped", "run out"].includes(wicketType);
    
    if (needsFielder && !selectedFielder) {
      toast.error("Please select fielder for this type of dismissal");
      return;
    }
    
    if (!activeInnings.overs || activeInnings.overs.length === 0) {
      toast.error("Please start a new over first");
      return;
    }
    
    try {
      // Find current batsman stats before dismissal to preserve runs
      let batsmanRuns = 0;
      let ballsFaced = 0;
      let fours = 0;
      let sixes = 0;
      
      if (activeInnings.batsmen) {
        const currentBatsman = activeInnings.batsmen.find(b => {
          const batsmanId = typeof b.player_id === 'string' ? b.player_id : b.player_id?._id;
          return batsmanId === strikeBatsman;
        });
        
        if (currentBatsman) {
          batsmanRuns = currentBatsman.runs || 0;
          ballsFaced = currentBatsman.balls_faced || 0;
          fours = currentBatsman.fours || 0;
          sixes = currentBatsman.sixes || 0;
        }
      }
      
      const response = await fetch('/api/management/ball-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: activeMatch._id,
          inningsId: activeInnings._id,
          batsmanId: strikeBatsman,
          bowlerId: selectedBowler,
          runs: 0,
          isWicket: true,
          wicketType: wicketType,
          fielderId: needsFielder ? selectedFielder : undefined,
          extras: null,
          batsmanStats: {
            runs: batsmanRuns,
            balls_faced: ballsFaced,
            fours,
            sixes
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to record wicket: ${errorText}`);
      } else {
        const updatedInnings = await response.json();
        setActiveInnings(updatedInnings);
        
        // Process bowling stats for updated scorecard
        if (updatedInnings.overs && updatedInnings.overs.length > 0) {
          const bowlingStats = processBowlingStats(updatedInnings);
          setBowlerStats(bowlingStats);
        }
        
        // Update dismissed batsmen set based on updated innings data
        if (updatedInnings.batsmen && Array.isArray(updatedInnings.batsmen)) {
          const newDismissedSet = new Set<string>();
          updatedInnings.batsmen.forEach(batsman => {
            if (batsman.out && batsman.player_id) {
              const batsmanId = typeof batsman.player_id === 'string' 
                ? batsman.player_id 
                : batsman.player_id._id;
              
              if (batsmanId) {
                newDismissedSet.add(batsmanId);
              }
            }
          });
          setDismissedBatsmen(newDismissedSet);
          console.log("Updated dismissed batsmen set:", [...newDismissedSet]);
        }
      }
      
      // Add to dismissed batsmen set locally as well to ensure immediate UI update
      const newDismissedSet = new Set(dismissedBatsmen);
      newDismissedSet.add(strikeBatsman);
      setDismissedBatsmen(newDismissedSet);
      
      setWicketType('');
      setSelectedFielder('');
      setWicketDialogOpen(false);
      
      setNewBatsmanMode(true);
      toast.success(`Wicket! ${wicketType}`);
      
      // Check if over is complete and add the completion logic
      checkForOverCompletion();
      
      setTimeout(() => {
        setBatsmenDialogOpen(true);
      }, 1000);
      
    } catch (error) {
      console.error("Error recording wicket:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const checkForOverCompletion = (inningsToCheck?: Innings) => {
    const inningsToUse = inningsToCheck || activeInnings;
    
    if (!inningsToUse || !inningsToUse.overs || inningsToUse.overs.length === 0) {
      return false;
    }
    
    const currentOver = inningsToUse.overs[inningsToUse.overs.length - 1];
    const validBallsInOver = currentOver?.balls?.filter(ball => 
      !(ball.extras?.wides > 0 || ball.extras?.no_balls > 0)
    ).length || 0;
    
    console.log(`Valid balls in over: ${validBallsInOver}`);
    
    // Update the over complete state - set to true when *exactly* 6 valid balls
    const isComplete = validBallsInOver === 6;
    setIsOverComplete(isComplete);
    
    if (isComplete) {
      toast.info("End of over. You can now start a new over.");
      return true;
    }
    return false;
  };

  const handleOverUp = async () => {
    if (!activeMatch || !activeInnings) {
      toast.error("No active innings found");
      return;
    }
    
    // If there are no overs yet, allow creating the first one
    if (!activeInnings.overs || activeInnings.overs.length === 0) {
      try {
        toast.info("Creating first over...");
        const newInnings = await createNewOver();
        
        if (newInnings) {
          toast.success("New over created");
          setIsOverComplete(false);
        }
      } catch (error) {
        console.error("Error creating first over:", error);
        toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      return;
    }
    
    const currentOver = activeInnings.overs[activeInnings.overs.length - 1];
    const validBallsCount = currentOver?.balls?.filter(ball => 
      !(ball.extras?.wides > 0 || ball.extras?.no_balls > 0)
    ).length || 0;
    
    console.log(`Valid balls in current over: ${validBallsCount}`);
    
    // Only allow starting a new over if the current one has exactly 6 valid balls
    if (validBallsCount !== 6) {
      toast.error("Current over is not complete. Exactly 6 valid balls must be bowled before starting a new over.");
      return;
    }
    
    try {
      toast.info("Creating new over...");
      const newInnings = await createNewOver();
      
      if (newInnings) {
        toast.success("New over started");
        setIsOverComplete(false); // Reset over complete state since we're starting a new one
        await swapBatsmen(); // Swap batsmen at the end of the over
        setSelectedBowler(''); // Clear the bowler to force selection of a new one
      }
    } catch (error) {
      console.error("Error advancing to next over:", error);
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    const updateCurrentBowler = async () => {
      if (activeMatch && activeInnings && selectedBowler) {
        console.log("Updating current bowler in database:", selectedBowler);
        try {
          const response = await fetch(`/api/management/innings/update-bowler`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              matchId: activeMatch._id,
              inningsId: activeInnings._id,
              bowlerId: selectedBowler
            })
          });
          
          if (!response.ok) {
            console.error("Failed to update current bowler in database");
          } else {
            console.log("Successfully updated current bowler in database");
          }
        } catch (error) {
          console.error("Error updating current bowler:", error);
        }
      }
    };
    
    if (selectedBowler) {
      updateCurrentBowler();
    }
  }, [selectedBowler]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-700 mb-4"></div>
        <h3 className="text-lg font-medium">Loading match details...</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/management/${session?.user!.id}`)} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        {activeMatch && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {activeMatch.team1.teamName} vs {activeMatch.team2.teamName}
            </h1>
            <div className="text-sm text-gray-500 space-y-1">
              <div>{activeMatch.tournament_id.tournamentName}</div>
              <div>{activeMatch.venue} • {activeMatch.date} {activeMatch.time}</div>
              <div>{activeMatch.match_format} ({activeMatch.overs} overs)</div>
            </div>
          </div>
        )}

        {activeInnings && (
          <div className="bg-blue-500 text-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {activeInnings.team.batting_team.teamName}
                </h2>
                <div className="text-3xl font-bold mt-2">
                  {activeInnings.runs}/{activeInnings.wickets}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">Overs</div>
                <div className="text-2xl font-bold mt-1">
                  {Math.max(0, (activeInnings.overs || []).length - 1)}.
                  {(activeInnings.overs || []).length > 0 
                    ? ((activeInnings.overs[activeInnings.overs.length - 1]?.balls || []).length || 0) 
                    : 0}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm flex justify-between">
              <span>
                Extras: {(activeInnings.extras?.wides || 0) + 
                (activeInnings.extras?.no_balls || 0) + 
                (activeInnings.extras?.byes || 0) + 
                (activeInnings.extras?.leg_byes || 0)}
              </span>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => fetchMatchDetails()}
                className="text-xs"
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RotateCw className="h-3 w-3 mr-1" />}
                Refresh
              </Button>
            </div>
          </div>
        )}
        
        {apiError && (
          <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm mb-6">
            <p className="font-medium">Error: {apiError}</p>
            <p className="text-xs mt-1">Try refreshing the page or check the console for details.</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scoring" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Scoring
            </TabsTrigger>
            <TabsTrigger value="scorecard" className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4" /> Scorecard
            </TabsTrigger>
          </TabsList>


        <TabsContent value="scoring" className={activeTab === "scoring" ? "block" : "hidden"}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {strikeBatsman && nonStrikeBatsman && (
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium mb-3">Current Batsmen</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="font-medium">
                            {realBatsmen.find(p => p._id === strikeBatsman)?.playerName ||
                              'Striker'}
                          </span>
                          <Badge variant="outline" className="ml-2 text-[10px] bg-green-50">on strike</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {realBatsmen.find(p => p._id === nonStrikeBatsman)?.playerName ||
                            'Non-striker'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={swapBatsmen} 
                        className="w-full"
                      >
                        Swap Batsmen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3">Bowler</h3>
                  
                  {selectedBowler ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">
                            {realBowlers.find(p => p._id === selectedBowler)?.playerName ||
                              'Current Bowler'}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedBowler('')}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Select value={selectedBowler} onValueChange={setSelectedBowler}>
                      <SelectTrigger disabled={isLoadingPlayers || realBowlers.length === 0}>
                        <SelectValue placeholder={
                          isLoadingPlayers 
                            ? "Loading bowlers..." 
                            : realBowlers.length === 0
                              ? "No bowlers available"
                              : "Select bowler"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {realBowlers.map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      variant="default"  
                      onClick={handleOverUp} 
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={!selectedBowler || (activeInnings?.overs?.length > 0 && !isOverComplete)}
                    >
                      {activeInnings?.overs && activeInnings.overs.length > 0 && 
                        activeInnings.overs[activeInnings.overs.length - 1]?.balls?.length < 6 
                        ? "Continue Over" 
                        : "Start New Over"}
                    </Button>
                    {activeInnings?.overs?.length > 0 && !isOverComplete && (
                      <p className="text-xs text-center mt-1 text-gray-500">
                        {activeInnings.overs[activeInnings.overs.length - 1]?.balls?.filter(ball => 
                          !(ball.extras?.wides > 0 || ball.extras?.no_balls > 0)
                        ).length || 0}/6 valid balls bowled in current over
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {activeInnings && activeInnings.overs && activeInnings.overs.length > 0 && (
                <Card className="bg-white">
                  <CardContent className="pt-6">
                    <h3 className="text-sm font-medium mb-3">Ball-by-Ball</h3>
                    <BallDisplay 
                      overs={activeInnings.overs || []} 
                      currentOver={activeInnings.current_over || 0} 
                      currentBall={activeInnings.current_ball || 0} 
                      showInProgress={true}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {(!strikeBatsman || !nonStrikeBatsman) && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center space-y-3">
                      <h3 className="text-sm font-medium text-yellow-800">Select Batsmen</h3>
                      <p className="text-xs text-yellow-700 text-center">
                        Please select two batsmen to start scoring
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setBatsmenDialogOpen(true)}
                      >
                        Select Batsmen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3">Add Runs</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="lg" onClick={() => handleAddRuns(0)} disabled={!strikeBatsman || !selectedBowler}>0</Button>
                    <Button variant="outline" size="lg" onClick={() => handleAddRuns(1)} disabled={!strikeBatsman || !selectedBowler}>1</Button>
                    <Button variant="outline" size="lg" onClick={() => handleAddRuns(2)} disabled={!strikeBatsman || !selectedBowler}>2</Button>
                    <Button variant="outline" size="lg" onClick={() => handleAddRuns(3)} disabled={!strikeBatsman || !selectedBowler}>3</Button>
                    <Button variant="outline" size="lg" onClick={() => handleAddRuns(4)} disabled={!strikeBatsman || !selectedBowler}>4</Button>
                    <Button variant="outline" size="lg" onClick={() => handleAddRuns(6)} disabled={!strikeBatsman || !selectedBowler}>6</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium mb-3">Extras</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleAddExtras("wide")} disabled={!strikeBatsman || !selectedBowler}>Wide</Button>
                    <Button variant="outline" onClick={() => handleAddExtras("no_ball")} disabled={!strikeBatsman || !selectedBowler}>No Ball</Button>
                    <Button variant="outline" onClick={() => handleAddExtras("bye")} disabled={!strikeBatsman || !selectedBowler}>Bye</Button>
                    <Button variant="outline" onClick={() => handleAddExtras("leg_bye")} disabled={!strikeBatsman || !selectedBowler}>Leg Bye</Button>
                  </div>
                </CardContent>
              </Card>

              <Button 
                variant="destructive" 
                onClick={openWicketDialog} 
                className="w-full"
                disabled={!strikeBatsman || !selectedBowler}
              >
                Record Wicket
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="scorecard" className={activeTab === "scorecard" ? "block" : "hidden"}>
          {activeInnings ? (
            <Card>
              <CardContent className="pt-6">
                <ScorecardDisplay 
                  batsmen={activeInnings.batsmen || []} 
                  bowlers={bowlerStats}
                  teamName={activeInnings.team?.batting_team?.teamName || "Batting Team"}
                  extras={activeInnings.extras || { wides: 0, no_balls: 0, byes: 0, leg_byes: 0 }}
                  totalRuns={activeInnings.runs || 0}
                  totalWickets={activeInnings.wickets || 0}
                  totalOvers={(activeInnings.overs?.length || 0) - (activeInnings.overs && activeInnings.overs.length > 0 && 
                              activeInnings.overs[activeInnings.overs.length - 1]?.balls?.length < 6 ? 1 : 0)}
                  currentBatsmen={activeInnings.current_batsmen}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 flex flex-col items-center justify-center text-center">
                <ClipboardList className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700">No Scorecard Available</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  There's no active innings yet. Start a match and score some runs to see the detailed scorecard.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        </Tabs>
      </div>

      {/* Innings Dialog */}
      <Dialog open={inningsDialogOpen} onOpenChange={setInningsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Innings</DialogTitle>
            <DialogDescription>
              {activeMatch?.team1.teamName} vs {activeMatch?.team2.teamName} • Innings {inningsNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Select Teams for Innings {inningsNumber}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Batting Team</label>
                    <Select
                      value={inningsBattingTeam}
                      onValueChange={(value) => {
                        setInningsBattingTeam(value);
                        if (activeMatch && value === activeMatch.team1._id) {
                          setInningsBowlingTeam(activeMatch.team2._id);
                        } else if (activeMatch) {
                          setInningsBowlingTeam(activeMatch.team1._id);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batting team" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeMatch && (
                          <>
                            <SelectItem value={activeMatch.team1._id}>
                              {activeMatch.team1.teamName}
                            </SelectItem>
                            <SelectItem value={activeMatch.team2._id}>
                              {activeMatch.team2.teamName}
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Bowling Team</label>
                    <Select
                      value={inningsBowlingTeam}
                      onValueChange={setInningsBowlingTeam}
                      disabled={!inningsBattingTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bowling team" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeMatch && inningsBattingTeam === activeMatch.team1._id ? (
                          <SelectItem value={activeMatch.team2._id}>
                            {activeMatch.team2.teamName}
                          </SelectItem>
                        ) : activeMatch && (
                          <SelectItem value={activeMatch.team1._id}>
                            {activeMatch.team1.teamName}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={createNewInnings}
              disabled={!inningsBattingTeam || !inningsBowlingTeam || isCreatingInnings}
            >
              {isCreatingInnings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Start Innings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batsmen Dialog */}
      <Dialog open={batsmenDialogOpen} onOpenChange={(open) => {
        if (!open && (!strikeBatsman || !nonStrikeBatsman) && !newBatsmanMode) {
          toast.error("Please select batsmen to continue");
          return;
        }
        setBatsmenDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{newBatsmanMode ? "Select New Batsman" : "Select Batsmen"}</DialogTitle>
            <DialogDescription>
              {newBatsmanMode 
                ? "Select a new batsman to replace the dismissed one"
                : "Select two batsmen to begin the innings"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {!newBatsmanMode ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Striker (On Strike)</label>
                  <Select value={strikeBatsman} onValueChange={setStrikeBatsman}>
                    <SelectTrigger disabled={isLoadingPlayers || realBatsmen.length === 0}>
                      <SelectValue placeholder={
                        isLoadingPlayers 
                          ? "Loading batsmen..." 
                          : realBatsmen.length === 0
                            ? "No batsmen available"
                            : "Select striker"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {realBatsmen
                        .filter(player => {
                          // Don't show batsmen who are marked as out in the innings model
                          return !dismissedBatsmen.has(player._id);
                        })
                        .map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Non-Striker</label>
                  <Select value={nonStrikeBatsman} onValueChange={setNonStrikeBatsman}>
                    <SelectTrigger disabled={isLoadingPlayers || !strikeBatsman || realBatsmen.length === 0}>
                      <SelectValue placeholder={
                        isLoadingPlayers 
                          ? "Loading batsmen..." 
                          : !strikeBatsman 
                            ? "Select striker first" 
                            : realBatsmen.length === 0
                              ? "No batsmen available"
                              : "Select non-striker"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {realBatsmen
                        .filter(player => {
                          // Don't show batsmen who are out or selected as striker
                          return !dismissedBatsmen.has(player._id) && player._id !== strikeBatsman;
                        })
                        .map(player => (
                          <SelectItem key={player._id} value={player._id}>
                            {player.playerName}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium mb-1 block">Select New Batsman</label>
                <Select value={strikeBatsman} onValueChange={setStrikeBatsman}>
                  <SelectTrigger disabled={isLoadingPlayers || realBatsmen.length === 0}>
                    <SelectValue placeholder={
                      isLoadingPlayers 
                        ? "Loading batsmen..." 
                        : realBatsmen.length === 0
                          ? "No batsmen available"
                          : "Select new batsman"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {realBatsmen
                      .filter(player => {
                        // Don't show batsmen who are out or already at crease (non-striker)
                        return !dismissedBatsmen.has(player._id) && player._id !== nonStrikeBatsman;
                      })
                      .map(player => (
                        <SelectItem key={player._id} value={player._id}>
                          {player.playerName}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                
                {realBatsmen.filter(player => !dismissedBatsmen.has(player._id) && player._id !== nonStrikeBatsman).length === 0 && (
                  <div className="mt-3 bg-yellow-50 p-3 rounded text-yellow-700 text-sm">
                    All available batsmen are either dismissed or already batting.
                  </div>
                )}
              </div>
            )}

            {realBatsmen.length === 0 && !isLoadingPlayers && (
              <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 text-sm">
                <p className="font-medium">No players available</p>
                <p className="mt-1">Please make sure players are added to the teams and try refreshing the page.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={fetchMatchDetails}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh Data
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!newBatsmanMode ? (
              <Button 
                onClick={() => selectBatsmen(strikeBatsman, nonStrikeBatsman)}
                disabled={!strikeBatsman || !nonStrikeBatsman || realBatsmen.length === 0}
              >
                Confirm Selection
              </Button>
            ) : (
              <Button 
                onClick={() => selectNewBatsman(strikeBatsman)}
                disabled={!strikeBatsman || realBatsmen.length === 0}
              >
                Send New Batsman In
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wicket Dialog */}
      <Dialog open={wicketDialogOpen} onOpenChange={setWicketDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
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
            
            {wicketType && ["caught", "run out", "stumped"].includes(wicketType) && (
              <div>
                <label className="text-sm font-medium mb-1 block">Fielder</label>
                <Select value={selectedFielder} onValueChange={setSelectedFielder}>
                  <SelectTrigger disabled={realBowlers.length === 0}>
                    <SelectValue placeholder={
                      realBowlers.length === 0
                      ? "No fielders available"
                      : "Select fielder"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {realBowlers.map(player => (
                      <SelectItem key={player._id} value={player._id}>
                        {player.playerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {realBowlers.length === 0 && (
              <div className="bg-yellow-50 p-3 rounded text-yellow-800 text-sm">
                No fielders available. Please refresh the page and try again.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setWicketDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="default" 
              onClick={handleWicket} 
              disabled={
                !wicketType || 
                (["caught", "run out", "stumped"].includes(wicketType) && !selectedFielder) ||
                (["caught", "run out", "stumped"].includes(wicketType) && realBowlers.length === 0)
              }
            >
              Confirm Wicket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

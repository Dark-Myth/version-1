"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, Calendar, ArrowLeft, Trophy, User, MapPin, Users, Star, 
   TrendingUp, Target, Award
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PlayerDetails from "@/components/PlayerDetails";
import { 
  BATTING_TABLE_COLUMNS, 
  BOWLING_TABLE_COLUMNS, 
  FIELDING_TABLE_COLUMNS, 
  STATS_TABS, 
  TEAM_DETAIL_TABS,
  ROLE_BADGE_COLORS,
  STATUS_BADGE_COLORS,
  ICON_COLORS,
  STATS_CONFIG
} from "@/constants/teamdetails";

interface BattingStats {
  matches: number;
  runs: number;
  strikeRate: number;
  average: number;
  fifties: number;
  centuries: number;
  ballsFaced: number;
}

interface BowlingStats {
  matches: number;
  oversBowled: number;
  wickets: number;
  economyRate: number;
  bowlingAverage: number;
  bestFigures: string;
}

interface FieldingStats {
  catches: number;
  stumpings: number;
}

interface PlayerStats {
  batting: BattingStats;
  bowling: BowlingStats;
  fielding: FieldingStats;
}

interface Player {
  _id: string;
  player_id: string;
  name: string;
  role: string;
  originalRole: string;
  battingStyle?: string;
  bowlingStyle?: string;
  status: string;
  isCapt?: boolean;
  isViceCapt?: boolean;
  isWicketKeeper?: boolean;
  globalStats?: PlayerStats;
  tournamentStats?: PlayerStats;
}

interface Tournament {
  _id: string;
  tournamentName: string;
  startDate: string;
  endDate?: string;
  venue?: string;
}

interface TeamDetails {
  _id: string;
  teamName: string;
  shortCode?: string;
  tournament_id: Tournament;
  players: string[];
  playersInfo: Player[];
  status: string;
  coach?: string;
}

const TeamDetails = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = params;
  const tournament_id = searchParams.get('tournament_id');
  
  const [loading, setLoading] = useState(true);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [statView, setStatView] = useState<"tournament" | "career">("tournament");
  
  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        // Update API endpoint to include tournament_id if available
        const endpoint = tournament_id 
          ? `/api/teams/team-details/${id}?tournament_id=${tournament_id}`
          : `/api/teams/team-details/${id}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch team details");
        }
        
        const data = await response.json();
        setTeamDetails(data);
      } catch (error) {
        toast.error(`${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTeamDetails();
    }
  }, [id, tournament_id]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get status badge color using constants
  const getStatusColor = (status: string) => {
    const statusKey = status.toLowerCase() as keyof typeof STATUS_BADGE_COLORS;
    return STATUS_BADGE_COLORS[statusKey] || STATUS_BADGE_COLORS.default;
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get player role badge color using constants
  const getRoleBadgeColor = (role: string) => {
    if (role.includes("Captain")) return ROLE_BADGE_COLORS.captain;
    if (role.toLowerCase().includes("batsman")) return ROLE_BADGE_COLORS.batsman;
    if (role.toLowerCase().includes("bowler")) return ROLE_BADGE_COLORS.bowler;
    if (role.toLowerCase().includes("all-rounder")) return ROLE_BADGE_COLORS.allRounder;
    if (role.toLowerCase().includes("wicket")) return ROLE_BADGE_COLORS.wicketKeeper;
    return ROLE_BADGE_COLORS.default;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  // Filter and sort players for different stat tables
  const getBattingPlayers = () => {
    return teamDetails?.playersInfo
      .filter(STATS_CONFIG.batting.playerFilter)
      .sort((a, b) => STATS_CONFIG.batting.playerSort(a, b, statView))
      || [];
  };
  
  const getBowlingPlayers = () => {
    return teamDetails?.playersInfo
      .filter(STATS_CONFIG.bowling.playerFilter)
      .sort((a, b) => STATS_CONFIG.bowling.playerSort(a, b, statView))
      || [];
  };
  
  const getFieldingPlayers = () => {
    return teamDetails?.playersInfo
      .filter(player => STATS_CONFIG.fielding.playerFilter(player, statView))
      .sort((a, b) => STATS_CONFIG.fielding.playerSort(a, b, statView))
      || [];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col w-full max-w-7xl mx-auto py-8 px-4"
    >
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
      </div>
      
      {loading ? (
        <div className="space-y-6">
         
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <Skeleton className="h-24 w-24 rounded-full mb-4" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : teamDetails ? (
        <div className="space-y-6">
          {/* Team Header Card */}
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-gray-700" />
                  <CardTitle className="text-xl font-medium text-gray-800">
                    {teamDetails.teamName}
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(teamDetails.status)}>
                  {teamDetails.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-gray-500">
                      {teamDetails.shortCode || teamDetails.teamName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Tournament</p>
                        <p className="font-medium">{teamDetails.tournament_id.tournamentName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Tournament Dates</p>
                        <p className="font-medium">
                          {formatDate(teamDetails.tournament_id.startDate)}
                          {teamDetails.tournament_id.endDate && ` - ${formatDate(teamDetails.tournament_id.endDate)}`}
                        </p>
                      </div>
                    </div>
                    
                    {teamDetails.tournament_id.venue && (
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Venue</p>
                          <p className="font-medium">{teamDetails.tournament_id.venue}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-indigo-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Squad Size</p>
                        <p className="font-medium">{teamDetails.playersInfo.length} Players</p>
                      </div>
                    </div>
                    
                    {teamDetails.coach && (
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Coach</p>
                          <p className="font-medium">{teamDetails.coach}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs for Team Details */}
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {TEAM_DETAIL_TABS.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Overview Tab - Shows all players in a grid */}
            <TabsContent value="overview" className="space-y-4">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {teamDetails.playersInfo.map((player) => (
                  <motion.div 
                    key={player._id} 
                    variants={itemVariants}
                    className="flex items-center p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                  >
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarFallback className="bg-gray-200 text-gray-700">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {player.name}
                        {player.isCapt && <span className="ml-2 text-xs text-amber-600">(C)</span>}
                        {player.isViceCapt && <span className="ml-2 text-xs text-orange-600">(VC)</span>}
                      </h3>
                      <Badge className={`mt-1 text-xs ${getRoleBadgeColor(player.role)}`}>
                        {player.role}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {player.tournamentStats?.batting.matches 
                          ? `${player.tournamentStats.batting.matches} match${player.tournamentStats.batting.matches !== 1 ? 'es' : ''}`
                          : 'No matches yet'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>
            
            {/* Players Tab - Shows detailed player info */}
            <TabsContent value="players">
              {teamDetails.playersInfo.map((player, index) => (
                <motion.div
                  key={player._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="mb-4"
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-lg">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-medium flex items-center">
                              {player.name}
                              {player.isCapt && <Star className="h-4 w-4 text-amber-500 ml-1" />}
                            </h3>
                            <Badge className={`mt-1 ${getRoleBadgeColor(player.role)}`}>
                              {player.role}
                            </Badge>
                            <Badge className={`mt-1 ml-1 ${getStatusColor(player.status)}`}>
                              {player.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 mt-4 md:mt-0">
                          {player.battingStyle && (
                            <div>
                              <p className="text-xs text-gray-500">Batting</p>
                              <p className="text-sm font-medium">{player.battingStyle}</p>
                            </div>
                          )}
                          
                          {player.bowlingStyle && (
                            <div>
                              <p className="text-xs text-gray-500">Bowling</p>
                              <p className="text-sm font-medium">{player.bowlingStyle}</p>
                            </div>
                          )}
                          
                          {player.tournamentStats && (
                            <div className="grid grid-cols-3">
                              <div>
                                <p className="text-xs text-gray-500">Matches</p>
                                <p className="text-sm font-medium">{player.tournamentStats.batting.matches}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Runs</p>
                                <p className="text-sm font-medium">{player.tournamentStats.batting.runs}</p>
                              </div>
                              
                              {(player.originalRole.includes("bowler") || player.originalRole.includes("all-rounder"))&& (
                                <div>
                                  <p className="text-xs text-gray-500">Wickets</p>
                                  <p className="text-sm font-medium">{player.tournamentStats.bowling.wickets}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
            
            {/* Stats Tab - Shows player statistics */}
            <TabsContent value="stats">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">
                  Player Statistics
                </h3>
                <div className="flex rounded-md overflow-hidden border">
                  {STATS_TABS.map(tab => (
                    <button 
                      key={tab.id}
                      className={`px-3 py-1 text-sm ${statView === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-white text-gray-600'}`}
                      onClick={() => setStatView(tab.id as "tournament" | "career")}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Batting Stats */}
              <PlayerDetails 
                type="batting"
                players={getBattingPlayers()}
                statView={statView}
                columns={BATTING_TABLE_COLUMNS}
                title={STATS_CONFIG.batting.title}
                iconColor={ICON_COLORS.batting}
                getInitials={getInitials}
              />
              
              {/* Bowling Stats */}
              <PlayerDetails 
                type="bowling"
                players={getBowlingPlayers()}
                statView={statView}
                columns={BOWLING_TABLE_COLUMNS}
                title={STATS_CONFIG.bowling.title}
                iconColor={ICON_COLORS.bowling}
                getInitials={getInitials}
              />
              
              {/* Fielding Stats */}
              <PlayerDetails 
                type="fielding"
                players={getFieldingPlayers()}
                statView={statView}
                columns={FIELDING_TABLE_COLUMNS}
                title={STATS_CONFIG.fielding.title}
                iconColor={ICON_COLORS.fielding}
                getInitials={getInitials}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 mb-2">Team Not Found</h3>
          <p className="text-gray-500 mb-6">The team you are looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/teams')}>
            Go Back to Teams
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default TeamDetails;
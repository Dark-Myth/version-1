import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Match, MatchStatusInfo } from "@/types/match";
import { format } from "date-fns";

interface MatchCardProps {
  match: Match;
  matchInfo: MatchStatusInfo | null;
  index: number;
}

const MatchCard = ({ match, matchInfo, index }: MatchCardProps) => {
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Format date
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  // Check if a match is today
  const isMatchToday = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const matchDate = new Date(dateString);
    matchDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === matchDate.getTime();
  };

  return (
    <motion.div
      key={`match-${match._id || index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        isMatchToday(match.date) ? 'border-green-300' : ''
      }`}>
        <Link href={`/matches/${match._id}`}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <Badge className={getStatusColor(match.status)}>
                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </Badge>
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {match.time}
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col items-center w-5/12">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mb-2 border border-gray-200">
                  <span className="font-bold">{match.team1.shortCode}</span>
                </div>
                <p className="text-sm text-center font-medium truncate">{match.team1.teamName}</p>
                {match.status === 'completed' && matchInfo?.firstInningsScore && (
                  <p className="text-xs mt-1">{
                    match.innings && match.innings[0]?.battingTeam._id === match.team1._id 
                      ? matchInfo.firstInningsScore
                      : matchInfo.secondInningsScore
                  }</p>
                )}
              </div>
              
              <div className="flex flex-col items-center w-2/12">
                <div className="text-sm font-bold text-gray-500">VS</div>
                {match.status === 'completed' && match.winningTeam && (
                  <div className="text-xs text-gray-500 mt-1">
                    {match.winningTeam._id === match.team1._id ? (
                      <Badge className="bg-green-50 text-green-700 text-xs">Winner</Badge>
                    ) : match.winningTeam._id === match.team2._id ? (
                      <Badge className="bg-red-50 text-red-700 text-xs">Lost</Badge>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center w-5/12">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mb-2 border border-gray-200">
                  <span className="font-bold">{match.team2.shortCode}</span>
                </div>
                <p className="text-sm text-center font-medium truncate">{match.team2.teamName}</p>
                {match.status === 'completed' && matchInfo?.secondInningsScore && (
                  <p className="text-xs mt-1">{
                    match.innings && match.innings[0]?.battingTeam._id === match.team2._id 
                      ? matchInfo.firstInningsScore
                      : matchInfo.secondInningsScore
                  }</p>
                )}
                {match.status === 'completed' && match.winningTeam && match.winningTeam._id === match.team2._id && (
                  <Badge className="mt-1 bg-green-50 text-green-700 text-xs">Winner</Badge>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatMatchDate(match.date)}
                {isMatchToday(match.date) && (
                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Today</Badge>
                )}
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[100px]">{match.venue}</span>
              </div>
            </div>
            
            {match.status === 'completed' && match.winningTeam && (
              <div className="mt-3 text-xs font-medium text-gray-700 border-t pt-2">
                {match.winningTeam.teamName} won the match
              </div>
            )}
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};

export default MatchCard;

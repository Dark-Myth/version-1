import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { Match, MatchStatusInfo } from "@/types/match";

interface LiveMatchProps {
  match: Match;
  matchInfo: MatchStatusInfo | null;
  index: number;
}

const LiveMatch = ({ match, matchInfo, index }: LiveMatchProps) => {
  return (
    <motion.div
      key={`live-${match._id || index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="border rounded-lg overflow-hidden bg-gradient-to-r from-green-50 to-white"
    >
      <Link href={`/matches/${match._id}`}>
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div className="flex items-center mb-2 md:mb-0">
              <Badge className="bg-green-100 text-green-800 border border-green-300 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                LIVE
              </Badge>
              <span className="ml-2 text-sm text-gray-500">{match.match_format} • {match.overs} Overs</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {match.venue}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center justify-center w-full md:w-2/5 mb-4 md:mb-0">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-xl font-bold">{match.team1.shortCode}</span>
                </div>
                <p className="mt-2 font-medium text-center">{match.team1.teamName}</p>
                {matchInfo && matchInfo.battingTeam && matchInfo.battingTeam._id === match.team1._id && (
                  <>
                    <p className="text-2xl font-bold mt-1">{matchInfo.score}</p>
                    <p className="text-sm text-gray-500">{matchInfo.overs} overs</p>
                  </>
                )}
                {matchInfo && matchInfo.firstInningsScore && match.innings && match.innings[0]?.battingTeam._id === match.team1._id && (
                  <p className="text-md font-medium mt-1">{matchInfo.firstInningsScore}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center mb-4 md:mb-0">
              <div className="px-4 py-2 rounded-full bg-gray-100 text-sm font-medium">
                VS
              </div>
            </div>

            <div className="flex items-center justify-center w-full md:w-2/5">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <span className="text-xl font-bold">{match.team2.shortCode}</span>
                </div>
                <p className="mt-2 font-medium text-center">{match.team2.teamName}</p>
                {matchInfo && matchInfo.battingTeam && matchInfo.battingTeam._id === match.team2._id && (
                  <>
                    <p className="text-2xl font-bold mt-1">{matchInfo.score}</p>
                    <p className="text-sm text-gray-500">{matchInfo.overs} overs</p>
                  </>
                )}
                {matchInfo && matchInfo.secondInningsScore && match.innings && match.innings[0]?.battingTeam._id === match.team2._id && (
                  <p className="text-md font-medium mt-1">{matchInfo.secondInningsScore}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            {matchInfo && (
              <p className="text-sm font-medium text-green-700">
                {matchInfo.status}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default LiveMatch;

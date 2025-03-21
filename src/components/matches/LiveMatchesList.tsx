import { Match, MatchStatusInfo } from "@/types/match";
import LiveMatch from "./LiveMatch";

interface LiveMatchesListProps {
  liveMatches: Match[];
  getMatchStatusInfo: (match: Match) => MatchStatusInfo | null;
}

const LiveMatchesList = ({ liveMatches, getMatchStatusInfo }: LiveMatchesListProps) => {
  if (liveMatches.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        Live Matches
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {liveMatches.map((match, index) => (
          <LiveMatch 
            key={match._id}
            match={match}
            matchInfo={getMatchStatusInfo(match)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default LiveMatchesList;

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";
import { Match, MatchStatusInfo } from "@/types/match";
import MatchCard from "./MatchCard";

interface MatchesListProps {
  loading: boolean;
  tournamentName: string;
  matchView: "upcoming" | "past";
  setMatchView: (view: "upcoming" | "past") => void;
  filteredMatches: Match[];
  getMatchStatusInfo: (match: Match) => MatchStatusInfo | null;
}

const MatchesList = ({
  loading,
  tournamentName,
  matchView,
  setMatchView,
  filteredMatches,
  getMatchStatusInfo
}: MatchesListProps) => {
  return (
    <div className="mt-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-800">
          {tournamentName} Matches
        </h3>
        
        <Tabs
          defaultValue="upcoming"
          value={matchView}
          onValueChange={(value) => setMatchView(value as "upcoming" | "past")}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="p-4 space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match, index) => (
            <MatchCard 
              key={match._id || index}
              match={match}
              matchInfo={getMatchStatusInfo(match)}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded bg-gray-50">
          <Trophy className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No {matchView} matches found for this tournament</p>
          <p className="text-gray-400 text-sm mt-1">Try selecting a different tournament or view</p>
        </div>
      )}
    </div>
  );
};

export default MatchesList;

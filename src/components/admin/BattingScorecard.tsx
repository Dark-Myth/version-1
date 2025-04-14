import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Player {
  _id: string;
  playerName: string;
}

interface BatsmanScore {
  player_id: string;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number | string;
  dismissal_type: string;
  dismissed_by: {
    bowler: string | null;
    fielder: string | null;
  };
  isActive: boolean;
  battingPosition: number;
  hasPlayed: boolean;
  isOut: boolean;
}

interface BattingScorecardProps {
  battingScorecard: BatsmanScore[];
  realBatsmen: Player[];
  mockBatsmen: Player[];
  strikeBatsman: string;
  nonStrikeBatsman: string;
  refreshing: boolean;
  onRefresh: () => void;
}

const BattingScorecard: React.FC<BattingScorecardProps> = ({
  battingScorecard,
  realBatsmen,
  mockBatsmen,
  strikeBatsman,
  nonStrikeBatsman,
  refreshing,
  onRefresh
}) => {
  // Helper to find batsman name
  const getBatsmanName = (playerId: string, index: number) => {
    return realBatsmen.find(p => p._id === playerId)?.playerName ||
      mockBatsmen.find(p => p._id === playerId)?.playerName ||
      `Batsman ${index + 1}`;
  };
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Batting Scorecard</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
      
      {battingScorecard.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 font-medium">Batsman</th>
                <th className="text-center py-1 font-medium">R</th>
                <th className="text-center py-1 font-medium">B</th>
                <th className="text-center py-1 font-medium">4s</th>
                <th className="text-center py-1 font-medium">6s</th>
                <th className="text-center py-1 font-medium">SR</th>
              </tr>
            </thead>
            <tbody>
              {battingScorecard
                .filter(batsman => batsman.hasPlayed)
                .sort((a, b) => (a.battingPosition || 99) - (b.battingPosition || 99))
                .map((batsman, index) => {
                  const playerName = getBatsmanName(batsman.player_id, index);
                  const isStriker = batsman.player_id === strikeBatsman;
                  const isNonStriker = batsman.player_id === nonStrikeBatsman;
                  
                  return (
                    <tr 
                      key={batsman.player_id}
                      className={`border-b border-gray-100 ${
                        isStriker || isNonStriker ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="py-1 flex items-center">
                        {(isStriker || isNonStriker) && (
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${
                            isStriker ? 'bg-green-500' : 'bg-blue-400'
                          }`}></div>
                        )}
                        <span>{playerName}</span>
                        {isStriker && <span className="text-[10px] ml-1 text-green-600">*</span>}
                        {batsman.isOut && (
                          <span className="ml-1.5 text-[10px] text-gray-500">
                            {batsman.dismissal_type}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-1">{batsman.runs}</td>
                      <td className="text-center py-1">{batsman.balls_faced}</td>
                      <td className="text-center py-1">{batsman.fours}</td>
                      <td className="text-center py-1">{batsman.sixes}</td>
                      <td className="text-center py-1">
                        {typeof batsman.strike_rate === 'number'
                          ? batsman.strike_rate.toFixed(1)
                          : batsman.balls_faced > 0
                            ? ((batsman.runs / batsman.balls_faced) * 100).toFixed(1)
                            : '0.0'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No batsmen have faced balls yet.</p>
      )}
    </div>
  );
};

export default BattingScorecard;

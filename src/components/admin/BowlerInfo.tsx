import React from "react";

interface Player {
  _id: string;
  playerName: string;
}

interface BowlerData {
  player_id: string;
  overs_bowled: number;
  balls_bowled: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  economy: number;
  no_balls: number;
  wides: number;
}

interface BowlerInfoProps {
  selectedBowler: string;
  bowlers: BowlerData[];
  realBowlers: Player[];
  mockBowlers: Player[];
}

const BowlerInfo: React.FC<BowlerInfoProps> = ({
  selectedBowler,
  bowlers,
  realBowlers,
  mockBowlers
}) => {
  if (!selectedBowler) return null;
  
  const bowlerData = bowlers?.find(b => b.player_id === selectedBowler);
  
  const bowlerName = 
    realBowlers.find(p => p._id === selectedBowler)?.playerName ||
    mockBowlers.find(p => p._id === selectedBowler)?.playerName ||
    'Selected Bowler';
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <h3 className="text-sm font-medium mb-2">Current Bowler</h3>
      <div className="text-xs">
        {bowlerData ? (
          <div className="flex flex-col space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{bowlerName}</span>
              <span className="text-green-600 font-medium">
                {bowlerData.wickets}-{bowlerData.runs_conceded}
              </span>
            </div>
            <div className="text-gray-500 flex justify-between">
              <span>
                {Math.floor(bowlerData.balls_bowled / 6)}.{bowlerData.balls_bowled % 6} overs
              </span>
              <span>Economy: {bowlerData.economy.toFixed(2)}</span>
            </div>
            {(bowlerData.wides > 0 || bowlerData.no_balls > 0) && (
              <div className="text-gray-500 text-[10px]">
                Extras: {bowlerData.wides} wide(s), {bowlerData.no_balls} no-ball(s)
              </div>
            )}
          </div>
        ) : (
          <span>{bowlerName}</span>
        )}
      </div>
    </div>
  );
};

export default BowlerInfo;

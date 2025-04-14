import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Player {
  _id: string;
  playerName: string;
}

interface BatsmanStats {
  player_id: string | { _id: string; playerName: string };
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  out: boolean;
  dismissal_type?: string;
  fielder?: string | { _id: string; playerName: string };
  bowler?: string | { _id: string; playerName: string };
}

interface BowlerStats {
  player_id: string | { _id: string; playerName: string };
  overs: number;
  maidens: number;
  runs_given: number;
  wickets: number;
  balls_bowled: number;
}

interface BattingTeam {
  teamName: string;
  shortCode?: string;
}

interface ScorecardDisplayProps {
  batsmen: BatsmanStats[];
  bowlers: BowlerStats[];
  teamName: string;
  extras: {
    wides: number;
    no_balls: number;
    byes: number;
    leg_byes: number;
  };
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  currentBatsmen?: {
    striker: string | { _id: string; playerName?: string };
    non_striker: string | { _id: string; playerName?: string };
  };
}

const ScorecardDisplay: React.FC<ScorecardDisplayProps> = ({
  batsmen,
  bowlers,
  teamName,
  extras,
  totalRuns,
  totalWickets,
  totalOvers,
  currentBatsmen
}) => {
  // Calculate total extras
  const totalExtras = (extras?.wides || 0) + 
                      (extras?.no_balls || 0) + 
                      (extras?.byes || 0) + 
                      (extras?.leg_byes || 0);
  
  // Helper function to get player name
  const getPlayerName = (player: any): string => {
    if (!player) return 'Unknown';
    if (typeof player === 'string') return 'Player';
    return player.playerName || 'Unknown';
  };
  
  // Helper function to check if batsman is currently batting
  const isCurrentBatsman = (batsmanId: string): boolean => {
    if (!currentBatsmen) return false;
    
    const strikerId = typeof currentBatsmen.striker === 'string' 
      ? currentBatsmen.striker 
      : currentBatsmen.striker?._id;
    
    const nonStrikerId = typeof currentBatsmen.non_striker === 'string'
      ? currentBatsmen.non_striker
      : currentBatsmen.non_striker?._id;
    
    return batsmanId === strikerId || batsmanId === nonStrikerId;
  };
  
  // Helper function to calculate strike rate
  const calculateStrikeRate = (runs: number, balls: number): string => {
    if (!balls) return '0.00';
    const sr = (runs / balls) * 100;
    return sr.toFixed(2);
  };
  
  // Helper function to calculate economy rate
  const calculateEconomy = (runs: number, balls: number): string => {
    if (!balls) return '0.00';
    const overs = balls / 6;
    const economy = runs / overs;
    return economy.toFixed(2);
  };
  
  // Helper function to format overs (e.g., convert 4.3 to mean 4 overs and 3 balls)
  const formatOvers = (balls: number): string => {
    const completeOvers = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${completeOvers}.${remainingBalls}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">{teamName} Batting</h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[180px] md:w-[280px]">Batter</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">B</TableHead>
              <TableHead className="text-right hidden md:table-cell">4s</TableHead>
              <TableHead className="text-right hidden md:table-cell">6s</TableHead>
              <TableHead className="text-right">SR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batsmen && batsmen.length > 0 ? (
              batsmen.map((batsman, index) => {
                const batsmanId = typeof batsman.player_id === 'string' 
                  ? batsman.player_id 
                  : batsman.player_id?._id;
                
                const isCurrentlyBatting = isCurrentBatsman(batsmanId || '');
                
                return (
                  <TableRow key={index} className={isCurrentlyBatting ? "bg-blue-50" : ""}>
                    <TableCell className="font-medium">
                      <div>
                        {getPlayerName(batsman.player_id)}
                        {isCurrentlyBatting && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 text-[10px]">
                            batting
                          </Badge>
                        )}
                      </div>
                      {batsman.out && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {batsman.dismissal_type} 
                          {batsman.bowler && ` b ${getPlayerName(batsman.bowler)}`}
                          {batsman.fielder && ` c ${getPlayerName(batsman.fielder)}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">{batsman.runs || 0}</TableCell>
                    <TableCell className="text-right">{batsman.balls_faced || 0}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{batsman.fours || 0}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{batsman.sixes || 0}</TableCell>
                    <TableCell className="text-right">
                      {calculateStrikeRate(batsman.runs || 0, batsman.balls_faced || 0)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No batting data available
                </TableCell>
              </TableRow>
            )}
            
            {/* Extras and Total rows */}
            <TableRow className="bg-gray-50">
              <TableCell className="font-medium">Extras</TableCell>
              <TableCell className="text-right font-medium">{totalExtras}</TableCell>
              <TableCell colSpan={4} className="text-xs text-gray-500">
                {extras?.wides ? `wd ${extras.wides} ` : ''}
                {extras?.no_balls ? `nb ${extras.no_balls} ` : ''}
                {extras?.byes ? `b ${extras.byes} ` : ''}
                {extras?.leg_byes ? `lb ${extras.leg_byes}` : ''}
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-50 font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totalRuns}/{totalWickets}</TableCell>
              <TableCell colSpan={4} className="text-gray-600 text-sm">
                ({formatOvers(totalOvers * 6)} Overs)
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Bowling</h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[180px] md:w-[280px]">Bowler</TableHead>
              <TableHead className="text-right">O</TableHead>
              <TableHead className="text-right hidden md:table-cell">M</TableHead>
              <TableHead className="text-right">R</TableHead>
              <TableHead className="text-right">W</TableHead>
              <TableHead className="text-right">Econ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bowlers && bowlers.length > 0 ? (
              bowlers.map((bowler, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {getPlayerName(bowler.player_id)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatOvers(bowler.balls_bowled || 0)}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">{bowler.maidens || 0}</TableCell>
                  <TableCell className="text-right">{bowler.runs_given || 0}</TableCell>
                  <TableCell className="text-right font-medium">{bowler.wickets || 0}</TableCell>
                  <TableCell className="text-right">
                    {calculateEconomy(bowler.runs_given || 0, bowler.balls_bowled || 0)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No bowling data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ScorecardDisplay;

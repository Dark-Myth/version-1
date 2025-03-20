import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Target, Award } from "lucide-react";
import { STAT_FORMATTERS } from "@/constants/teamdetails";
import {motion} from "framer-motion";

interface Player {
  _id: string;
  name: string;
  role?: string;
  originalRole?: string;
  isCapt?: boolean;
  isViceCapt?: boolean;
  isWicketKeeper?: boolean;
  tournamentStats?: any;
  globalStats?: any;
}

interface PlayerDetailsProps {
  type: 'batting' | 'bowling' | 'fielding';
  players: Player[];
  statView: 'tournament' | 'career';
  columns: Array<{id: string, label: string, align: string}>;
  title: string;
  iconColor: string;
  getInitials: (name: string) => string;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({
  type,
  players,
  statView,
  columns,
  title,
  iconColor,
  getInitials
}) => {
  // Determine icon based on type
  let Icon;
  if (type === 'batting') {
    Icon = TrendingUp;
  } else if (type === 'bowling') {
    Icon = Target;
  } else {
    Icon = Award;
  }

  // Get stats based on the view type (tournament or career)
  const getPlayerStats = (player: Player) => {
    return statView === 'tournament' ? player.tournamentStats : player.globalStats;
  };

  // Get specific stats section (batting, bowling, fielding)
  const getStats = (player: Player) => {
    const stats = getPlayerStats(player);
    if (!stats) return null;
    return stats[type];
  };

  const header_style="px-4 py-2 text-center";

  return (
    <motion.div
      
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    >
    <Card className="mb-4">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center">
          <Icon className={`h-4 w-4 ${iconColor} mr-2`} />
          <CardTitle className="text-md font-medium text-gray-800">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {columns.map(column => (
                  <th 
                    key={column.id} 
                    className={`px-4 py-2 text-${column.align} font-medium text-gray-500`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map(player => {
                const stats = getStats(player);
                
                return (
                  <tr key={`${type}-${player._id}`} className="border-t">
                    <td className="px-4 py-2">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                        {player.isCapt && <span className="ml-1 text-xs text-amber-600">(C)</span>}
                        {player.isViceCapt && <span className="ml-1 text-xs text-blue-600">(VC)</span>}
                        {type === 'fielding' && player.isWicketKeeper && 
                          <span className="ml-1 text-xs text-red-600">(WK)</span>
                        }
                      </div>
                    </td>
                    
                    {type === 'batting' && (
                      <>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.matches, 0)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.runs, 0)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.decimals(stats?.strikeRate, 2)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.decimals(stats?.average, 2)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.fifties, 0)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.centuries, 0)}</td>
                      </>
                    )}
                    
                    {type === 'bowling' && (
                      <>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.matches, 0)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.decimals(stats?.oversBowled, 1)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.wickets, 0)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.decimals(stats?.economyRate, 2)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.decimals(stats?.bowlingAverage, 2)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.bestFigures, "0/0")}</td>
                      </>
                    )}
                    
                    {type === 'fielding' && (
                      <>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.catches, 0)}</td>
                        <td className={header_style}>{STAT_FORMATTERS.placeholder(stats?.stumpings, 0)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
              
              {players.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default PlayerDetails;
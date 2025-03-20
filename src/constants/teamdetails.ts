export const BATTING_TABLE_COLUMNS = [
  { id: 'player', label: 'Player', align: 'left' },
  { id: 'matches', label: 'M', align: 'center' },
  { id: 'runs', label: 'Runs', align: 'center' },
  { id: 'strikeRate', label: 'SR', align: 'center' },
  { id: 'average', label: 'Avg', align: 'center' },
  { id: 'fifties', label: '50s', align: 'center' },
  { id: 'centuries', label: '100s', align: 'center' },
];

export const BOWLING_TABLE_COLUMNS = [
  { id: 'player', label: 'Player', align: 'left' },
  { id: 'matches', label: 'M', align: 'center' },
  { id: 'overs', label: 'O', align: 'center' },
  { id: 'wickets', label: 'W', align: 'center' },
  { id: 'economy', label: 'Econ', align: 'center' },
  { id: 'average', label: 'Avg', align: 'center' },
  { id: 'bestFigures', label: 'Best', align: 'center' },
];

export const FIELDING_TABLE_COLUMNS = [
  { id: 'player', label: 'Player', align: 'left' },
  { id: 'catches', label: 'Catches', align: 'center' },
  { id: 'stumpings', label: 'Stumpings', align: 'center' },
];

export const STATS_TABS = [
  { id: 'tournament', label: 'Tournament' },
  { id: 'career', label: 'Career' },
];

export const TEAM_DETAIL_TABS = [
  { id: 'overview', label: 'Squad Overview' },
  { id: 'players', label: 'Player Details' },
  { id: 'stats', label: 'Player Stats' },
];

export const ROLE_BADGE_COLORS = {
  captain: "bg-amber-100 text-amber-800",
  batsman: "bg-teal-100 text-teal-800",
  bowler: "bg-sky-100 text-sky-800",
  allRounder: "bg-purple-100 text-purple-800",
  wicketKeeper: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800"
};

export const STATUS_BADGE_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-amber-100 text-amber-800", 
  injured: "bg-amber-100 text-amber-800",
  disbanded: "bg-red-100 text-red-800",
  retired: "bg-red-100 text-red-800",
  default: "bg-blue-100 text-blue-800"
};

// Format constants
export const STAT_FORMATTERS = {
  decimals: (value: number, places: number = 2) => value?.toFixed(places) || '0',
  placeholder: (value: any, fallback: any = '0') => value || fallback
};

// Icon colors
export const ICON_COLORS = {
  batting: 'text-blue-600',
  bowling: 'text-green-600',
  fielding: 'text-purple-600'
};

// Stats display configuration
export const STATS_CONFIG = {
  batting: {
    icon: 'TrendingUp',
    title: 'Batting Stats',
    color: ICON_COLORS.batting,
    columns: BATTING_TABLE_COLUMNS,
    playerFilter: (player: any) => player.originalRole !== "bowler",
    playerSort: (a: any, b: any, statView: string) => {
      const statsA = statView === 'tournament' ? a.tournamentStats : a.globalStats;
      const statsB = statView === 'tournament' ? b.tournamentStats : b.globalStats;
      return (statsB?.batting.runs || 0) - (statsA?.batting.runs || 0);
    }
  },
  bowling: {
    icon: 'Target',
    title: 'Bowling Stats',
    color: ICON_COLORS.bowling,
    columns: BOWLING_TABLE_COLUMNS,
    playerFilter: (player: any) => player.originalRole.includes("bowler") || player.originalRole.includes("all-rounder"),
    playerSort: (a: any, b: any, statView: string) => {
      const statsA = statView === 'tournament' ? a.tournamentStats : a.globalStats;
      const statsB = statView === 'tournament' ? b.tournamentStats : b.globalStats;
      return (statsB?.bowling.wickets || 0) - (statsA?.bowling.wickets || 0);
    }
  },
  fielding: {
    icon: 'Award',
    title: 'Fielding Stats',
    color: ICON_COLORS.fielding,
    columns: FIELDING_TABLE_COLUMNS,
    playerFilter: (player: any, statView: string) => {
      const stats = statView === 'tournament' ? player.tournamentStats : player.globalStats;
      return (stats?.fielding.catches || 0) + (stats?.fielding.stumpings || 0) > 0;
    },
    playerSort: (a: any, b: any, statView: string) => {
      const statsA = statView === 'tournament' ? a.tournamentStats : a.globalStats;
      const statsB = statView === 'tournament' ? b.tournamentStats : b.globalStats;
      const fieldingScoreA = (statsA?.fielding.catches || 0) + (statsA?.fielding.stumpings || 0);
      const fieldingScoreB = (statsB?.fielding.catches || 0) + (statsB?.fielding.stumpings || 0);
      return fieldingScoreB - fieldingScoreA;
    }
  }
};

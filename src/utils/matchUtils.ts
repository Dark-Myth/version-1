import { Match, MatchStatusInfo } from "@/types/match";

// Calculate match status information
export const getMatchStatusInfo = (match: Match): MatchStatusInfo | null => {
  if (!match.innings || match.innings.length === 0) {
    return null;
  }
  
  // Sort innings by inning number
  const sortedInnings = [...match.innings].sort((a, b) => a.inningNumber - b.inningNumber);
  
  if (match.status === "ongoing") {
    // Find the current innings (usually the last one)
    const currentInnings = sortedInnings[sortedInnings.length - 1];
    const battingTeam = currentInnings.battingTeam;
    const bowlingTeam = currentInnings.bowlingTeam;
    
    // Calculate current score
    const runs = currentInnings.totalRuns;
    const wickets = currentInnings.wickets;
    const oversDecimal = currentInnings.totalOvers ? 
      Math.floor(currentInnings.totalOvers) + (currentInnings.ballsBowled % 6) / 10 : 
      Math.floor(currentInnings.ballsBowled / 6) + (currentInnings.ballsBowled % 6) / 10;
    
    // If it's second innings, calculate target
    if (sortedInnings.length > 1) {
      const firstInnings = sortedInnings[0];
      const target = firstInnings.totalRuns + 1;
      const runsNeeded = target - runs;
      const ballsRemaining = (match.overs * 6) - currentInnings.ballsBowled;
      
      if (runsNeeded <= 0) {
        return {
          status: `${battingTeam.teamName} won by ${10 - wickets} wickets`,
          battingTeam,
          score: `${runs}/${wickets}`,
          overs: oversDecimal.toFixed(1),
          bowlingTeam,
        };
      }
      
      return {
        status: `${battingTeam.teamName} needs ${runsNeeded} runs in ${ballsRemaining} balls`,
        battingTeam,
        score: `${runs}/${wickets}`,
        overs: oversDecimal.toFixed(1),
        bowlingTeam,
        target,
        runsNeeded,
        ballsRemaining,
      };
    }
    
    return {
      status: "1st Innings in progress",
      battingTeam,
      score: `${runs}/${wickets}`,
      overs: oversDecimal.toFixed(1),
      bowlingTeam,
    };
  } else if (match.status === "completed" && match.winningTeam) {
    // For completed matches, return the winner
    const lastInnings = sortedInnings[sortedInnings.length - 1];
    const result = match.winningTeam._id === match.team1._id ? 
      `${match.team1.teamName} won` :
      `${match.team2.teamName} won`;
    
    return {
      status: result,
      firstInningsScore: sortedInnings[0] ? `${sortedInnings[0].totalRuns}/${sortedInnings[0].wickets}` : "",
      secondInningsScore: sortedInnings[1] ? `${sortedInnings[1].totalRuns}/${sortedInnings[1].wickets}` : "",
    };
  }
  
  return null;
};

// Filter matches by view (upcoming or past)
export const filterMatchesByView = (matches: Match[], view: "upcoming" | "past"): Match[] => {
  const currentDate = new Date();
  
  if (view === "upcoming") {
    return matches.filter(match => {
      const matchDate = new Date(`${match.date}T${match.time}`);
      return matchDate >= currentDate || match.status === "ongoing" || match.status === "scheduled";
    });
  } else {
    return matches.filter(match => {
      const matchDate = new Date(`${match.date}T${match.time}`);
      return matchDate < currentDate && match.status === "completed";
    });
  }
};

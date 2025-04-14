import React from 'react';

interface Ball {
  ball_number: number;
  runs: number;
  wicket: {
    fallen: boolean;
    wicketType?: string;
  };
  extras?: {
    wides?: number;
    no_balls?: number;
    byes?: number;
    leg_byes?: number;
  };
}

interface Over {
  over_number: number;
  balls: Ball[];
  bowler: any;
}

interface BallDisplayProps {
  overs: Over[];
  currentOver: number;
  currentBall: number;
  showInProgress?: boolean;
}

const BallDisplay: React.FC<BallDisplayProps> = ({ 
  overs, 
  currentOver, 
  currentBall,
  showInProgress = true 
}) => {
  if (!overs || overs.length === 0) {
    return <div className="text-gray-500 text-sm">No balls bowled yet</div>;
  }

  // Sort overs in descending order and take the last 3
  const recentOvers = [...overs]
    .sort((a, b) => b.over_number - a.over_number)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {recentOvers.map((over) => {
        if (!over.balls || over.balls.length === 0) return null;
        
        return (
          <div key={over.over_number} className="border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm">Over {over.over_number}</h4>
              <div className="text-xs text-gray-500">
                {over.bowler?.playerName || "Unknown bowler"}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {over.balls.map((ball, index) => {
                let displayText = String(ball.runs);
                let bgClass = "bg-gray-100 text-gray-800";
                
                // Handle wicket
                if (ball.wicket?.fallen) {
                  displayText = "W";
                  bgClass = "bg-red-100 text-red-800 border border-red-300";
                }
                // Handle extras
                else if (ball.extras) {
                  if (ball.extras.wides) {
                    displayText = `${ball.extras.wides}WD`;
                    bgClass = "bg-yellow-100 text-yellow-800 border border-yellow-300";
                  } else if (ball.extras.no_balls) {
                    displayText = "NB";
                    bgClass = "bg-yellow-100 text-yellow-800 border border-yellow-300";
                  } else if (ball.extras.byes) {
                    displayText = `${ball.extras.byes}B`;
                    bgClass = "bg-blue-100 text-blue-800 border border-blue-300";
                  } else if (ball.extras.leg_byes) {
                    displayText = `${ball.extras.leg_byes}LB`;
                    bgClass = "bg-blue-100 text-blue-800 border border-blue-300";
                  }
                }
                // Handle boundaries
                else if (ball.runs === 4) {
                  bgClass = "bg-green-100 text-green-800 border border-green-300";
                }
                else if (ball.runs === 6) {
                  bgClass = "bg-purple-100 text-purple-800 border border-purple-300 font-bold";
                }

                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${bgClass}`}
                  >
                    {displayText}
                  </div>
                );
              })}
            </div>
            
            {/* Show valid balls count */}
            <div className="mt-2 text-xs text-gray-500">
              {over.balls.filter(ball => 
                !(ball.extras?.wides || ball.extras?.no_balls)
              ).length} valid balls
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BallDisplay;

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar } from "lucide-react";

interface MatchesHeaderProps {
  selectedYear: string;
}

const MatchesHeader = ({ selectedYear }: MatchesHeaderProps) => {
  return (
    <CardHeader className="border-b bg-white py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-gray-700" />
          <CardTitle className="text-xl font-medium text-gray-800">
            Matches
          </CardTitle>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          {selectedYear}
        </div>
      </div>
    </CardHeader>
  );
};

export default MatchesHeader;

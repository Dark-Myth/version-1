import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Tournament {
  _id: string;
  tournamentName: string;
}

interface MatchesFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedTournament: string;
  setSelectedTournament: (tournamentId: string) => void;
  years: number[];
  filteredTournaments: Tournament[];
}

const MatchesFilter = ({
  searchQuery,
  setSearchQuery,
  selectedYear,
  setSelectedYear,
  selectedTournament,
  setSelectedTournament,
  years,
  filteredTournaments
}: MatchesFilterProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Search Matches</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by team or venue..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Year Selector */}
      <div className="flex-1 space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Year</label>
        <Select
          value={selectedYear}
          onValueChange={(value) => setSelectedYear(value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Tournament Selector */}
      <div className="flex-1 space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Tournament</label>
        <Select
          value={selectedTournament}
          onValueChange={(value) => setSelectedTournament(value)}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select Tournament" />
          </SelectTrigger>
          <SelectContent>
            {filteredTournaments.map((tournament) => (
              <SelectItem key={tournament._id} value={tournament._id}>
                {tournament.tournamentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default MatchesFilter;

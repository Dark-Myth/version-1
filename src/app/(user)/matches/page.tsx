"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, Search, Trophy, Clock, MapPin, Shield, 
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Match {
  _id: string;
  tournament_id: {
    _id: string;
    tournamentName: string;
  };
  team1: {
    _id: string;
    teamName: string;
    shortCode?: string;
  };
  team2: {
    _id: string;
    teamName: string;
    shortCode?: string;
  };
  date: string;
  time: string;
  venue: string;
  status: string;
  winningTeam?: {
    _id: string;
    teamName: string;
  };
  match_type: string;
  match_format: string;
  overs?: number;
}

interface Tournament {
  _id: string;
  tournamentName: string;
  startDate: string;
}

const MATCH_STATUS = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  ongoing: { label: "Ongoing", color: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" }
};

const MATCH_TYPES = [
  { value: "all", label: "All Types" },
  { value: "inter-house", label: "Inter-House" },
  { value: "inter-college", label: "Inter-College" },
  { value: "cricket-club", label: "Cricket Club" }
];

const MATCH_FORMATS = [
  { value: "all", label: "All Formats" },
  { value: "T10", label: "T10" },
  { value: "T20", label: "T20" },
  { value: "ODI", label: "ODI" },
  { value: "Test", label: "Test" }
];

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("upcoming");

  // Fetch tournaments on component mount
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tournaments");
        const data = await response.json();

        // Sort tournaments by start date (newest first)
        const sortedTournaments = [...data].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        setTournaments(sortedTournaments);

        // Set the default year to the year of the latest tournament
        if (sortedTournaments.length > 0) {
          const latestYear = new Date(sortedTournaments[0].startDate)
            .getFullYear()
            .toString();
          setSelectedYear(latestYear);
        }
      } catch (error) {
        toast.error(`Failed to fetch tournaments: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Fetch matches when filters change
  useEffect(() => {
    if (!selectedYear) return;
    
    const fetchMatches = async () => {
      try {
        setLoading(true);
        let url = '/api/matches?';
        
        if (selectedTournament && selectedTournament !== 'all') {
          url += `tournamentId=${selectedTournament}`;
        } else if (selectedYear) {
          url += `year=${selectedYear}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        setMatches(data);
        applyFilters(data);
      } catch (error) {
        toast.error(`Failed to fetch matches: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [selectedYear, selectedTournament]);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters(matches);
  }, [selectedType, selectedFormat, searchQuery, activeTab, matches]);

  // Function to apply all filters
  const applyFilters = (matchesData: Match[]) => {
    if (!matchesData.length) {
      setFilteredMatches([]);
      return;
    }

    let filtered = [...matchesData];

    // Filter by match type
    if (selectedType !== 'all') {
      filtered = filtered.filter(match => match.match_type === selectedType);
    }

    // Filter by match format
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(match => match.match_format === selectedFormat);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        match => match.team1.teamName.toLowerCase().includes(query) || 
                match.team2.teamName.toLowerCase().includes(query) ||
                match.venue.toLowerCase().includes(query)
      );
    }

    // Filter by tab (match status)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(match => 
          match.status === 'scheduled' && new Date(match.date) >= today
        );
        // Sort by upcoming date (closest first)
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'live':
        filtered = filtered.filter(match => match.status === 'ongoing');
        break;
      case 'completed':
        filtered = filtered.filter(match => match.status === 'completed');
        // Sort by most recent date
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'all':
      default:
        // Sort by date (upcoming first, then live, then recent)
        filtered.sort((a, b) => {
          if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
          if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
          if (a.status === 'scheduled' && b.status === 'scheduled') {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }

    setFilteredMatches(filtered);
  };

  // Extract unique years from tournaments
  const years = [
    ...new Set(
      tournaments.map((tournament) =>
        new Date(tournament.startDate).getFullYear().toString()
      )
    ),
  ].sort((a, b) => parseInt(b) - parseInt(a));

  // Filter tournaments by year
  const filteredTournaments = tournaments.filter(
    (tournament) =>
      new Date(tournament.startDate).getFullYear().toString() === selectedYear
  );

  // Format match date for display
  const formatMatchDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Format match time for display
  const formatMatchTime = (timeString: string) => {
    // If time is already in a readable format, just return it
    if (timeString.includes(':') && (timeString.includes('AM') || timeString.includes('PM'))) {
      return timeString;
    }
    
    // Otherwise, try to parse it
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const isPM = hour >= 12;
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${isPM ? 'PM' : 'AM'}`;
    } catch (e) {
      return timeString; // Return as is if parsing fails
    }
  };

  // Get match format display text
  const getMatchFormatDisplay = (format: string, overs?: number) => {
    if (format === 'Test') return 'Test Match';
    return `${format} (${overs} overs)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center mx-auto mt-[6%] p-auto px-auto flex-1 bg-white my-auto max-sm:mt-[1%] lg:mx-[5%]"
    >
      <Card className="w-full max-w-7xl shadow-sm border-gray-200 m-auto max-sm:mt-[15%] mb-auto">
        <CardHeader className="border-b bg-white py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-700" />
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
        
        <CardContent className="pt-5">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:gap-4 mb-6">
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
            <div className="md:w-[120px] space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Year</label>
              <Select
                value={selectedYear}
                onValueChange={(value) => setSelectedYear(value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Tournament Selector */}
            <div className="md:w-[220px] space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Tournament</label>
              <Select
                value={selectedTournament}
                onValueChange={(value) => setSelectedTournament(value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Tournaments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tournaments</SelectItem>
                  {filteredTournaments.map((tournament) => (
                    <SelectItem key={tournament._id} value={tournament._id}>
                      {tournament.tournamentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Secondary filters row */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Match Type Selector */}
            <div className="md:w-[180px] space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Match Type</label>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Match Format Selector */}
            <div className="md:w-[180px] space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Format</label>
              <Select
                value={selectedFormat}
                onValueChange={(value) => setSelectedFormat(value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Stats counter */}
            <div className="flex-1 flex items-end pb-2 justify-end">
              <span className="text-sm text-gray-500">
                {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} found
              </span>
            </div>
          </div>
          
          {/* Tabs for different match statuses */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-5">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/5" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-1/3" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMatches.map((match, index) => (
                  <motion.div
                    key={match._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/matches/${match._id}`} className="block">
                      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 
                        ${match.status === 'ongoing' ? 'border-l-amber-500' : 
                          match.status === 'completed' ? 'border-l-green-500' : 'border-l-blue-500'}"
                      >
                        <div className="p-4">
                          {/* Match header */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center space-x-2">
                              <Trophy className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 font-medium">
                                {match.tournament_id.tournamentName}
                              </span>
                            </div>
                            <Badge className={MATCH_STATUS[match.status as keyof typeof MATCH_STATUS].color}>
                              {MATCH_STATUS[match.status as keyof typeof MATCH_STATUS].label}
                            </Badge>
                          </div>
                          
                          {/* Teams */}
                          <div className="flex justify-between items-center py-3 border-y">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{match.team1.teamName}</span>
                              <span className="text-sm text-gray-500">{match.team1.shortCode || "TBD"}</span>
                            </div>
                            <span className="text-lg font-bold text-gray-400">VS</span>
                            <div className="flex flex-col items-end">
                              <span className="font-medium">{match.team2.teamName}</span>
                              <span className="text-sm text-gray-500">{match.team2.shortCode || "TBD"}</span>
                            </div>
                          </div>
                          
                          {/* Match details */}
                          <div className="flex justify-between pt-3">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatMatchDate(match.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatMatchTime(match.time)}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between mt-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{match.venue}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Shield className="h-3.5 w-3.5" />
                              <span>{getMatchFormatDisplay(match.match_format, match.overs)}</span>
                            </div>
                          </div>
                          
                          {/* Winner for completed matches */}
                          {match.status === 'completed' && match.winningTeam && (
                            <div className="mt-3 pt-2 border-t flex justify-between items-center">
                              <div className="flex items-center space-x-1.5">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Winner: {match.winningTeam.teamName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded bg-gray-50">
                <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No matches found</p>
                <p className="text-gray-400 text-sm mt-1">Try changing your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Matches;
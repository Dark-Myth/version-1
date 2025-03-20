"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface Team {
  _id: string;
  teamName: string;
  shortCode: string;
  captain: string;
  playerCount: number;
  status: string;
  tournament?: string;
  coach?: string;
}

interface Tournament {
  _id: string;
  tournamentName: string;
  startDate: string;
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

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

          // Set the default tournament to the latest tournament
          setSelectedTournament(sortedTournaments[0]._id);
        }
      } catch (error) {
        toast.error(`Failed to fetch tournaments: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Filter tournaments by year when selectedYear changes
  useEffect(() => {
    if (!selectedYear || !tournaments.length) return;

    const tournamentsForYear = tournaments.filter(
      (tournament) =>
        new Date(tournament.startDate).getFullYear().toString() === selectedYear
    );

    setFilteredTournaments(tournamentsForYear);

    // If no tournament is selected yet or the selected tournament is not in this year
    // select the first tournament of the year
    const tournamentExists = tournamentsForYear.some(
      (t) => t._id === selectedTournament
    );
    if (!tournamentExists && tournamentsForYear.length > 0) {
      setSelectedTournament(tournamentsForYear[0]._id);
    }
  }, [selectedYear, tournaments, selectedTournament]);

  // Fetch teams when tournament selection changes
  useEffect(() => {
    if (!selectedTournament) return;

    const fetchTeamsForTournament = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams?tournamentId=${selectedTournament}`);
        const data = await response.json();
        setTeams(data);
        setFilteredTeams(data);
      } catch (error) {
        toast.error(`Failed to fetch teams: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsForTournament();
  }, [selectedTournament]);

  // Filter teams by search query
  useEffect(() => {
    if (!teams.length) return;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = teams.filter(
        team => team.teamName.toLowerCase().includes(query) || 
               (team.shortCode && team.shortCode.toLowerCase().includes(query))
      );
      setFilteredTeams(filtered);
    } else {
      setFilteredTeams(teams);
    }
  }, [searchQuery, teams]);

  // Extract unique years from tournaments
  const years = [
    ...new Set(
      tournaments.map((tournament) =>
        new Date(tournament.startDate).getFullYear()
      )
    ),
  ];

  // Get the current tournament name
  const currentTournament = filteredTournaments.find(
    (t) => t._id === selectedTournament
  );
  const tournamentName = currentTournament?.tournamentName || "Tournament";

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'disbanded': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
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
              <Users className="h-5 w-5 text-gray-700" />
              <CardTitle className="text-xl font-medium text-gray-800">
                Teams
              </CardTitle>
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {selectedYear}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name or code..."
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

          <div className="mt-5">
            <h3 className="text-md font-medium text-gray-800 mb-3">
              {tournamentName} Teams
            </h3>
          
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6,7,8].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 space-y-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredTeams.map((team, index) => (
                  <motion.div
                    key={`team-${team._id || index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <Link href={`/teams/team-details/${team._id}?tournament_id=${selectedTournament}`}>
                      <div className="flex items-start p-4">
                        <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                          <Shield className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800 text-lg">{team.teamName}</h3>
                          <p className="text-sm text-gray-500">{team.shortCode}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 px-4 py-3 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-600">
                            Captain: <span className="font-medium">{team.captain}</span>
                          </div>
                          
                          <Badge 
                            className={`text-xs ${getStatusColor(team.status)}`}
                          >
                            {team.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Players: {team.playerCount}
                          {team.coach && ` • Coach: ${team.coach}`}
                        </div>
                      </div>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded bg-gray-50">
                <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No teams found for this tournament</p>
                <p className="text-gray-400 text-sm mt-1">Try selecting a different tournament or year</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Teams;
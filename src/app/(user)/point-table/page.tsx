"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar } from "lucide-react";
import { tableHeaders, legends } from "@/constants/pointstable";

interface Tournament {
  _id: string;
  tournamentName: string;
  startDate: string;
}

interface TeamPoints {
  team_id: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  points: number;
  netRunRate: number;
}

const PointsTable = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [pointsTable, setPointsTable] = useState<TeamPoints[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(
    []
  );
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
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
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
  }, [selectedTournament, selectedYear, tournaments]);

  // Fetch points table when a tournament is selected
  useEffect(() => {
    if (!selectedTournament) return;

    const fetchPointsTable = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/pointsTable?tournamentId=${selectedTournament}`
        );
        const data = await response.json();
        setPointsTable(data);
      } catch (error) {
        toast.error(`Failed to fetch points table": ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPointsTable();
  }, [selectedTournament]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center m-auto mt-[6%]  p-auto flex-1 bg-white my-auto max-sm:mt-[1%]  "
    >
      <Card className="w-full max-w-4xl shadow-sm border-gray-200 m-auto max-sm:mt-[15%] mb-auto ">
        <CardHeader className="border-b bg-white py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-gray-700" />
              <CardTitle className="text-xl font-medium text-gray-800">
                Points Table
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
              <label className="text-sm font-medium text-gray-700">
                Tournament
              </label>
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
              {tournamentName} Standings
            </h3>

            {loading ? (
              <div className="flex justify-center my-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></div>
              </div>
            ) : pointsTable.length > 0 ? (
              <div className="overflow-x-auto rounded border border-gray-200">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      {tableHeaders.map((header) => (
                        <TableHead
                          key={header.id}
                          className={`${
                            header.align === "center" ? "text-center" : ""
                          } ${header.width} font-medium text-gray-700`}
                        >
                          {header.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                    <TableBody>
                    {pointsTable.map((team, index) => (
                      <motion.tr
                      key={`team-${index || team.team_id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50 border-t border-gray-100 .hide-scrollbar"
                      >
                      <TableCell className="text-center font-medium text-gray-500">
                      {index + 1}
                      </TableCell>
                      <TableCell>{team.teamName}</TableCell>
                      <TableCell className="text-center">
                      {team.matchesPlayed}
                      </TableCell>
                      <TableCell className="text-center">
                      {team.matchesWon}
                      </TableCell>
                      <TableCell className="text-center">
                      {team.matchesLost}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                      {team.points}
                      </TableCell>
                      <TableCell className="text-center">
                      {parseFloat(team.netRunRate.toString()).toFixed(2)}
                      </TableCell>
                      </motion.tr>
                    ))}
                    </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded bg-gray-50">
                <p className="text-gray-500">No data available</p>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p>
                {Object.entries(legends).map(([abbr, full], index, array) => (
                  <span key={abbr}>
                    {abbr} : {full}
                    {index < array.length - 1 ? " | "  : " "}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PointsTable;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, AlertCircle } from "lucide-react";
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  age: number;
}

interface PlayerAssignmentProps {
  teamId: string;
  tournamentId: string;
}

const PlayerAssignment: React.FC<PlayerAssignmentProps> = ({ teamId, tournamentId }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addPlayerDialog, setAddPlayerDialog] = useState(false);
  const [playerRole, setPlayerRole] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [assignmentCheck, setAssignmentCheck] = useState<{
    isRegistered: boolean;
    team?: {
      _id: string;
      teamName: string;
    }
  } | null>(null);
  
  useEffect(() => {
    if (teamId && tournamentId) {
      fetchTeamPlayers();
    }
  }, [teamId, tournamentId]);
  
  const fetchTeamPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/management/teams/${teamId}/players`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch team players");
      }
      
      const data = await response.json();
      setTeamPlayers(data);
    } catch (error) {
      console.error("Error fetching team players:", error);
      toast.error("Failed to load team players");
    } finally {
      setLoading(false);
    }
  };
  
  const searchPlayers = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/management/players/search?query=${searchQuery}`);
      
      if (!response.ok) {
        throw new Error("Failed to search players");
      }
      
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error searching players:", error);
      toast.error("Failed to search players");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlayerClick = async (player: Player) => {
    setSelectedPlayer(player);
    
    try {
      const response = await fetch(`/api/management/players/check-assignment?playerId=${player.id}&tournamentId=${tournamentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to check player assignment");
      }
      
      const data = await response.json();
      setAssignmentCheck(data);
      setAddPlayerDialog(true);
    } catch (error) {
      console.error("Error checking player assignment:", error);
      toast.error("Failed to check player status");
    }
  };
  
  const handleAddPlayer = async () => {
    if (!selectedPlayer || !playerRole) return;
    
    try {
      const response = await fetch(`/api/management/teams/${teamId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          role: playerRole,
          tournamentId: tournamentId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add player to team");
      }
      
      toast.success(`${selectedPlayer.name} added to team successfully`);
      setAddPlayerDialog(false);
      setSelectedPlayer(null);
      setPlayerRole('');
      fetchTeamPlayers();
    } catch (error) {
      console.error("Error adding player:", error);
      toast.error(error.message || "Failed to add player to team");
    }
  };
  
  const handleRemovePlayer = async (playerId: string) => {
    try {
      const response = await fetch(`/api/management/teams/${teamId}/players/${playerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove player from team");
      }
      
      toast.success("Player removed from team successfully");
      fetchTeamPlayers();
    } catch (error) {
      console.error("Error removing player:", error);
      toast.error(error.message || "Failed to remove player from team");
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Players to Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search players by name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPlayers()}
              />
            </div>
            <Button onClick={searchPlayers}>Search</Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
            </div>
          ) : (
            <>
              {players.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Batting</TableHead>
                      <TableHead>Bowling</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.role}</TableCell>
                        <TableCell>{player.battingStyle}</TableCell>
                        <TableCell>{player.bowlingStyle || "N/A"}</TableCell>
                        <TableCell>{player.age}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handlePlayerClick(player)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : searchQuery ? (
                <div className="text-center py-8 text-gray-500">
                  No players found matching your search
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Search for players to add to your team
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Players</CardTitle>
        </CardHeader>
        <CardContent>
          {teamPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No players assigned to this team yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Batting</TableHead>
                  <TableHead>Bowling</TableHead>
                  <TableHead>Team Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.role}</TableCell>
                    <TableCell>{player.battingStyle}</TableCell>
                    <TableCell>{player.bowlingStyle || "N/A"}</TableCell>
                    <TableCell>
                      {player.teamRole && (
                        <Badge variant="outline">{player.teamRole}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemovePlayer(player.id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={addPlayerDialog} onOpenChange={setAddPlayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player to Team</DialogTitle>
            <DialogDescription>
              Assign {selectedPlayer?.name} to your team
            </DialogDescription>
          </DialogHeader>
          
          {assignmentCheck?.isRegistered && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 mb-4 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Player already assigned</p>
                <p className="text-sm">
                  This player is already part of team "{assignmentCheck.team?.teamName}" in this tournament.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Name</p>
                <p>{selectedPlayer?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Role</p>
                <p>{selectedPlayer?.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Batting Style</p>
                <p>{selectedPlayer?.battingStyle}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Bowling Style</p>
                <p>{selectedPlayer?.bowlingStyle || "N/A"}</p>
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Team Role</p>
              <Select value={playerRole} onValueChange={setPlayerRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player's role in team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Regular Player</SelectItem>
                  <SelectItem value="captain">Captain</SelectItem>
                  <SelectItem value="viceCaptain">Vice Captain</SelectItem>
                  <SelectItem value="wicketKeeper">Wicket Keeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddPlayerDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddPlayer}
              disabled={!playerRole || assignmentCheck?.isRegistered}
            >
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerAssignment;

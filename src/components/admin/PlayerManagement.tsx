import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
   UserPlus, Search, Edit, Trash2, Download, 
  Filter, ArrowUpDown, 
   Eye
} from "lucide-react";


interface Player {
  id: string;
  name: string;
  team: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  matches: number;
  runs: number;
  wickets: number;
  status: 'active' | 'injured' | 'inactive';
  image?: string;
}

interface PlayerManagementProps {
  adminId: string;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ adminId }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  useEffect(() => {
    fetchPlayers();
  }, [adminId]);
  
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockPlayers: Player[] = [
          {
            id: '1',
            name: 'Virat Kohli',
            team: 'Royal Challengers',
            role: 'Batsman',
            battingStyle: 'Right-handed',
            bowlingStyle: 'Right-arm medium',
            matches: 42,
            runs: 1850,
            wickets: 4,
            status: 'active',
            image: 'https://placehold.co/100x100?text=VK'
          },
          {
            id: '2',
            name: 'Rohit Sharma',
            team: 'Mumbai Indians',
            role: 'Batsman',
            battingStyle: 'Right-handed',
            bowlingStyle: 'Right-arm off break',
            matches: 38,
            runs: 1500,
            wickets: 0,
            status: 'active',
            image: 'https://placehold.co/100x100?text=RS'
          },
          {
            id: '3',
            name: 'Jasprit Bumrah',
            team: 'Mumbai Indians',
            role: 'Bowler',
            battingStyle: 'Right-handed',
            bowlingStyle: 'Right-arm fast',
            matches: 35,
            runs: 45,
            wickets: 62,
            status: 'active',
            image: 'https://placehold.co/100x100?text=JB'
          },
          {
            id: '4',
            name: 'Ben Stokes',
            team: 'Rising Stars',
            role: 'All-rounder',
            battingStyle: 'Left-handed',
            bowlingStyle: 'Right-arm fast-medium',
            matches: 30,
            runs: 950,
            wickets: 28,
            status: 'injured',
            image: 'https://placehold.co/100x100?text=BS'
          },
          {
            id: '5',
            name: 'Kane Williamson',
            team: 'Sunrisers',
            role: 'Batsman',
            battingStyle: 'Right-handed',
            bowlingStyle: 'Right-arm off break',
            matches: 32,
            runs: 1220,
            wickets: 0,
            status: 'active',
            image: 'https://placehold.co/100x100?text=KW'
          },
          {
            id: '6',
            name: 'Jos Buttler',
            team: 'Royals',
            role: 'Wicket-keeper',
            battingStyle: 'Right-handed',
            bowlingStyle: '-',
            matches: 28,
            runs: 1100,
            wickets: 0,
            status: 'active',
            image: 'https://placehold.co/100x100?text=JB'
          },
          {
            id: '7',
            name: 'David Warner',
            team: 'Sunrisers',
            role: 'Batsman',
            battingStyle: 'Left-handed',
            bowlingStyle: 'Right-arm leg break',
            matches: 40,
            runs: 1780,
            wickets: 0,
            status: 'inactive',
            image: 'https://placehold.co/100x100?text=DW'
          },
          {
            id: '8',
            name: 'Kagiso Rabada',
            team: 'Kings',
            role: 'Bowler',
            battingStyle: 'Left-handed',
            bowlingStyle: 'Right-arm fast',
            matches: 25,
            runs: 30,
            wickets: 48,
            status: 'active',
            image: 'https://placehold.co/100x100?text=KR'
          }
        ];
        
        setPlayers(mockPlayers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching players:", error);
      setLoading(false);
    }
  };
  
  const handleOpenEditDialog = (player: Player) => {
    setCurrentPlayer(player);
    setOpenDialog(true);
  };
  
  const handleCreatePlayer = () => {
    setCurrentPlayer(null);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPlayer(null);
  };
  
  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving player:", currentPlayer);
    setOpenDialog(false);
    // In a real application, you would make an API call here
  };
  
  const handleDeletePlayer = (id: string) => {
    console.log("Deleting player with ID:", id);
    // Implement confirmation dialog and API call
  };
  
  const filterPlayers = () => {
    let filtered = [...players];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(player => player.status === activeTab);
    }
    
    // Filter by team
    if (teamFilter !== 'all') {
      filtered = filtered.filter(player => player.team === teamFilter);
    }
    
    return filtered;
  };
  
  // Get unique teams for the filter dropdown
  const getTeams = () => {
    const teams = new Set(players.map(player => player.team));
    return ['all', ...Array.from(teams)];
  };
  
  // Get status badge with appropriate color
  const getStatusBadge = (status: 'active' | 'injured' | 'inactive') => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'injured':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Injured</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  const filteredPlayers = filterPlayers();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Player Management</h2>
          <p className="text-gray-500">Manage players, assign teams, and track statistics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
            {viewMode === 'table' ? <Eye className="h-4 w-4 mr-2" /> : <Table className="h-4 w-4 mr-2" />}
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
          <Button variant="outline" onClick={() => console.log("Exporting players")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreatePlayer}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-auto flex-1">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="injured">Injured</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search players..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              {getTeams().map(team => (
                <SelectItem key={team} value={team}>
                  {team === 'all' ? 'All Teams' : team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Matches
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Runs
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Wickets
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {player.image && (
                            <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-100">
                              <img 
                                src={player.image} 
                                alt={player.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {player.name}
                        </div>
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell>{player.role}</TableCell>
                      <TableCell>{player.matches}</TableCell>
                      <TableCell>{player.runs}</TableCell>
                      <TableCell>{player.wickets}</TableCell>
                      <TableCell>{getStatusBadge(player.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(player)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlayer(player.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-gray-500">
              Showing {filteredPlayers.length} of {players.length} players
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No players found
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <Card key={player.id}>
                <CardHeader className="text-center pb-0">
                  <div className="mx-auto w-20 h-20 rounded-full overflow-hidden bg-gray-100 mb-3">
                    <img 
                      src={player.image || "https://placehold.co/100x100?text=Player"} 
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <CardDescription>{player.team}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 pb-0">
                  <div className="mb-3 flex justify-center">
                    {getStatusBadge(player.status)}
                  </div>
                  <div className="grid grid-cols-3 text-center gap-2 my-3">
                    <div>
                      <p className="text-xs text-gray-500">Matches</p>
                      <p className="font-medium">{player.matches}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Runs</p>
                      <p className="font-medium">{player.runs}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Wickets</p>
                      <p className="font-medium">{player.wickets}</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="flex justify-between my-1">
                      <span className="text-gray-500">Role:</span>
                      <span>{player.role}</span>
                    </p>
                    <p className="flex justify-between my-1">
                      <span className="text-gray-500">Batting:</span>
                      <span>{player.battingStyle}</span>
                    </p>
                    <p className="flex justify-between my-1">
                      <span className="text-gray-500">Bowling:</span>
                      <span>{player.bowlingStyle}</span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(player)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeletePlayer(player.id)}>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
      
      {/* Add/Edit Player Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentPlayer ? 'Edit Player' : 'Add New Player'}
            </DialogTitle>
            <DialogDescription>
              {currentPlayer 
                ? 'Edit player details and statistics' 
                : 'Fill in the details to add a new player'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSavePlayer}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Player Name</Label>
                  <Input id="name" defaultValue={currentPlayer?.name || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select defaultValue={currentPlayer?.team || ''}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Royal Challengers">Royal Challengers</SelectItem>
                      <SelectItem value="Mumbai Indians">Mumbai Indians</SelectItem>
                      <SelectItem value="Sunrisers">Sunrisers</SelectItem>
                      <SelectItem value="Rising Stars">Rising Stars</SelectItem>
                      <SelectItem value="Royals">Royals</SelectItem>
                      <SelectItem value="Kings">Kings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Player Role</Label>
                  <Select defaultValue={currentPlayer?.role || ''}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                      <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={currentPlayer?.status || 'active'}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="injured">Injured</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="battingStyle">Batting Style</Label>
                  <Select defaultValue={currentPlayer?.battingStyle || ''}>
                    <SelectTrigger id="battingStyle">
                      <SelectValue placeholder="Select batting style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Right-handed">Right-handed</SelectItem>
                      <SelectItem value="Left-handed">Left-handed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bowlingStyle">Bowling Style</Label>
                  <Select defaultValue={currentPlayer?.bowlingStyle || ''}>
                    <SelectTrigger id="bowlingStyle">
                      <SelectValue placeholder="Select bowling style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Right-arm fast">Right-arm fast</SelectItem>
                      <SelectItem value="Right-arm medium">Right-arm medium</SelectItem>
                      <SelectItem value="Right-arm off break">Right-arm off break</SelectItem>
                      <SelectItem value="Right-arm leg break">Right-arm leg break</SelectItem>
                      <SelectItem value="Left-arm fast">Left-arm fast</SelectItem>
                      <SelectItem value="Left-arm medium">Left-arm medium</SelectItem>
                      <SelectItem value="Left-arm orthodox">Left-arm orthodox</SelectItem>
                      <SelectItem value="-">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matches">Matches Played</Label>
                  <Input 
                    id="matches" 
                    type="number" 
                    min="0" 
                    defaultValue={currentPlayer?.matches.toString() || '0'} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="runs">Total Runs</Label>
                  <Input 
                    id="runs" 
                    type="number" 
                    min="0" 
                    defaultValue={currentPlayer?.runs.toString() || '0'} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wickets">Total Wickets</Label>
                  <Input 
                    id="wickets" 
                    type="number" 
                    min="0" 
                    defaultValue={currentPlayer?.wickets.toString() || '0'} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Player Image URL</Label>
                <Input 
                  id="image" 
                  type="url" 
                  placeholder="https://example.com/player-image.jpg" 
                  defaultValue={currentPlayer?.image || ''} 
                />
                <p className="text-xs text-gray-500">
                  Enter a URL for the player's profile image
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {currentPlayer ? 'Save Changes' : 'Add Player'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerManagement;
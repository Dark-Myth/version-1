import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Search, AlertCircle, User, Target, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface Player {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  status: string;
  stats: {
    matches: number;
    runs: number;
    wickets: number;
  };
}

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    playerName: '',
    role: '',
    battingStyle: '',
    bowlingStyle: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const itemsPerPage = 8;

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/management/players?search=${searchQuery}&status=${activeTab}`);
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [searchQuery, activeTab]);

  const resetForm = () => {
    setFormData({
      playerName: '',
      role: '',
      battingStyle: '',
      bowlingStyle: '',
      status: 'active',
    });
    setErrors({});
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setEditingPlayer(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      playerName: player.name,
      role: player.role,
      battingStyle: player.battingStyle === 'N/A' ? '' : player.battingStyle,
      bowlingStyle: player.bowlingStyle === 'N/A' ? '' : player.bowlingStyle,
      status: player.status,
    });
    setOpenDialog(true);
  };

  const handleOpenDeleteDialog = (player: Player) => {
    setPlayerToDelete(player);
    setOpenDeleteDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.playerName.trim()) {
      newErrors.playerName = 'Player name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (['batsman', 'all-rounder', 'wicket-keeper'].includes(formData.role) && !formData.battingStyle) {
      newErrors.battingStyle = 'Batting style is required';
    }

    if (['bowler', 'all-rounder'].includes(formData.role) && !formData.bowlingStyle) {
      newErrors.bowlingStyle = 'Bowling style is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let response;
      if (editingPlayer) {
        response = await fetch(`/api/management/players?id=${editingPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/management/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save player');
      }

      toast.success(editingPlayer ? 'Player updated successfully' : 'Player created successfully');
      setOpenDialog(false);
      fetchPlayers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save player');
      console.error(error);
    }
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      const response = await fetch(`/api/management/players?id=${playerToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete player');
      }

      toast.success('Player deleted successfully');
      setOpenDeleteDialog(false);
      setPlayerToDelete(null);
      fetchPlayers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete player');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>;
      case 'injured':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Injured</Badge>;
      case 'retired':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Retired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'batsman':
        return <Shield className="h-4 w-4 text-blue-500 mr-2" />;
      case 'bowler':
        return <Target className="h-4 w-4 text-red-500 mr-2" />;
      case 'all-rounder':
        return <User className="h-4 w-4 text-purple-500 mr-2" />;
      case 'wicket-keeper':
        return <User className="h-4 w-4 text-green-500 mr-2" />;
      default:
        return <User className="h-4 w-4 text-gray-500 mr-2" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const filterPlayers = () => {
    let filtered = [...players];
    return filtered;
  };

  const getCurrentPageItems = () => {
    const filtered = filterPlayers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  if (loading && players.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  const filteredPlayers = filterPlayers();
  const currentPageItems = getCurrentPageItems();
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Player Management</h2>
          <p className="text-gray-500">Create and manage cricket players</p>
        </div>
        <Button onClick={handleOpenCreateDialog} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          New Player
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="injured">Injured</TabsTrigger>
            <TabsTrigger value="retired">Retired</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search players..."
            className="pl-8 w-full md:w-auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center">
              <User className="h-4 w-4 text-blue-600 mr-2" />
              <CardTitle className="text-md font-medium text-gray-800">Players List</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageItems.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="text-xs bg-gray-100">
                              {getInitials(player.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getRoleIcon(player.role)}
                          <span className="capitalize">{player.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center">
                            <span className="w-16 text-gray-500">Batting:</span> 
                            <span>{player.battingStyle}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-16 text-gray-500">Bowling:</span> 
                            <span>{player.bowlingStyle}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm grid grid-cols-2 gap-x-4">
                          <div className="flex items-center">
                            <span className="w-16 text-gray-500">Matches:</span> 
                            <span className="font-medium">{player.stats.matches}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-12 text-gray-500">Runs:</span> 
                            <span className="font-medium">{player.stats.runs}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-16 text-gray-500">Wickets:</span> 
                            <span className="font-medium">{player.stats.wickets}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(player.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(player)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenDeleteDialog(player)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-gray-500">
              Showing {Math.min(currentPage * itemsPerPage, filteredPlayers.length)} of {filteredPlayers.length} players
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlayer ? 'Edit Player' : 'Create Player'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 ">
              <div>
              <Label htmlFor="playerName" className="mb-2 block">Player Name</Label>
              <Input
                id="playerName"
                name="playerName"
                value={formData.playerName}
                onChange={handleInputChange}
                placeholder="Enter player name"
              />
              {errors.playerName && <p className="text-red-500 text-sm">{errors.playerName}</p>}
              </div>
              <div>
              <Label htmlFor="role" className="mb-2 block">Role</Label>
              <Select
                name="role"
                value={formData.role}
                onValueChange={(value) => handleInputChange({ target: { name: 'role', value } })}
              >
                <SelectTrigger>
                <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="batsman">Batsman</SelectItem>
                <SelectItem value="bowler">Bowler</SelectItem>
                <SelectItem value="all-rounder">All-Rounder</SelectItem>
                <SelectItem value="wicket-keeper">Wicket-Keeper</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
              </div>
              <div>
              <Label htmlFor="battingStyle" className="mb-2 block">Batting Style</Label>
              <Input
                id="battingStyle"
                name="battingStyle"
                value={formData.battingStyle}
                onChange={handleInputChange}
                placeholder="Enter batting style"
              />
              {errors.battingStyle && <p className="text-red-500 text-sm">{errors.battingStyle}</p>}
              </div>
              <div>
              <Label htmlFor="bowlingStyle" className="mb-2 block">Bowling Style</Label>
              <Input
                id="bowlingStyle"
                name="bowlingStyle"
                value={formData.bowlingStyle}
                onChange={handleInputChange}
                placeholder="Enter bowling style"
              />
              {errors.bowlingStyle && <p className="text-red-500 text-sm">{errors.bowlingStyle}</p>}
              </div>
              <div>
              <Label htmlFor="status" className="mb-2 block">Status</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleInputChange({ target: { name: 'status', value } })}
              >
                <SelectTrigger>
                <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="injured">Injured</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingPlayer ? 'Update Player' : 'Create Player'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this player? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlayer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerManagement;
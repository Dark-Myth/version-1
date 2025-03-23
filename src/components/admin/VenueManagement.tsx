import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { 
   Plus, Edit, Trash2, Search,
  CalendarDays, Ruler, Upload, Map,
  Building
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Venue {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity: number;
  facilities: string[];
  status: 'available' | 'maintenance' | 'booked';
  pitchType: string;
  matchesHosted: number;
  image?: string;
}

interface VenueManagementProps {
  adminId: string;
}

const VenueManagement: React.FC<VenueManagementProps> = ({ adminId }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    fetchVenues();
  }, [adminId]);
  
  const fetchVenues = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      // const response = await fetch('/api/venues');
      // const data = await response.json();
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockVenues: Venue[] = [
          {
            id: '1',
            name: 'Main Cricket Stadium',
            city: 'Mumbai',
            address: '123 Stadium Road, Mumbai, 400001',
            capacity: 35000,
            facilities: ['Floodlights', 'Pavilion', 'Media Box', 'Practice Nets'],
            status: 'available',
            pitchType: 'Grass',
            matchesHosted: 120
          },
          {
            id: '2',
            name: 'City Sports Ground',
            city: 'Delhi',
            address: '456 Sports Avenue, Delhi, 110001',
            capacity: 25000,
            facilities: ['Floodlights', 'Pavilion', 'Scoreboard'],
            status: 'booked',
            pitchType: 'Clay',
            matchesHosted: 87
          },
          {
            id: '3',
            name: 'Regional Cricket Center',
            city: 'Bangalore',
            address: '789 Cricket Lane, Bangalore, 560001',
            capacity: 18000,
            facilities: ['Pavilion', 'Practice Nets', 'Gym'],
            status: 'available',
            pitchType: 'Grass',
            matchesHosted: 65
          },
          {
            id: '4',
            name: 'Cricket Training Complex',
            city: 'Chennai',
            address: '321 Training Road, Chennai, 600001',
            capacity: 12000,
            facilities: ['Practice Nets', 'Gym', 'Swimming Pool'],
            status: 'maintenance',
            pitchType: 'Synthetic',
            matchesHosted: 42
          },
          {
            id: '5',
            name: 'International Cricket Stadium',
            city: 'Kolkata',
            address: '555 International Avenue, Kolkata, 700001',
            capacity: 68000,
            facilities: ['Floodlights', 'Pavilion', 'Media Box', 'VIP Boxes', 'Restaurant'],
            status: 'available',
            pitchType: 'Grass',
            matchesHosted: 154
          }
        ];
        
        setVenues(mockVenues);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setLoading(false);
    }
  };
  
  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle venue creation/update logic
    console.log(selectedVenue ? "Updating venue" : "Creating new venue");
    setOpenDialog(false);
    setSelectedVenue(null);
  };
  
  const handleEditVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setOpenDialog(true);
  };
  
  const handleDeleteVenue = (id: string) => {
    // Handle venue deletion logic
    console.log(`Deleting venue ${id}`);
    setVenues(prevVenues => prevVenues.filter(venue => venue.id !== id));
  };
  
  const handleStatusChange = (id: string, newStatus: 'available' | 'maintenance' | 'booked') => {
    // Handle status change logic
    console.log(`Changing venue ${id} status to ${newStatus}`);
    setVenues(prevVenues => 
      prevVenues.map(venue => 
        venue.id === id 
          ? { ...venue, status: newStatus } 
          : venue
      )
    );
  };
  
  const filterVenues = () => {
    let filtered = [...venues];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status tab
    if (activeTab === 'available') {
      filtered = filtered.filter(venue => venue.status === 'available');
    } else if (activeTab === 'booked') {
      filtered = filtered.filter(venue => venue.status === 'booked');
    } else if (activeTab === 'maintenance') {
      filtered = filtered.filter(venue => venue.status === 'maintenance');
    }
    
    return filtered;
  };
  
  const getStatusBadge = (status: 'available' | 'maintenance' | 'booked') => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Maintenance</Badge>;
      case 'booked':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Booked</Badge>;
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
  
  const filteredVenues = filterVenues();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Venue Management</h2>
          <p className="text-gray-500">Manage cricket venues and stadiums</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedVenue ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
              <DialogDescription>
                {selectedVenue ? 'Update venue details' : 'Fill in the details to add a new cricket venue'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateVenue}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    defaultValue={selectedVenue?.name || ''}
                    placeholder="Venue name" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city" className="text-right">
                    City
                  </Label>
                  <Input 
                    id="city" 
                    className="col-span-3" 
                    defaultValue={selectedVenue?.city || ''}
                    placeholder="City" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Textarea 
                    id="address" 
                    className="col-span-3 min-h-[80px]" 
                    defaultValue={selectedVenue?.address || ''}
                    placeholder="Full address" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right">
                    Capacity
                  </Label>
                  <Input 
                    id="capacity" 
                    type="number" 
                    className="col-span-3" 
                    defaultValue={selectedVenue?.capacity || ''}
                    placeholder="Spectator capacity" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pitchType" className="text-right">
                    Pitch Type
                  </Label>
                  <Select defaultValue={selectedVenue?.pitchType || ''}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select pitch type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grass">Grass</SelectItem>
                      <SelectItem value="Clay">Clay</SelectItem>
                      <SelectItem value="Synthetic">Synthetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select defaultValue={selectedVenue?.status || 'available'}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="facilities" className="text-right">
                    Facilities
                  </Label>
                  <Input 
                    id="facilities" 
                    className="col-span-3" 
                    defaultValue={selectedVenue?.facilities.join(', ') || ''}
                    placeholder="Comma-separated list of facilities" 
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Venue Image
                  </Label>
                  <div className="col-span-3">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                        </div>
                        <input id="image" type="file" className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setOpenDialog(false);
                  setSelectedVenue(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">{selectedVenue ? 'Update Venue' : 'Add Venue'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Venues</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search venues..."
            className="pl-8 w-full md:w-auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Pitch Type</TableHead>
                <TableHead>Matches Hosted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVenues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No venues found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVenues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <Building className="h-4 w-4 text-blue-500" />
                        </div>
                        <span>{venue.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">{venue.city}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{venue.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Ruler className="h-4 w-4 text-gray-400 mr-1" />
                        {venue.capacity.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{venue.pitchType}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 text-gray-400 mr-1" />
                        {venue.matchesHosted}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(venue.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditVenue(venue)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteVenue(venue.id)}>
                        <Trash2 className="h-4 w-4" />
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
            Showing {filteredVenues.length} of {venues.length} venues
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Map className="h-4 w-4 mr-2" />
              View Map
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VenueManagement;
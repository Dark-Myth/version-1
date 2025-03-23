import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, User, Bell, Shield, EyeOff, 
   Download, RotateCcw, CheckCircle,
  Key, LogOut, Users, UserPlus, Trash2, 
  
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AdminSettingsProps {
  adminId: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ adminId }) => {
  const [loading, setLoading] = useState(true);
  const [settingsData, setSettingsData] = useState({
    profile: {
      name: 'Admin User',
      email: 'admin@cricketapp.com',
      role: 'Super Admin',
      lastLogin: '2024-03-22 09:45 AM'
    },
    notifications: {
      email: true,
      inApp: true,
      matchUpdates: true,
      teamUpdates: false,
      systemAlerts: true
    },
    security: {
      twoFactorAuth: false,
      passwordLastChanged: '2024-02-15',
      sessionTimeout: '30'
    },
    system: {
      theme: 'light',
      language: 'en',
      dataRetention: '90',
      backupFrequency: 'weekly'
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Smith',
      role: 'Admin',
      email: 'john@cricketapp.com',
      status: 'active',
      lastActive: '2024-03-22 10:15 AM'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Scorer',
      email: 'sarah@cricketapp.com',
      status: 'active',
      lastActive: '2024-03-21 03:45 PM'
    },
    {
      id: '3',
      name: 'Robert Williams',
      role: 'Team Manager',
      email: 'robert@cricketapp.com',
      status: 'inactive',
      lastActive: '2024-03-10 12:30 PM'
    }
  ]);
  
  useEffect(() => {
    // Simulate loading the settings
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [adminId]);
  
  const handleSaveSettings = () => {
    console.log('Saving settings:', settingsData);
    // Show success message or handle API call
  };
  
  const handleBackupData = () => {
    console.log('Backing up data');
    // Simulate backup process
  };
  
  const handleRestoreData = () => {
    console.log('Restoring data');
    // Handle restore process
  };

  const handleUpdateProfile = (field: string, value: string) => {
    setSettingsData({
      ...settingsData,
      profile: {
        ...settingsData.profile,
        [field]: value
      }
    });
  };

  const handleUpdateNotifications = (field: string, value: boolean) => {
    setSettingsData({
      ...settingsData,
      notifications: {
        ...settingsData.notifications,
        [field]: value
      }
    });
  };

  const handleUpdateSecurity = (field: string, value: string | boolean) => {
    setSettingsData({
      ...settingsData,
      security: {
        ...settingsData.security,
        [field]: value
      }
    });
  };

  const handleUpdateSystem = (field: string, value: string) => {
    setSettingsData({
      ...settingsData,
      system: {
        ...settingsData.system,
        [field]: value
      }
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
        <p className="text-gray-500">Manage your account and system preferences</p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full md:w-auto flex flex-wrap">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={settingsData.profile.name} 
                    onChange={(e) => handleUpdateProfile('name', e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={settingsData.profile.email} 
                    onChange={(e) => handleUpdateProfile('email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={settingsData.profile.role}
                    onValueChange={(value) => handleUpdateProfile('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Scorer">Scorer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Last Login</Label>
                  <div className="p-2 bg-gray-50 rounded-md text-gray-500">
                    {settingsData.profile.lastLogin}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Update your password or delete your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notification Methods</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={settingsData.notifications.email} 
                    onCheckedChange={(checked) => handleUpdateNotifications('email', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">In-App Notifications</Label>
                    <p className="text-sm text-gray-500">Show notifications in the dashboard</p>
                  </div>
                  <Switch 
                    checked={settingsData.notifications.inApp} 
                    onCheckedChange={(checked) => handleUpdateNotifications('inApp', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notification Types</h3>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Match Updates</Label>
                    <p className="text-sm text-gray-500">Scores, results, and match status changes</p>
                  </div>
                  <Switch 
                    checked={settingsData.notifications.matchUpdates} 
                    onCheckedChange={(checked) => handleUpdateNotifications('matchUpdates', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Team Updates</Label>
                    <p className="text-sm text-gray-500">Player changes, team registrations, etc.</p>
                  </div>
                  <Switch 
                    checked={settingsData.notifications.teamUpdates} 
                    onCheckedChange={(checked) => handleUpdateNotifications('teamUpdates', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">System Alerts</Label>
                    <p className="text-sm text-gray-500">Important system notifications and alerts</p>
                  </div>
                  <Switch 
                    checked={settingsData.notifications.systemAlerts} 
                    onCheckedChange={(checked) => handleUpdateNotifications('systemAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">Reset to Default</Button>
              <Button onClick={handleSaveSettings}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch 
                    checked={settingsData.security.twoFactorAuth} 
                    onCheckedChange={(checked) => handleUpdateSecurity('twoFactorAuth', checked)}
                  />
                </div>
                
                {settingsData.security.twoFactorAuth && (
                  <div className="p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
                    <div className="font-medium mb-1">Two-factor authentication is enabled</div>
                    <p>Your account is now more secure.</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Select 
                    value={settingsData.security.sessionTimeout}
                    onValueChange={(value) => handleUpdateSecurity('sessionTimeout', value)}
                  >
                    <SelectTrigger id="sessionTimeout">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Your session will expire after this period of inactivity
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-0.5">
                  <Label className="text-base">Password</Label>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Last changed: {settingsData.security.passwordLastChanged}</p>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-base">Active Sessions</Label>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-medium">Current Session</div>
                        <div className="text-sm text-gray-500">Chrome on Windows • 192.168.1.1</div>
                      </div>
                      <Badge>Active Now</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out All Other Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleSaveSettings}>Save Security Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* System Settings */}
        <TabsContent value="system" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={settingsData.system.theme}
                    onValueChange={(value) => handleUpdateSystem('theme', value)}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={settingsData.system.language}
                    onValueChange={(value) => handleUpdateSystem('language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Select 
                    value={settingsData.system.dataRetention}
                    onValueChange={(value) => handleUpdateSystem('dataRetention', value)}
                  >
                    <SelectTrigger id="dataRetention">
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select 
                    value={settingsData.system.backupFrequency}
                    onValueChange={(value) => handleUpdateSystem('backupFrequency', value)}
                  >
                    <SelectTrigger id="backupFrequency">
                      <SelectValue placeholder="Select backup frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row border-t pt-6 gap-3">
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleSaveSettings}>
                Save Settings
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleBackupData}>
                <Download className="h-4 w-4 mr-2" />
                Backup System
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleRestoreData}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>View system details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Version</p>
                  <p className="font-medium">1.2.4</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Updated</p>
                  <p className="font-medium">2024-03-20</p>
                </div>
                <div>
                  <p className="text-gray-500">Database Status</p>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <p className="font-medium text-green-600">Healthy</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Storage Used</p>
                  <p className="font-medium">245 MB / 1 GB</p>
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>System is up to date</AlertTitle>
                <AlertDescription>
                  You are running the latest version of the system.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team Settings */}
        <TabsContent value="team" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage users who can access the system</CardDescription>
              </div>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {member.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{member.lastActive}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Configure what each role can access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Admin</h3>
                  <p className="text-sm text-gray-500 mb-3">Full access to all system functions</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Manage tournaments
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Manage teams
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Manage players
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Schedule matches
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Live scoring
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      System settings
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Scorer</h3>
                  <p className="text-sm text-gray-500 mb-3">Can update match scores in real-time</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      View tournaments
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      View teams
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      View players
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      View matches
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Live scoring
                    </div>
                    <div className="flex items-center text-gray-400">
                      <EyeOff className="h-4 w-4 mr-2" />
                      System settings
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Team Manager</h3>
                  <p className="text-sm text-gray-500 mb-3">Can manage their team and players</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      View tournaments
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Manage assigned team
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Manage team players
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      View matches
                    </div>
                    <div className="flex items-center text-gray-400">
                      <EyeOff className="h-4 w-4 mr-2" />
                      Live scoring
                    </div>
                    <div className="flex items-center text-gray-400">
                      <EyeOff className="h-4 w-4 mr-2" />
                      System settings
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Edit Permissions</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
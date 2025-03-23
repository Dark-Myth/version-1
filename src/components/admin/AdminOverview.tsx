"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  ActivitySquare, AlertTriangle, Calendar, 
  CheckCircle, Clock, Info, 
} from "lucide-react";

interface AdminOverviewProps {
  adminId: string;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({ adminId }) => {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({
    recentActivity: [],
    upcomingMatches: [],
    alerts: []
  });
  
  useEffect(() => {
    fetchOverviewData();
  }, [adminId]);
  
  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoints
      const [activityRes, matchesRes, alertsRes] = await Promise.all([
        fetch('/api/admin/activity'),
        fetch('/api/matches/upcoming'),
        fetch('/api/admin/alerts')
      ]);
      
      const [activity, matches, alerts] = await Promise.all([
        activityRes.json(),
        matchesRes.json(),
        alertsRes.json()
      ]);
      
      setOverviewData({
        recentActivity: activity,
        upcomingMatches: matches,
        alerts: alerts
      });
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }
  
  // Mock data for demonstration
  const recentActivity = [
    { id: 1, type: 'tournament', action: 'Created tournament', timestamp: '2 hours ago', user: 'Admin' },
    { id: 2, type: 'match', action: 'Updated match score', timestamp: '5 hours ago', user: 'Scorer' },
    { id: 3, type: 'team', action: 'Added new team', timestamp: '1 day ago', user: 'Admin' },
    { id: 4, type: 'player', action: 'Registered player', timestamp: '2 days ago', user: 'Team Manager' }
  ];
  
  const upcomingMatches = [
    { id: 1, teams: 'Team A vs Team B', tournament: 'Summer Cup', time: 'Today, 14:30', venue: 'Main Stadium' },
    { id: 2, teams: 'Team C vs Team D', tournament: 'Summer Cup', time: 'Tomorrow, 10:00', venue: 'Secondary Field' },
    { id: 3, teams: 'Team E vs Team F', tournament: 'Winter League', time: 'Mar 25, 16:00', venue: 'City Ground' },
  ];
  
  const alerts = [
    { id: 1, type: 'warning', message: 'Tournament registration closes in 2 days', timestamp: 'Just now' },
    { id: 2, type: 'info', message: 'System maintenance scheduled for tonight', timestamp: '1 hour ago' },
    { id: 3, type: 'error', message: 'Failed to sync player data from API', timestamp: '3 hours ago' },
    { id: 4, type: 'success', message: 'Backup completed successfully', timestamp: '1 day ago' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ActivitySquare className="h-5 w-5 mr-2 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentActivity.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{item.action}</p>
                      <p className="text-sm text-gray-500">By {item.user}</p>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 text-center">
              <Button variant="link" className="text-sm">View All Activity</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-500" />
              Upcoming Matches
            </CardTitle>
            <CardDescription>Matches requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{match.teams}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-gray-500">{match.tournament}</p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {match.time}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{match.venue}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 text-center">
              <Button variant="link" className="text-sm">View All Matches</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Notifications requiring your attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={
              alert.type === 'warning' ? 'warning' : 
              alert.type === 'error' ? 'destructive' : 
              alert.type === 'success' ? 'default' : 'default'
            }>
              {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {alert.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {alert.type === 'info' && <Info className="h-4 w-4" />}
              {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
              <AlertTitle className="text-sm font-medium">{
                alert.type.charAt(0).toUpperCase() + alert.type.slice(1)
              }</AlertTitle>
              <AlertDescription className="text-sm">
                {alert.message}
                <span className="block text-xs text-gray-500 mt-1">{alert.timestamp}</span>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
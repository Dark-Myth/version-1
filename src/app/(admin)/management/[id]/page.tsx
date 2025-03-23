"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Trophy,
  Calendar,
  Clock,
  Settings,
  BarChart2,
  Shield,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Admin Dashboard Components
import TournamentManagement from "@/components/admin/TournamentManagement";
import TeamManagement from "@/components/admin/TeamManagement";
import MatchScheduling from "@/components/admin/MatchScheduling";
import PlayerManagement from "@/components/admin/PlayerManagement";
import VenueManagement from "@/components/admin/VenueManagement";
import LiveScoring from "@/components/admin/LiveScoring";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminOverview from "@/components/admin/AdminOverview";

const Management = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [cardCollapsed, setCardCollapsed] = useState(false);

  const id = params?.id as string;

  useEffect(() => {
    // Only redirect if we're certain there's no session
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }

    // If authenticated, fetch admin info and permissions
    if (status === "authenticated") {
      fetchAdminInfo();
    }
  }, [status, router, id]);

  const fetchAdminInfo = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await fetch(`/api/admin/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch admin information");
      }

      const data = await response.json();
      setAdminInfo(data);

      // Set the active tab based on URL or permissions
      if (params?.tab) {
        setActiveTab(params.tab as string);
      }
    } catch (error) {
      console.error("Error fetching admin information:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle collapsing and expanding the stats card
  const toggleCardCollapse = () => {
    setCardCollapsed(!cardCollapsed);
  };

  // Show loading state while checking session or fetching data
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  // Only render page content if authenticated
  if (status === "authenticated") {
    return (
      <div className="flex flex-col space-y-6">
        {/* Stats Card with collapse/expand functionality */}
               <div
          className={`rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
            cardCollapsed ? "max-h-[60px]" : "max-h-[500px]"
          }`}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2 flex flex-row items-center justify-between flex-1">
              <div>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>
                  At a glance performance metrics
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCardCollapse}
                className="h-8 w-8 p-0"
              >
                {cardCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                cardCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
              }`}
            >
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Tournaments"
                    value="5"
                    status="active"
                    icon={<Trophy className="h-5 w-5 text-orange-500" />}
                  />
                  <StatCard
                    title="Teams"
                    value="24"
                    status="registered"
                    icon={<Shield className="h-5 w-5 text-blue-500" />}
                  />
                  <StatCard
                    title="Matches"
                    value="3"
                    status="ongoing"
                    icon={<Calendar className="h-5 w-5 text-green-500" />}
                  />
                  <StatCard
                    title="Players"
                    value="240"
                    status="active"
                    icon={<Users className="h-5 w-5 text-purple-500" />}
                  />
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Tabs section - separate from the collapsible card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-full flex flex-col"
          >
            <div className="sticky top-[1.5px] bg-white z-10 pb-4">
              <TabsList className="mb-2 w-full max-w-full overflow-x-auto flex flex-nowrap justify-start">
                <TabsTrigger
                  value="overview"
                  className="flex items-center whitespace-nowrap"
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="tournaments"
                  className="flex items-center whitespace-nowrap"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Tournaments
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="flex items-center whitespace-nowrap"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Teams
                </TabsTrigger>
                <TabsTrigger
                  value="matches"
                  className="flex items-center whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Matches
                </TabsTrigger>
                <TabsTrigger
                  value="players"
                  className="flex items-center whitespace-nowrap"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Players
                </TabsTrigger>
                <TabsTrigger
                  value="venues"
                  className="flex items-center whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Venues
                </TabsTrigger>
                <TabsTrigger
                  value="live-scoring"
                  className="flex items-center whitespace-nowrap"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Live Scoring
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
        
            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="space-y-4 h-full">
                <AdminOverview adminId={id} />
              </TabsContent>
        
              <TabsContent value="tournaments" className="space-y-4 h-full">
                <TournamentManagement adminId={id} />
              </TabsContent>
        
              <TabsContent value="teams" className="space-y-4 h-full">
                <TeamManagement adminId={id} />
              </TabsContent>
        
              <TabsContent value="matches" className="space-y-4 h-full">
                <MatchScheduling adminId={id} />
              </TabsContent>
        
              <TabsContent value="players" className="space-y-4 h-full">
                <PlayerManagement adminId={id} />
              </TabsContent>
        
              <TabsContent value="venues" className="space-y-4 h-full">
                <VenueManagement adminId={id} />
              </TabsContent>
        
              <TabsContent value="live-scoring" className="space-y-4 h-full">
                <LiveScoring adminId={id} />
              </TabsContent>
        
              <TabsContent value="settings" className="space-y-4 h-full">
                <AdminSettings adminId={id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  // Return empty during redirect
  return null;
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  status: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, status, icon }: StatCardProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <p className="text-xs text-gray-500 mt-1">{status}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-full">{icon}</div>
      </div>
    </div>
  );
};

export default Management;

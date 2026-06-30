"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardOverview from "../../components/DashboardOverview";
import { useCampaign } from "@/context/CampaignContext"; // Import Context

export default function DashboardPage() {
  // 1. Pull the create function and campaigns from context
  const { campaigns, setCampaigns, createNewCampaign } = useCampaign();
  
  const [dashboardData, setDashboardData] = useState({
    total_posts: 0,
    total_clicks: 0,
    avg_cvr: "0.0%",
    avg_engagement: "0.0%",
    campaigns: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 2. Check Auth Status
  useEffect(() => {
    const token = localStorage.getItem("marketing_token");
    if (!token) {
      router.push("/auth");
    }
  }, [router]);

  // 3. Fetch specific dashboard stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("marketing_token");
        if (!token) return;

        const res = await fetch("http://127.0.0.1:8000/api/campaigns/dashboard", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem("marketing_token");
          router.push("/auth");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
          // Optional: Sync dashboard campaigns with context
          if (data.campaigns) setCampaigns(data.campaigns);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, setCampaigns]);

  // 4. Show loading state if waiting for data or auth
  if (isLoading) {
    return (
      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading workspace...</div>
      </div>
    );
  }

  // 5. Render ONLY the Dashboard Overview
  return (
    <div className="flex-1 h-full bg-gray-50 overflow-y-auto relative font-sans">
      <DashboardOverview 
        stats={dashboardData}
        campaigns={campaigns} 
        onNewCampaign={createNewCampaign} // <-- This connects the button to your Context!
      />
    </div>
  );
}
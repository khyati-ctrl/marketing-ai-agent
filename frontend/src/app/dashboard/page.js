"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Auth from "../Auth";
import Sidebar from "../../components/sidebar"; 
import DashboardOverview from "../../components/DashboardOverview";
import ChatWindow from "../../components/ChatWindow";

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState("overview");
  const router = useRouter();

  // Add this inside your Home component
  const [dashboardData, setDashboardData] = useState({
    total_posts: 0,
    total_clicks: 0,
    avg_cvr: "0.0%",
    avg_engagement: "0.0%",
    campaigns: []
  });

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("marketing_token");
      const res = await fetch("http://127.0.0.1:8000/api/campaigns/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setDashboardData(data);
      setCampaigns(data.campaigns); // Keep your sidebar updated too!
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  
  useEffect(() => {
    if (currentView === 'overview') {
      fetchDashboardData();
    }
  }, [currentView]); // <--- Keep currentView here permanently!

  useEffect(() => {
    const token = localStorage.getItem("marketing_token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      // If no token, immediately kick them to the auth page
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem("marketing_token");
        const response = await fetch("http://localhost:8000/api/campaigns", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        // NEW LOGIC: If the backend says "401 Unauthorized", silently log the user out
        if (response.status === 401) {
          localStorage.removeItem("marketing_token");
          setIsAuthenticated(false);
          return; // Stop running the rest of the function
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      }
    };

    if (isAuthenticated) fetchCampaigns();
  }, [isAuthenticated]);

  const handleNewCampaign = () => {
    setActiveId(null);
    setMessages([]);
    setMessage("");
    setCurrentView("chat");
  };

  const handleGoHome = () => {
    setActiveId(null);
    setCurrentView("overview"); // Swaps the screen back to the dashboard!
  };

  const handleSelectCampaign = async (camp) => {
    setActiveId(camp.id);
    setMessages([{ role: "ai", content: "Loading campaign history..." }]);
    setCurrentView("chat");

    try {
      const token = localStorage.getItem("marketing_token");
      const res = await fetch(`http://localhost:8000/api/campaigns/${camp.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Not authorized or session expired.");
      const data = await res.json();
      setMessages(data.chat_history || []);
    } catch (error) {
      setMessages([{ role: "ai", content: "Error loading history. Please log in again." }]);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    // 1. Pop up the native browser confirmation box
    const isConfirmed = window.confirm("Are you sure you want to delete this campaign? This cannot be undone.");

    // 2. If the user clicks "Cancel", exit the function immediately
    if (!isConfirmed) {
        return; 
    }
    // 3. If they clicked "OK", proceed with your existing delete logic
    try {
      const token = localStorage.getItem("marketing_token");
      const res = await fetch(`http://localhost:8000/api/campaigns/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete.");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) handleNewCampaign();
    } catch (error) {
      alert("Could not delete campaign.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("marketing_token"); 
    setIsAuthenticated(false); 
    setActiveId(null);
    setMessages([]);
    setCampaigns([]);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;
    setMessages((prev) => [...prev, { role: "user", content: currentMessage }]);
    setMessage(""); 
    setIsLoading(true); 

    try {
      const token = localStorage.getItem("marketing_token");
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
         },
        body: JSON.stringify({
          user_message: currentMessage,
          campaign_id: activeId
        }),
      });

      const data = await response.json();

      if (!activeId && data.persona_id) {
        setActiveId(data.persona_id);
        setCampaigns((prev) => [
          ...prev, 
          { id: data.persona_id, name: currentMessage.substring(0, 30) + "..." }
        ]);
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.response || "Task complete." }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: Could not connect to Python backend." }
      ]);
    } finally {
      setIsLoading(false); 
    }
  };

  if (!isAuthenticated) {
    // Show a blank screen or loading spinner while the redirect happens
    return <div className="h-screen w-full bg-gray-50 flex items-center justify-center">Loading workspace...</div>;
  }
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      <Sidebar 
        campaigns={campaigns}
        activeId={activeId}
        onNewCampaign={handleNewCampaign}
        onSelectCampaign={handleSelectCampaign}
        onDelete={handleDelete}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
      />
      
      <main className="flex-1 overflow-y-auto relative">
        {/* If user clicks a campaign, show Chat. Otherwise, show Overview. */}
        {currentView === "overview" ? (
          <DashboardOverview 
            stats={dashboardData}
            campaigns={campaigns} 
            onNewCampaign={handleNewCampaign} 
          />
        ) : (
          <ChatWindow 
            activeId={activeId}
            messages={messages}
            message={message}
            setMessage={setMessage}
            isLoading={isLoading}
            onSend={handleSend}
            campaigns={campaigns}
          />
        )}
      </main>

    </div>
  );
}
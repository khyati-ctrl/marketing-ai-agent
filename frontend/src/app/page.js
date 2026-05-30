"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar"; // 1. Import your new Lego Block!

export default function Home() {
  // --- STATE ---
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  
  // 2. New State for the Sidebar
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  
  // Start with an empty list instead of fake data
  const [campaignList, setCampaignList] = useState([]); 

  // The Boot-up Sequence (Runs exactly once on page load)
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/campaigns");
        const data = await response.json();
        
        // Update the state with the real data from PostgreSQL!
        setCampaignList(data.campaigns);
      } catch (error) {
        console.error("Failed to fetch campaigns from database:", error);
      }
    };

    fetchCampaigns();
  }, []); // <-- This empty array is the magic. It means "Only run once!"

  // --- LOGIC ---
  const handleSend = async () => {
    if (!message) return;
    
    const newHistory = [...chatHistory, { role: "user", content: message }];
    setChatHistory(newHistory);
    setMessage(""); 

    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: message,
          persona_id: activeCampaignId // 3. We are now sending the ID to Python!
        }),
      });

      const data = await response.json();
      
      // If Python created a NEW campaign, update our active ID AND our Sidebar list
      if (data.action === "PLAN" && data.persona_id) {
        setActiveCampaignId(data.persona_id);
        
        // Instantly push the new campaign into the Sidebar memory
        setCampaignList(prevList => [
          ...prevList, 
          { id: data.persona_id, name: message.substring(0, 25) + "..." }
        ]);
      }

      setChatHistory([...newHistory, { role: "ai", content: data.response }]);
    } catch (error) {
      setChatHistory([...newHistory, { role: "ai", content: "Error: Could not connect to Python backend." }]);
    }
  };

  // --- UI ---
  return (
    // 4. Changed the main wrapper to 'flex-row' so they sit side-by-side
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* 5. Snap in the Sidebar Component and wire up the Props */}
      <Sidebar 
        campaigns={campaignList}
        activeCampaign={activeCampaignId}
        onSelect={(id) => setActiveCampaignId(id)}
        onNew={() => {
            setActiveCampaignId(null);
            setChatHistory([]); // Clear chat for a new campaign
        }}
      />

      {/* The existing Chat Interface */}
      <main className="flex-1 flex flex-col p-10 items-center">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg flex flex-col h-full border border-gray-100">
          
          <div className="bg-white border-b p-4 rounded-t-xl text-gray-800 font-semibold flex justify-between items-center">
            <span>Marketing AI Supervisor</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
              {activeCampaignId ? `Campaign ID: ${activeCampaignId}` : "New Campaign"}
            </span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-gray-50/50">
            {chatHistory.length === 0 ? (
              <p className="text-gray-400 text-center mt-20">Type a message to start planning...</p>
            ) : (
              chatHistory.map((chat, index) => (
                <div key={index} className={`p-4 rounded-2xl max-w-[85%] ${
                    chat.role === "user" 
                      ? "bg-blue-600 self-end text-white rounded-br-none shadow-sm" 
                      : "bg-white self-start text-gray-800 rounded-bl-none shadow-sm border border-gray-100"
                  }`}
                >
                  {chat.content}
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-white rounded-b-xl border-t border-gray-100">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={activeCampaignId ? "Ask for a poster, tweet, or analysis..." : "Describe your new campaign..."}
                className="flex-1 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-black"
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Send
              </button>
            </div>
          </div>
          
        </div>
      </main>

    </div>
  );
}
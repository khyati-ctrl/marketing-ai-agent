"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch all campaigns when the page loads
useEffect(() => {
  const fetchCampaigns = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/campaigns");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Failed to connect to AI Marketing Backend:", error);
      // Optional: Set an error state here to show a UI alert instead of crashing
    }
  };

  fetchCampaigns();
}, []);

  // 2. Resets the chat for a brand new campaign
  const handleNewCampaign = () => {
    setActiveId(null);
    setMessages([]);
    setMessage("");
  };

  // 3. Switches the active ID and loads the full chat history from PostgreSQL
  const handleSelectCampaign = async (camp) => {
    setActiveId(camp.id);
    setMessages([{ role: "ai", content: "Loading campaign history..." }]);

    try {
      const res = await fetch(`http://localhost:8000/api/campaigns/${camp.id}`);
      const data = await res.json();
      
      // Directly inject the full JSON array saved in the database
      setMessages(data.chat_history || []);
    } catch (error) {
      console.error("Failed to load history:", error);
      setMessages([{ role: "ai", content: "Error loading history." }]);
    }
  };

  // 4. Deletes a campaign from the database and updates the sidebar
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevents the click from accidentally selecting the campaign
    
    try {
      await fetch(`http://localhost:8000/api/campaigns/${id}`, { method: "DELETE" });
      
      // Remove it from the React state (sidebar list)
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      
      // If we are currently looking at the deleted campaign, clear the chat screen
      if (activeId === id) {
        handleNewCampaign();
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  // 5. Handle sending the message to the Python backend
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;
    
    // Immediately update UI to show user's message
    setMessages((prev) => [...prev, { role: "user", content: currentMessage }]);
    setMessage(""); // Clear input box
    setIsLoading(true); // Lock the button while waiting for AI

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: currentMessage,
          campaign_id: activeId
        }),
      });

      const data = await response.json();

      // If this was a brand new campaign, lock in the new ID from the backend
      if (!activeId && data.persona_id) {
        setActiveId(data.persona_id);
        
        // Add the new campaign to the sidebar instantly without refreshing
        setCampaigns((prev) => [
          ...prev, 
          { id: data.persona_id, name: currentMessage.substring(0, 30) + "..." }
        ]);
      }

      // Add AI response to the chat window
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: data.response || "Task complete." }
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: Could not connect to Python backend." }
      ]);
    } finally {
      setIsLoading(false); // Unlock the send button
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-[#111827] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider mb-6">MARKETING AI</h1>
          <button 
            onClick={handleNewCampaign}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            <span className="mr-2">+</span> New Campaign
          </button>
        </div>
        
        <div className="px-6 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 mb-4 tracking-widest uppercase">
            Your Campaigns
          </p>
          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-500">No campaigns yet.</p>
            ) : (
              campaigns.map((camp) => (
                <div 
                  key={camp.id} 
                  onClick={() => handleSelectCampaign(camp)}
                  className={`group flex justify-between items-center text-sm cursor-pointer p-2 rounded transition-colors ${
                    activeId === camp.id 
                      ? "bg-blue-600 text-white font-medium" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <span className="truncate pr-2">Campaign #{camp.id}</span>
                  
                  {/* The Delete 'X' Button - Only visible on hover */}
                  <button 
                    onClick={(e) => handleDelete(e, camp.id)}
                    className="hidden group-hover:block text-gray-400 hover:text-red-400 font-bold px-1"
                    title="Delete Campaign"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        
        {/* Top Header */}
        <div className="border-b px-8 py-4 flex justify-between items-center bg-white shadow-sm z-10">
          <h2 className="text-lg font-bold text-gray-800">Marketing AI Supervisor</h2>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm font-medium">
            {activeId ? `Campaign #${activeId}` : "New Campaign"}
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              Start by describing your marketing goals below.
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-3xl rounded-2xl px-6 py-4 text-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                }`}>
                  {/* AI Messages use Markdown, User messages are just text */}
                  {msg.role === "ai" ? (
                    <ReactMarkdown 
                      components={{
                        a: ({node, ...props}) => <a {...props} className="text-blue-600 underline font-semibold hover:text-blue-800" target="_blank" rel="noopener noreferrer" />,
                        strong: ({node, ...props}) => <strong {...props} className="font-bold text-gray-900" />,
                        ul: ({node, ...props}) => <ul {...props} className="list-disc ml-5 mb-2 space-y-1" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-5 mb-2 space-y-1" />,
                        p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0 leading-relaxed" />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Loading Animation */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 text-gray-500 border border-gray-200 rounded-2xl rounded-bl-none px-6 py-4 text-sm flex items-center space-x-2 shadow-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-6 bg-white border-t">
          <form 
            onSubmit={handleSend} 
            className="flex items-center space-x-4 max-w-4xl mx-auto bg-white"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your new campaign..."
              disabled={isLoading}
              className="flex-1 text-gray-900 placeholder-gray-500 border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
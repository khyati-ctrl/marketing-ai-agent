"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch campaigns when the page loads
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/campaigns");
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      }
    };
    fetchCampaigns();
  }, []);

  // Handle sending the message to the Python backend
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;
    
    // Immediately update UI
    setMessages((prev) => [...prev, { role: "user", content: currentMessage }]);
    setMessage(""); // Clear input box
    setIsLoading(true); // Lock the button while waiting

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

      // Add AI response to the chat
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
      setIsLoading(false); // Unlock the button
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-[#111827] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-wider mb-6">MARKETING AI</h1>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors">
            <span className="mr-2">+</span> New Campaign
          </button>
        </div>
        
        <div className="px-6 flex-1">
          <p className="text-xs font-semibold text-gray-400 mb-4 tracking-widest uppercase">
            Your Campaigns
          </p>
          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <p className="text-sm text-gray-500">No campaigns yet.</p>
            ) : (
              campaigns.map((camp) => (
                <div key={camp.id} className="text-sm text-gray-300 hover:text-white cursor-pointer p-2 rounded hover:bg-gray-800">
                  Campaign #{camp.id}
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
            New Campaign
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
                <div className={`max-w-2xl rounded-2xl px-6 py-4 text-sm ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                }`}>
                  <ReactMarkdown 
                    components={{
                      // Formats clickable links
                      a: ({node, ...props}) => <a {...props} className="underline font-semibold hover:text-blue-800" target="_blank" rel="noopener noreferrer" />,
                      // Restores bold text
                      strong: ({node, ...props}) => <strong {...props} className="font-bold" />,
                      // Formats bullet points
                      ul: ({node, ...props}) => <ul {...props} className="list-disc ml-5 mb-2" />,
                      // Formats numbered lists
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-5 mb-2" />,
                      // Adds spacing between paragraphs
                      p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0" />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 border border-gray-200 rounded-2xl rounded-bl-none px-6 py-4 text-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form at the bottom */}
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
"use client";

import { useCampaign } from "@/context/CampaignContext";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import FunnelChart from "./FunnelChart";
import { API_BASE_URL } from "@/config";

export default function ChatWindow({ activeId, onSend }) {
  // Pulling state from the Global Context
  const { 
    messages, 
    setMessages,
    message, 
    setMessage, 
    isLoading, 
    campaigns 
  } = useCampaign();

  const [viewMode, setViewMode] = useState("chat");
  const [campaignStats, setCampaignStats] = useState({
    impressions: 0,
    total_clicks: 0,
    total_leads: 0,
    total_sales: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const activeCampaign = campaigns?.find(
    (c) => String(c.id) === String(activeId)
  );

 // Fetch messages for the active campaign
  useEffect(() => {
    // FIX: Do not fetch history if the campaign is new
    if (!activeId || activeId === "new") {
        setMessages([]); // Clear messages when starting a new campaign
        return;
    }

    const fetchHistory = async () => {
      const token = localStorage.getItem("marketing_token");
      const res = await fetch(`${API_BASE_URL}/api/campaigns/${activeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.chat_history || []);
      }
    };

    fetchHistory();
  }, [activeId, setMessages]);

  // Fetch analytics data
  useEffect(() => {
    if (viewMode !== "analytics" || !activeCampaign) return;

    const fetchAnalytics = async () => {
      setIsLoadingStats(true);
      try {
        const token = localStorage.getItem("marketing_token");
        const res = await fetch(
          `${API_BASE_URL}/api/campaigns/${activeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch analytics");

        const data = await res.json();
        setCampaignStats({
          impressions: data.impressions || 0,
          total_clicks: data.clicks || 0,
          total_leads: data.leads || 0,
          total_sales: data.conversions || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchAnalytics();
  }, [viewMode, activeId, activeCampaign]);

  const conversionRate =
    campaignStats.total_clicks > 0
      ? ((campaignStats.total_sales / campaignStats.total_clicks) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-800">
          {activeCampaign ? activeCampaign.name : "New Campaign"}
        </h2>

        {activeId && (
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("chat")}
              className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "chat"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "analytics"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Analytics
            </button>
          </div>
        )}
      </div>

      {viewMode === "chat" ? (
        <>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                Start by describing your marketing goals below.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-6 py-4 text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            />
                          ),
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

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 text-gray-500 border border-gray-200 rounded-2xl rounded-bl-none px-6 py-4">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t">
            <form onSubmit={onSend} className="flex items-center space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your campaign..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl"
              >
                Send
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">
              Campaign Performance
            </h3>
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-64 text-gray-500 text-lg">
                Loading analytics...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Impressions</p>
                    <p className="text-4xl font-bold text-amber-500 mt-3">{campaignStats.impressions}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Clicks</p>
                    <p className="text-4xl font-bold text-blue-600 mt-3">{campaignStats.total_clicks}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Leads</p>
                    <p className="text-4xl font-bold text-purple-600 mt-3">{campaignStats.total_leads}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sales</p>
                    <p className="text-4xl font-bold text-green-600 mt-3">{campaignStats.total_sales}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Conversion Rate</p>
                  <p className="text-5xl font-bold text-gray-900 mt-3">{conversionRate}%</p>
                </div>
                
                <FunnelChart stats={campaignStats} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
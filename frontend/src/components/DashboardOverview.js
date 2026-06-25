"use client";
import React, { useState } from "react"; 

export default function DashboardOverview({ stats, onNewCampaign }) {
  // We use an object to store insights by campaign ID: { 1: "Insight text...", 2: "Insight text..." }
  const [insights, setInsights] = useState({});
  // Track which ID is currently loading so we can disable its specific button
  const [analyzingId, setAnalyzingId] = useState(null);

  const handleAnalyze = async (campId) => {
    // If we already have the insight, clicking the button again will hide it (toggle)
    if (insights[campId]) {
      const newInsights = { ...insights };
      delete newInsights[campId];
      setInsights(newInsights);
      return;
    }

    setAnalyzingId(campId);
    try {
      const token = localStorage.getItem("marketing_token");
      const res = await fetch(`http://localhost:8000/api/campaigns/${campId}/insights`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setInsights(prev => ({ ...prev, [campId]: data.insight }));
      } else {
        setInsights(prev => ({ ...prev, [campId]: "Failed to generate specific insights." }));
      }
    } catch (error) {
      setInsights(prev => ({ ...prev, [campId]: "Error connecting to AI engine." }));
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
      
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Campaign Overview</h2>
          <p className="text-gray-500 mt-1">Track the performance of your AI-generated marketing assets.</p>
        </div>
        <button 
          onClick={onNewCampaign}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Campaigns</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.campaigns?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Clicks</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_clicks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Avg. Conversion Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.avg_cvr || "0.0%"}</p>
        </div>
      </div>

      {/* Insights Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="p-4 font-medium">Campaign Name</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Impressions</th>
                <th className="p-4 font-medium">Clicks</th>
                <th className="p-4 font-medium">Leads</th>       
                <th className="p-4 font-medium">Sales</th>
                <th className="p-4 font-medium">CVR (%)</th>
                <th className="p-4 font-medium">AI Analysis</th> 
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!stats.campaigns || stats.campaigns.length === 0) ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No campaigns generated yet. Click "New Campaign" to start!
                  </td>
                </tr>
              ) : (
                stats.campaigns.map((camp) => (
                  <React.Fragment key={camp.id}>
                    {/* Main Campaign Row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{camp.name}</td>
                      <td className="p-4 text-gray-500">{camp.date}</td>
                      <td className="p-4 text-gray-600">{camp.impressions}</td>
                      <td className="p-4 text-gray-600">{camp.clicks}</td>
                      <td className="p-4 text-blue-600 font-medium">{camp.leads || 0}</td>
                      <td className="p-4 text-green-600 font-medium">{camp.conversions || 0}</td>
                      <td className="p-4 text-gray-600">
                        {camp.clicks > 0 
                          ? ((camp.conversions / camp.clicks) * 100).toFixed(1) + "%" 
                          : "0.0%"}
                      </td>  
                      <td className="p-4">
                        <button 
                          onClick={() => handleAnalyze(camp.id)}
                          disabled={analyzingId === camp.id}
                          className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                            insights[camp.id] 
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-200" 
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          } disabled:opacity-50`}
                        >
                          {analyzingId === camp.id ? "Analyzing..." : (insights[camp.id] ? "Close" : "Analyze")}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded AI Insight Row (Only shows if this campaign has been analyzed) */}
                    {insights[camp.id] && (
                      <tr className="bg-blue-50/50">
                        <td colSpan="8" className="p-6 border-b border-blue-100">
                          <div className="flex gap-3">
                            <span className="text-xl">✨</span>
                            <div>
                              <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">
                                Campaign Insight
                              </h4>
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {insights[camp.id]}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
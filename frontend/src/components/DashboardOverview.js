"use client";

import React, { useState } from "react";
import { API_BASE_URL } from "@/config";

export default function DashboardOverview({ stats, onNewCampaign }) {
  const [insights, setInsights] = useState({});
  const [analyzingId, setAnalyzingId] = useState(null);

  const handleAnalyze = async (campId) => {
    if (insights[campId]) {
      const updated = { ...insights };
      delete updated[campId];
      setInsights(updated);
      return;
    }

    setAnalyzingId(campId);

    try {
      const token = localStorage.getItem("marketing_token");

      const res = await fetch(
        `${API_BASE_URL}/api/campaigns/${campId}/insights`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();

        setInsights((prev) => ({
          ...prev,
          [campId]: data.insight,
        }));
      } else {
        setInsights((prev) => ({
          ...prev,
          [campId]: "Failed to generate campaign insights.",
        }));
      }
    } catch (err) {
      setInsights((prev) => ({
        ...prev,
        [campId]: "Error connecting to AI engine.",
      }));
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Campaign Overview
          </h2>

          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track the performance of your AI-generated marketing assets.
          </p>
        </div>

        <button
          onClick={onNewCampaign}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          + New Campaign
        </button>

      </div>

      {/* Metric Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">

          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Total Campaigns
          </p>

          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {stats.campaigns?.length || 0}
          </p>

          <p className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            Active marketing experiments.
          </p>

        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">

          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Total Clicks
          </p>

          <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
            {stats.total_clicks}
          </p>

          <p className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            Total clicks across all campaigns.
          </p>

        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">

          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Avg. Engagement
          </p>

          <p className="text-3xl font-bold mt-2 text-blue-600">
            {stats.avg_engagement || "0.0%"}
          </p>

          <p className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            Percentage of impressions that became clicks.
          </p>

        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">

          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Avg. Conversion
          </p>

          <p className="text-3xl font-bold mt-2 text-green-600">
            {stats.avg_cvr || "0.0%"}
          </p>

          <p className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
            Percentage of clicks that resulted in sales.
          </p>

        </div>

      </div>

      {/* Campaign Table */}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">

        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Campaigns
          </h3>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead>

              <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">

                <th className="p-4 font-medium">Campaign</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Impressions</th>
                <th className="p-4 font-medium">Clicks</th>
                <th className="p-4 font-medium">Leads</th>
                <th className="p-4 font-medium">Sales</th>
                <th className="p-4 font-medium">CVR</th>
                <th className="p-4 font-medium">AI</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {(!stats.campaigns || stats.campaigns.length === 0) ? (

                <tr>

                  <td
                    colSpan="8"
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No campaigns generated yet. Click "New Campaign" to start!
                  </td>

                </tr>

              ) : (

                stats.campaigns.map((camp) => (

                  <React.Fragment key={camp.id}>

                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">

                      <td className="p-4 font-medium text-gray-900 dark:text-white">
                        {camp.name}
                      </td>

                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {camp.date}
                      </td>

                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {camp.impressions || 0}
                      </td>

                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {camp.clicks}
                      </td>

                      <td className="p-4 text-blue-600 font-medium">
                        {camp.leads || 0}
                      </td>

                      <td className="p-4 text-green-600 font-medium">
                        {camp.conversions || 0}
                      </td>

                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {camp.clicks > 0
                          ? (
                              (camp.conversions / camp.clicks) *
                              100
                            ).toFixed(1) + "%"
                          : "0.0%"}
                      </td>

                      <td className="p-4">

                        <button
                          onClick={() => handleAnalyze(camp.id)}
                          disabled={analyzingId === camp.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            insights[camp.id]
                              ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white"
                              : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                          } disabled:opacity-50`}
                        >
                          {analyzingId === camp.id
                            ? "Analyzing..."
                            : insights[camp.id]
                            ? "Close"
                            : "Analyze"}
                        </button>

                      </td>

                    </tr>

                    {insights[camp.id] && (

                      <tr className="bg-blue-50 dark:bg-blue-950/40">

                        <td
                          colSpan="8"
                          className="p-6 border-b border-blue-100 dark:border-blue-900"
                        >

                          <div className="flex gap-3">

                            <span className="text-xl">
                              ✨
                            </span>

                            <div>

                              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2">
                                Campaign Insight
                              </h4>

                              <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
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
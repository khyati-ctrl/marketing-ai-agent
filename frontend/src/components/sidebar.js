"use client";

import { useState } from "react";

export default function Sidebar({ 
  campaigns, 
  activeId, 
  onNewCampaign, 
  onSelectCampaign, 
  onDelete, 
  onLogout,
  onGoHome // <--- Catching the new prop here!
}) {
  // State to track if the sidebar is open or closed
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`${isCollapsed ? "w-20" : "w-64"} bg-[#111827] text-white flex flex-col transition-all duration-300 shrink-0`}>
      
      {/* Header & Toggle Button */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!isCollapsed && <h1 className="font-bold text-xl truncate text-blue-400">AI Agent</h1>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors mx-auto"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? "▶" : "◀"}
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        
        {/* Go to Dashboard Button */}
        <button 
          onClick={onGoHome}
          className={`w-full flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors ${activeId === null ? "bg-gray-800" : ""}`}
          title="Dashboard"
        >
          <span className="text-xl text-gray-300">🏠</span>
          {!isCollapsed && <span className="ml-3 font-medium text-gray-200">Dashboard</span>}
        </button>

        {/* New Campaign Button */}
        <button
          onClick={onNewCampaign}
          className={`w-full flex items-center justify-center bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${isCollapsed ? "px-0" : "px-4"}`}
          title="New Campaign"
        >
          <span className="text-lg">+</span>
          {!isCollapsed && <span className="ml-2">New Campaign</span>}
        </button>

        {/* Campaigns History List */}
        <div className="mt-8">
          {!isCollapsed && <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">History</h2>}
          <ul className="space-y-1">
            {campaigns?.map((camp) => (
              <li key={camp.id} className="flex items-center justify-between group">
                <button
                  onClick={() => onSelectCampaign(camp)}
                  className={`flex-1 text-left truncate p-2 rounded-lg hover:bg-gray-800 transition-colors ${activeId === camp.id ? "bg-gray-800 text-blue-400" : "text-gray-300"}`}
                  title={camp.name}
                >
                  {isCollapsed ? "💬" : camp.name}
                </button>
                {!isCollapsed && (
                  <button 
                    onClick={(e) => onDelete(e, camp.id)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2 transition-opacity"
                    title="Delete"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          title="Logout"
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
      
    </div>
  );
}
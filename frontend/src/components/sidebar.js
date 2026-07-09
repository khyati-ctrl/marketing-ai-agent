"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCampaign } from "@/context/CampaignContext";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export default function Sidebar() {

  const { campaigns, createNewCampaign, deleteCampaign, logout } = useCampaign(); 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/" || pathname === "/auth") {
    return null;
  }

  return (
    <div
      className={`
        ${isCollapsed ? "w-20" : "w-64"}
        bg-white dark:bg-gray-900
        text-gray-900 dark:text-white
        border-r border-gray-200 dark:border-gray-700
        flex flex-col transition-all duration-300 shrink-0
      `}
    >
      
      {/* Header & Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && <h1 className="font-bold text-xl truncate text-blue-400">AI Agent</h1>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded
            hover:bg-gray-100 dark:hover:bg-gray-800
            text-gray-500 dark:text-gray-400
            hover:text-gray-900 dark:hover:text-white
            transition-colors mx-auto"
        >
          {isCollapsed ? "▶" : "◀"}
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <Link 
          href="/dashboard"
          className={`w-full flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${pathname === "/dashboard" ? "bg-gray-200 dark:bg-gray-800" : ""}`}
        >
          <span className="text-xl text-gray-700 dark:text-gray-300">🏠</span>
          {!isCollapsed && <span className="ml-3 font-medium text-gray-700 dark:text-gray-200">Dashboard</span>}
        </Link>

        {/* New Campaign Button */}
        <button
          onClick={createNewCampaign}
          className={`w-full flex items-center justify-center bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${isCollapsed ? "px-0" : "px-4"}`}
        >
          <span className="text-lg">+</span>
          {!isCollapsed && <span className="ml-2">New Campaign</span>}
        </button>

        {/* History */}
        <div className="mt-8">
          {!isCollapsed && <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">History</h2>}
          <ul className="space-y-1">
            {campaigns?.map((camp) => (
              <li key={camp.id} className="flex items-center justify-between group">
                <Link
                  href={`/campaign/${camp.id}`}
                  className={`flex-1 text-left truncate p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${pathname === `/campaign/${camp.id}` ? "bg-gray-200 dark:bg-gray-800 text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {isCollapsed ? "💬" : camp.name}
                </Link>
                {!isCollapsed && (
                  <button 
                    onClick={(e) => deleteCampaign(e, camp.id)}
                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-xl">
            {!mounted
              ? "🌙"
              : resolvedTheme === "dark"
                ? "☀️"
                : "🌙"}
          </span>

          {!isCollapsed && (
            <span className="ml-3 text-gray-700 dark:text-gray-300">
              {!mounted
                ? "Dark Mode"
                : resolvedTheme === "dark"
                  ? "Light Mode"
                  : "Dark Mode"}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-xl">🚪</span>
          {!isCollapsed && (
            <span className="ml-3">
              Logout
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
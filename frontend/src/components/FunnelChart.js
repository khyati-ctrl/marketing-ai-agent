"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { useTheme } from "next-themes";

export default function FunnelChart({ stats }) {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const data = [
    {
      name: "Impressions",
      value: stats?.impressions || 0,
      color: "#F59E0B",
    },
    {
      name: "Clicks",
      value: stats?.total_clicks || 0,
      color: "#3B82F6",
    },
    {
      name: "Leads",
      value: stats?.total_leads || 0,
      color: "#8B5CF6",
    },
    {
      name: "Sales",
      value: stats?.total_sales || 0,
      color: "#10B981",
    },
  ];

  return (
    <div
      className="
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl
        shadow-sm
        h-[350px]
        flex flex-col p-6
        transition-colors duration-300
      "
    >
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Performance Funnel
        </h3>

        <span className="text-xs font-mono uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Live Metrics
        </span>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 20, bottom: 0 }}
          >
            <XAxis type="number" hide />

            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: isDark ? "#E5E7EB" : "#374151",
                fontSize: 12,
                fontWeight: 600,
              }}
            />

            <Tooltip
              cursor={{
                fill: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
              }}
              contentStyle={{
                backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                border: isDark
                  ? "1px solid #374151"
                  : "1px solid #E5E7EB",
                borderRadius: "12px",
                color: isDark ? "#FFFFFF" : "#111827",
              }}
            />

            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              barSize={40}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                />
              ))}

              <LabelList
                dataKey="value"
                position="right"
                fill={isDark ? "#D1D5DB" : "#374151"}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
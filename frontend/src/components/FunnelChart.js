"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

export default function FunnelChart({ stats }) {
  console.log("Chart Stats:", stats);
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
    <div className="bg-[#111827] p-8 rounded-2xl border border-gray-700/50 shadow-2xl h-[350px] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-gray-100 font-bold text-lg">Performance Funnel</h3>
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Live Metrics</span>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#D1D5DB', fontSize: 12, fontWeight: 600 }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px', color: '#fff' }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList dataKey="value" position="right" fill="#9CA3AF" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
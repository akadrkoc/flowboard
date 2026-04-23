"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { date: string; count: number }[];
  scopeLabel?: string;
}

export default function CompletedPerDay({ data, scopeLabel }: Props) {
  const title = scopeLabel ? `Cards Completed — ${scopeLabel}` : "Cards Completed";
  return (
    <div className="bg-[#fbf6ef] dark:bg-[#1e1e2e] rounded-xl border border-[#ead7c3] dark:border-white/[0.06] p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">
        {title}
      </h3>
      <div className="h-[180px] sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12121a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#a78bfa" }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

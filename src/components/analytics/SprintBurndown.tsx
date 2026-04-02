"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { day: string; remaining: number; ideal: number }[];
}

export default function SprintBurndown({ data }: Props) {
  return (
    <div className="bg-[#1e1e2e] rounded-xl border border-white/[0.06] p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">
        Sprint Burndown
      </h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
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
            />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#374151"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
              name="Ideal"
            />
            <Line
              type="monotone"
              dataKey="remaining"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 3 }}
              name="Remaining"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

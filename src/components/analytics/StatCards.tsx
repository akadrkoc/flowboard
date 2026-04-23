"use client";

import { Clock, Zap, CheckCircle2, TrendingUp } from "lucide-react";

interface Props {
  avgCycleTime: number;
  velocity: number;
  onTimeRate: number;
  totalCompleted: number;
  scopeLabel?: string;
}

// Display'de NaN/Infinity kaynakli bozuk gosterim olmasin diye sayi turuna
// normalize ediyoruz.
const safe = (v: number): number => (Number.isFinite(v) ? v : 0);

const cards = [
  {
    key: "cycleTime",
    label: "Avg Cycle Time",
    icon: Clock,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    format: (v: number) => `${safe(v).toFixed(1)}d`,
  },
  {
    key: "velocity",
    label: "Velocity",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    format: (v: number) => `${safe(v)} pts`,
  },
  {
    key: "onTimeRate",
    label: "On-Time Rate",
    icon: TrendingUp,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    format: (v: number) => `${safe(v)}%`,
  },
  {
    key: "totalCompleted",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    format: (v: number) => `${safe(v)}`,
  },
];

export default function StatCards({
  avgCycleTime,
  velocity,
  onTimeRate,
  totalCompleted,
  scopeLabel,
}: Props) {
  const values: Record<string, number> = {
    cycleTime: avgCycleTime,
    velocity,
    onTimeRate,
    totalCompleted,
  };

  return (
    <div className="space-y-2">
      {scopeLabel && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          Scope: <span className="font-medium text-gray-700 dark:text-gray-300">{scopeLabel}</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="bg-[#fbf6ef] dark:bg-[#1e1e2e] rounded-xl border border-[#ead7c3] dark:border-white/[0.06] p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
                {card.label}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {card.format(values[card.key])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

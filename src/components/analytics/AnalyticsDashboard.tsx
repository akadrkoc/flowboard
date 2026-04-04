"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import CompletedPerDay from "./CompletedPerDay";
import CardsByMember from "./CardsByMember";
import SprintBurndown from "./SprintBurndown";
import StatCards from "./StatCards";

export default function AnalyticsDashboard() {
  const columns = useBoardStore((s) => s.columns);
  const activeSprint = useBoardStore((s) => s.activeSprint);

  const allCards = useMemo(
    () => columns.flatMap((col) => col.cards),
    [columns]
  );

  const lastColumn = columns[columns.length - 1];
  const doneCards = lastColumn?.cards || [];

  // --- Completed per Day (son 14 gün, gerçek completedAt verisinden) ---
  const completedPerDay = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();

    // completedAt'i olan tüm kartları bul (hangi kolonda olursa olsun)
    const completedCards = allCards.filter((c) => c.completedAt);

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const count = completedCards.filter((c) => {
        const completedDate = new Date(c.completedAt!).toISOString().slice(0, 10);
        return completedDate === dayStr;
      }).length;

      days.push({ date: label, count });
    }

    return days;
  }, [allCards]);

  // --- Cards by Member ---
  const cardsByMember = useMemo(() => {
    const map = new Map<string, number>();
    allCards.forEach((card) => {
      const name = card.assigneeInitials || "Unassigned";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allCards]);

  // --- Sprint Burndown (uses active sprint dates if available) ---
  const burndownData = useMemo(() => {
    const totalPoints = allCards.reduce((sum, c) => sum + c.storyPoints, 0);
    const data: { day: string; remaining: number; ideal: number }[] = [];
    const completedCards = allCards.filter((c) => c.completedAt);

    let sprintStart: Date;
    let sprintEnd: Date;
    let sprintDays: number;

    if (activeSprint?.startDate && activeSprint?.endDate) {
      sprintStart = new Date(activeSprint.startDate);
      sprintEnd = new Date(activeSprint.endDate);
      sprintDays = Math.max(1, Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      const now = new Date();
      sprintDays = 10;
      sprintStart = new Date(now);
      sprintStart.setDate(sprintStart.getDate() - sprintDays);
      sprintEnd = now;
    }

    for (let i = 0; i <= sprintDays; i++) {
      const ideal = Math.round(totalPoints - (totalPoints / sprintDays) * i);

      const dayEnd = new Date(sprintStart);
      dayEnd.setDate(dayEnd.getDate() + i);
      dayEnd.setHours(23, 59, 59, 999);

      const pointsBurned = completedCards
        .filter((c) => new Date(c.completedAt!) <= dayEnd)
        .reduce((sum, c) => sum + c.storyPoints, 0);

      data.push({
        day: `Day ${i}`,
        remaining: Math.max(0, totalPoints - pointsBurned),
        ideal: Math.max(0, ideal),
      });
    }

    return data;
  }, [allCards, activeSprint]);

  // --- Stat Cards ---
  const totalCompleted = doneCards.length;
  const velocity = doneCards.reduce((sum, c) => sum + c.storyPoints, 0);
  // Gerçek cycle time: completedAt - createdAt ortalaması (gün cinsinden)
  const avgCycleTime = useMemo(() => {
    const cardsWithBothDates = allCards.filter((c) => c.completedAt && c.createdAt);
    if (cardsWithBothDates.length === 0) return 0;

    const totalDays = cardsWithBothDates.reduce((sum, c) => {
      const created = new Date(c.createdAt!).getTime();
      const completed = new Date(c.completedAt!).getTime();
      return sum + (completed - created) / (1000 * 60 * 60 * 24);
    }, 0);

    return Math.round((totalDays / cardsWithBothDates.length) * 10) / 10;
  }, [allCards]);
  const onTimeRate = totalCompleted > 0 ? Math.round((totalCompleted / Math.max(allCards.length, 1)) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <StatCards
        avgCycleTime={avgCycleTime}
        velocity={velocity}
        onTimeRate={onTimeRate}
        totalCompleted={totalCompleted}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompletedPerDay data={completedPerDay} />
        <CardsByMember data={cardsByMember} />
      </div>
      <SprintBurndown data={burndownData} />
    </div>
  );
}

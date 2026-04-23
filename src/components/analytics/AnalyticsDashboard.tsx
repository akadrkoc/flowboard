"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import CompletedPerDay from "./CompletedPerDay";
import CardsByMember from "./CardsByMember";
import SprintBurndown from "./SprintBurndown";
import StatCards from "./StatCards";

// Sayi turune zorlama, NaN halinde 0 done.
function safeNumber(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(
    1,
    Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000)
  );
}

export default function AnalyticsDashboard() {
  const columns = useBoardStore((s) => s.columns);
  const activeSprint = useBoardStore((s) => s.activeSprint);

  const allCards = useMemo(
    () => columns.flatMap((col) => col.cards),
    [columns]
  );

  // ---------- Zaman araligi ----------
  // Aktif sprint varsa onun [start, end] araligini; yoksa son 14 gunu kullan.
  // Sprint gelecekte ya da gecmiste de olabilir; ideal cizgisini burada
  // gercekten hesaplayabilmek icin start <= end varsayiyoruz.
  const range = useMemo(() => {
    if (activeSprint?.startDate && activeSprint?.endDate) {
      const start = startOfDay(new Date(activeSprint.startDate));
      const end = endOfDay(new Date(activeSprint.endDate));
      return {
        start,
        end,
        days: daysBetween(start, end),
        isSprint: true,
        label: activeSprint.name,
      };
    }
    const end = endOfDay(new Date());
    const start = startOfDay(new Date(Date.now() - 13 * 86_400_000));
    return {
      start,
      end,
      days: 14,
      isSprint: false,
      label: "Last 14 days",
    };
  }, [activeSprint]);

  const completedInRange = useMemo(
    () =>
      allCards.filter((c) => {
        if (!c.completedAt) return false;
        const t = new Date(c.completedAt).getTime();
        return t >= range.start.getTime() && t <= range.end.getTime();
      }),
    [allCards, range]
  );

  // ---------- Completed per day ----------
  // Gun sayisi abartiya kacmasin diye 60 gun ust sinir koyuyoruz;
  // 3-4 haftadan uzun sprint'leri destekler ama sinirsiz degil.
  const completedPerDay = useMemo(() => {
    const result: { date: string; count: number }[] = [];
    const totalDays = Math.min(range.days, 60);

    for (let i = totalDays - 1; i >= 0; i--) {
      const day = new Date(range.end);
      day.setDate(day.getDate() - i);
      const key = startOfDay(day).toISOString().slice(0, 10);
      const label = day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const count = completedInRange.filter(
        (c) =>
          startOfDay(new Date(c.completedAt!)).toISOString().slice(0, 10) ===
          key
      ).length;
      result.push({ date: label, count });
    }

    return result;
  }, [completedInRange, range]);

  // ---------- Cards by Member ----------
  // Workload: board genelinde aktif kartlar. Son kolondakileri (Done)
  // sayim disi birakalim ki "kimin uzerinde ne var" gercek anlamda cikar.
  const cardsByMember = useMemo(() => {
    const lastColId = columns[columns.length - 1]?.id;
    const activeCards = columns
      .filter((col) => col.id !== lastColId)
      .flatMap((col) => col.cards);
    const map = new Map<string, number>();
    activeCards.forEach((card) => {
      const name = card.assigneeInitials || "Unassigned";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [columns]);

  // ---------- Burndown ----------
  // Aktif sprint yoksa gosterilecek veri hazirlamiyoruz; UI empty state cizecek.
  const burndownData = useMemo(() => {
    if (!range.isSprint) return [];

    const totalPoints = allCards.reduce((sum, c) => sum + safeNumber(c.storyPoints), 0);
    const data: { day: string; remaining: number; ideal: number }[] = [];
    const todayStart = startOfDay(new Date()).getTime();

    for (let i = 0; i <= range.days; i++) {
      const dayEnd = new Date(range.start);
      dayEnd.setDate(dayEnd.getDate() + i);
      dayEnd.setHours(23, 59, 59, 999);

      // Ideal dogrusu lineer: her gun totalPoints / sprintDays kadar burn.
      const ideal = Math.max(0, Math.round(totalPoints - (totalPoints / range.days) * i));

      let remaining: number;
      if (dayEnd.getTime() > todayStart + 86_399_999) {
        // Gelecek gunler icin henuz bir burn olmadi; remaining bugunku
        // remaining ile sabitlensin (duz cizgi olarak gorunsun, yoksa
        // kullaniciyi "sprint tamamlandi" illuzyonu ile yanilatabilir).
        const burnedToToday = allCards
          .filter((c) => {
            if (!c.completedAt) return false;
            const t = new Date(c.completedAt).getTime();
            return t >= range.start.getTime() && t <= todayStart + 86_399_999;
          })
          .reduce((sum, c) => sum + safeNumber(c.storyPoints), 0);
        remaining = Math.max(0, totalPoints - burnedToToday);
      } else {
        const burned = allCards
          .filter((c) => {
            if (!c.completedAt) return false;
            const t = new Date(c.completedAt).getTime();
            // Sadece sprint baslangicindan sonra tamamlanmalar burndown'a dahil.
            return t >= range.start.getTime() && t <= dayEnd.getTime();
          })
          .reduce((sum, c) => sum + safeNumber(c.storyPoints), 0);
        remaining = Math.max(0, totalPoints - burned);
      }

      data.push({
        day: `Day ${i + 1}`,
        remaining,
        ideal,
      });
    }

    return data;
  }, [allCards, range]);

  // ---------- Stat cards ----------
  const velocity = useMemo(
    () => completedInRange.reduce((sum, c) => sum + safeNumber(c.storyPoints), 0),
    [completedInRange]
  );

  const totalCompleted = completedInRange.length;

  // On-Time Rate: dueDate'i olan ve bu aralikta tamamlanan kartlardan,
  // completedAt <= dueDate olanlarin orani. Boyle kartlar yoksa N/A (0).
  const onTimeRate = useMemo(() => {
    const withDue = completedInRange.filter((c) => c.dueDate);
    if (withDue.length === 0) return 0;
    const onTime = withDue.filter((c) => {
      const completed = new Date(c.completedAt!).getTime();
      // dueDate "YYYY-MM-DD" formatinda; gunun sonuna kadar toleransli sayalim.
      const due = endOfDay(new Date(c.dueDate + "T00:00:00")).getTime();
      return completed <= due;
    }).length;
    return Math.round((onTime / withDue.length) * 100);
  }, [completedInRange]);

  const avgCycleTime = useMemo(() => {
    const durations: number[] = [];
    for (const c of completedInRange) {
      if (!c.createdAt || !c.completedAt) continue;
      const created = new Date(c.createdAt).getTime();
      const completed = new Date(c.completedAt).getTime();
      // Invalid Date, negatif veya NaN degerleri atla.
      if (!Number.isFinite(created) || !Number.isFinite(completed)) continue;
      const days = (completed - created) / 86_400_000;
      if (!Number.isFinite(days) || days < 0) continue;
      durations.push(days);
    }
    if (durations.length === 0) return 0;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return Math.round(avg * 10) / 10;
  }, [completedInRange]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
      <StatCards
        avgCycleTime={avgCycleTime}
        velocity={velocity}
        onTimeRate={onTimeRate}
        totalCompleted={totalCompleted}
        scopeLabel={range.label}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <CompletedPerDay data={completedPerDay} scopeLabel={range.label} />
        <CardsByMember data={cardsByMember} />
      </div>
      <SprintBurndown
        data={burndownData}
        isActiveSprint={range.isSprint}
        sprintName={range.isSprint ? range.label : null}
      />
    </div>
  );
}

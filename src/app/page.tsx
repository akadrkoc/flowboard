"use client";

import Navbar from "@/components/Navbar";
import Board from "@/components/Board";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-[#16161e] text-white">
      <Navbar />
      <Board />
      <StatsBar />
    </div>
  );
}

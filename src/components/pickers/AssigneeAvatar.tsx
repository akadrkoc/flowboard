"use client";

import { UserX } from "lucide-react";
import type { AssigneeOption } from "./types";

interface AssigneeAvatarProps {
  option: AssigneeOption;
  size?: "sm" | "md";
}

export function AssigneeAvatar({ option, size = "sm" }: AssigneeAvatarProps) {
  const dim = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "sm" ? "text-[8px]" : "text-[9px]";

  if (option.unassigned) {
    return (
      <span
        className={`${dim} rounded-full bg-[#dce0d9] dark:bg-white/[0.08] flex items-center justify-center border border-dashed border-gray-400/60 dark:border-white/20`}
      >
        <UserX
          className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} text-gray-500 dark:text-gray-400`}
        />
      </span>
    );
  }

  if (option.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={option.image}
        alt={option.name}
        referrerPolicy="no-referrer"
        className={`${dim} rounded-full`}
      />
    );
  }

  return (
    <span
      className={`${dim} rounded-full ${option.color} flex items-center justify-center`}
    >
      <span className={`${textSize} font-bold text-white`}>
        {option.initials || "?"}
      </span>
    </span>
  );
}

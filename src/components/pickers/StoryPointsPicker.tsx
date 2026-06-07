"use client";

const STORY_POINTS = [1, 2, 3, 5, 8] as const;

interface StoryPointsPickerProps {
  value: number;
  onChange: (points: number) => void;
  size?: "sm" | "md";
}

export function StoryPointsPicker({
  value,
  onChange,
  size = "sm",
}: StoryPointsPickerProps) {
  const dim = size === "sm" ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-[11px]";

  return (
    <div className="flex items-center gap-1">
      {STORY_POINTS.map((pt) => (
        <button
          key={pt}
          type="button"
          onClick={() => onChange(pt)}
          title={`${pt} story point(s)`}
          className={`${dim} rounded font-medium transition-colors ${
            value === pt
              ? "bg-[#ead7c3] dark:bg-white/10 text-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05]"
          }`}
        >
          {pt}
        </button>
      ))}
    </div>
  );
}

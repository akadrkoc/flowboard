export const COLUMN_STATUS_STYLES = [
  {
    dot: "bg-blue-500",
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  {
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  {
    dot: "bg-violet-500",
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  },
  {
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  {
    dot: "bg-rose-500",
    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
  {
    dot: "bg-cyan-500",
    chip: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  },
] as const;

export function getColumnStatusStyle(index: number) {
  return COLUMN_STATUS_STYLES[index % COLUMN_STATUS_STYLES.length];
}

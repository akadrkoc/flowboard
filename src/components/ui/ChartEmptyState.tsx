interface ChartEmptyStateProps {
  title: string;
  description: string;
}

export default function ChartEmptyState({
  title,
  description,
}: ChartEmptyStateProps) {
  return (
    <div className="h-[180px] sm:h-[220px] flex flex-col items-center justify-center text-center gap-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  );
}

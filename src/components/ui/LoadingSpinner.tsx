interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export default function LoadingSpinner({
  label = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
        aria-hidden
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

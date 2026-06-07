import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white px-4">
      <h1 className="text-2xl font-bold mb-2">404</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        This page could not be found.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors"
      >
        Back to board
      </Link>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-50" />
        <span className="relative block h-10 w-10 rounded-full bg-green-500" />
      </div>
      <p className="text-sm font-medium text-green-700 dark:text-green-300">กำลังโหลด...</p>
    </div>
  );
}

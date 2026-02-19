const SP_COLORS: Record<string, string> = {
  A: "#c0392b",
  F1: "#2980b9",
  F2: "#27ae60",
  M2: "#8e44ad",
};

export default function SpLevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return null;
  return (
    <span
      className="shrink-0 rounded px-1 py-0.5 text-[8px] font-bold text-white"
      style={{ background: SP_COLORS[level] ?? "#7f8c8d" }}
    >
      {level}
    </span>
  );
}

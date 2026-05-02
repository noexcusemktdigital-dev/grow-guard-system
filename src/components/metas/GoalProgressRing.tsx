import { memo } from "react";

interface GoalProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

export const GoalProgressRing = memo(function GoalProgressRing({ percent, size = 56, strokeWidth = 5 }: GoalProgressRingProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 100 ? "hsl(142 76% 36%)" :
    clamped >= 80 ? "hsl(142 76% 36%)" :
    clamped >= 50 ? "hsl(45 93% 47%)" :
    "hsl(0 84% 60%)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums" style={{ color }}>
        {Math.round(clamped)}%
      </span>
    </div>
  );
});

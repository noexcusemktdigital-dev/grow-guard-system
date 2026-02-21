interface TopSwitchProps {
  active: string;
  onChange: (level: string) => void;
}

const levels = ["FRANQUEADORA", "FRANQUEADO", "CLIENTE FINAL"];

export function TopSwitch({ active, onChange }: TopSwitchProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted/60 p-1 border border-border/50">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`
            relative px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-300
            ${active === level
              ? "bg-foreground text-background shadow-md"
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          {level}
        </button>
      ))}
    </div>
  );
}

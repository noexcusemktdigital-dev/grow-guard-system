interface TopSwitchProps {
  active: string;
  onChange: (level: string) => void;
}

const levels = ["FRANQUEADORA", "FRANQUEADO", "CLIENTE FINAL"];

export function TopSwitch({ active, onChange }: TopSwitchProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`
            px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200
            ${active === level
              ? "bg-foreground text-background shadow-lg"
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

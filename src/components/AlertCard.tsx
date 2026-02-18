import { AlertTriangle, Info, Clock } from "lucide-react";

interface AlertCardProps {
  type: "warning" | "info" | "clock";
  message: string;
}

const icons = {
  warning: AlertTriangle,
  info: Info,
  clock: Clock,
};

export function AlertCard({ type, message }: AlertCardProps) {
  const Icon = icons[type];
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      type === "warning" ? "border-chart-orange/30 bg-chart-orange/5" :
      type === "clock" ? "border-chart-blue/30 bg-chart-blue/5" :
      "border-primary/30 bg-primary/5"
    }`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
        type === "warning" ? "text-chart-orange" :
        type === "clock" ? "text-chart-blue" :
        "text-primary"
      }`} />
      <span className="text-sm text-foreground/80">{message}</span>
    </div>
  );
}

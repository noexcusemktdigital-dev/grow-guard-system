// @ts-nocheck
// Lazy-loaded to keep recharts out of FranqueadoDiagnostico critical path.
// PERF-WARN-02: chart only shown when answeredQuestions > 0.
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface DiagnosticoChartProps {
  data: { category: string; value: number; fullMark: number }[];
}

export default function FranqueadoDiagnosticoChart({ data }: DiagnosticoChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

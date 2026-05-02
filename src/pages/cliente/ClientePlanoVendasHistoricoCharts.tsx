// @ts-nocheck
// Lazy-loaded: recharts chunk loads only when user clicks a history item (Dialog opens).
// PERF-WARN-01: dialog is triggered on user interaction, not on initial render.
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface HistoricoChartsProps {
  radarData: { category: string; value: number }[];
}

export default function ClientePlanoVendasHistoricoCharts({ radarData }: HistoricoChartsProps) {
  return (
    <>
      <Card>
        <CardContent className="py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">RADAR POR ÁREA</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="65%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">SCORE POR CATEGORIA</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                <RechartsTooltip formatter={(v: number) => [`${v}%`, "Score"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {radarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value >= 70 ? "hsl(var(--chart-3))" : entry.value >= 40 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

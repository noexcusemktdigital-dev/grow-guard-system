import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const niveis = [
  { id: 1, label: "Caótico", range: "0-25%", cor: "#dc2626" },
  { id: 2, label: "Reativo", range: "26-50%", cor: "#ea580c" },
  { id: 3, label: "Estruturado", range: "51-75%", cor: "#eab308" },
  { id: 4, label: "Analítico", range: "76-100%", cor: "#16a34a" },
];

interface Props {
  pontuacao: number;
  nivel: { id: number; label: string; cor: string; desc: string };
}

export const DiagnosticoTermometro = memo(function DiagnosticoTermometro({ pontuacao, nivel }: Props) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-6">
        {/* Score */}
        <div className="text-center mb-6">
          <p className="text-5xl font-black" style={{ color: nivel.cor }}>{pontuacao}%</p>
          <Badge className="mt-2 text-sm px-4 py-1 text-white" style={{ backgroundColor: nivel.cor }}>
            {String(nivel.id).padStart(2, "0")} — {nivel.label.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">{nivel.desc}</p>
        </div>

        {/* Termômetro visual */}
        <div className="relative">
          <div className="h-6 rounded-full overflow-hidden" style={{ background: "linear-gradient(90deg, #dc2626 0%, #ea580c 33%, #eab308 66%, #16a34a 100%)" }}>
            {/* Ponteiro */}
            <div
              className="absolute top-0 w-1 h-6 bg-foreground rounded-full shadow-lg transition-all duration-500"
              style={{ left: `${Math.min(Math.max(pontuacao, 2), 98)}%`, transform: "translateX(-50%)" }}
            />
          </div>
          {/* Marcadores */}
          <div className="flex justify-between mt-2">
            {niveis.map(n => (
              <div key={n.id} className={`text-center flex-1 ${nivel.id === n.id ? "opacity-100" : "opacity-40"}`}>
                <div className="w-0.5 h-2 mx-auto mb-1" style={{ backgroundColor: n.cor }} />
                <p className="text-[10px] font-bold" style={{ color: n.cor }}>{n.label}</p>
                <p className="text-[9px] text-muted-foreground">{n.range}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

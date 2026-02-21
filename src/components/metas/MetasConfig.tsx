import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Building2, Target, Settings, Eye } from "lucide-react";
import { pointsConfig, levelThresholds, type PointsConfig } from "@/data/metasRankingData";

export default function MetasConfig() {
  const [config, setConfig] = useState<PointsConfig>({ ...pointsConfig });
  const [showRanking, setShowRanking] = useState(true);

  const pointsCards = [
    { label: "Cada R$1.000 faturado", field: "revenuePerThousand" as const, value: config.revenuePerThousand, icon: DollarSign, color: "text-emerald-500", suffix: "pontos" },
    { label: "Cada novo contrato", field: "contractPoints" as const, value: config.contractPoints, icon: FileText, color: "text-blue-500", suffix: "pontos" },
    { label: "Cada franquia vendida", field: "franchiseSalePoints" as const, value: config.franchiseSalePoints, icon: Building2, color: "text-purple-500", suffix: "pontos" },
    { label: "Bônus meta batida", field: "goalBonusPoints" as const, value: config.goalBonusPoints, icon: Target, color: "text-amber-500", suffix: "pontos" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="w-5 h-5" /> Configurações</h3>
        <p className="text-sm text-muted-foreground">Pesos de pontuação, níveis e regras gerais</p>
      </div>

      {/* Points Config */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Pesos de Pontuação</h4>
        <div className="grid sm:grid-cols-2 gap-4">
          {pointsCards.map(card => {
            const Icon = card.icon;
            return (
              <Card key={card.field} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    <span className="text-sm font-medium">{card.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={card.value}
                      onChange={e => setConfig(prev => ({ ...prev, [card.field]: Number(e.target.value) }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{card.suffix}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Levels Config */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Níveis de Franquia</h4>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {levelThresholds.map(lvl => {
                const Icon = lvl.icon;
                return (
                  <div key={lvl.level} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${lvl.gradient}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{lvl.level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Mín:</Label>
                      <Input type="number" defaultValue={lvl.minPoints} className="w-24 h-8 text-sm" />
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* General Rules */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Regras Gerais</h4>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ranking visível para franqueados</p>
                  <p className="text-xs text-muted-foreground">Franqueados podem ver o ranking completo</p>
                </div>
              </div>
              <Switch checked={showRanking} onCheckedChange={setShowRanking} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Período de cálculo</p>
                <p className="text-xs text-muted-foreground">Frequência de atualização do ranking</p>
              </div>
              <Badge variant="secondary">Mensal</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Desempate</p>
                <p className="text-xs text-muted-foreground">Critério quando pontos são iguais</p>
              </div>
              <Badge variant="secondary">Maior faturamento</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

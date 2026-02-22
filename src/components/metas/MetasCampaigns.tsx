import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Zap, Clock, Trophy, Calendar, Gift, CheckCircle } from "lucide-react";
import { goalTypeConfig, formatBRL, mockCampaigns, getRankingForMonth, type Campaign } from "@/types/metas";

export default function MetasCampaigns() {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const active = campaigns.filter(c => c.status === "active");
  const finished = campaigns.filter(c => c.status === "finished");
  const ranking = getRankingForMonth("2026-02");

  function getDaysLeft(endDate: string) {
    const end = new Date(endDate);
    const now = new Date("2026-02-21");
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  function getCampaignProgress(campaign: Campaign) {
    const totalRevenue = ranking.reduce((s, r) => s + r.revenue, 0);
    return Math.min((totalRevenue / campaign.targetValue) * 100, 100);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campanhas & Premiações</h3>
          <p className="text-sm text-muted-foreground">{active.length} campanha ativa · {finished.length} finalizadas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Nova Campanha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome da Campanha</Label><Input placeholder="Ex: Desafio Março" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início</Label><Input type="date" /></div>
                <div><Label>Fim</Label><Input type="date" /></div>
              </div>
              <div><Label>Tipo de Meta</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(goalTypeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor Alvo</Label><Input type="number" placeholder="50000" /></div>
              <div><Label>Premiação</Label><Textarea placeholder="Descreva os prêmios por posição..." /></div>
              <Button className="w-full">Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Campaign */}
      {active.map(campaign => {
        const config = goalTypeConfig[campaign.goalType];
        const Icon = config.icon;
        const daysLeft = getDaysLeft(campaign.periodEnd);
        const progress = getCampaignProgress(campaign);
        const top3 = ranking.slice(0, 3);

        return (
          <Card key={campaign.id} className="overflow-hidden border-2 border-primary/20">
            <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{campaign.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {campaign.periodStart} → {campaign.periodEnd}</span>
                      <Badge variant="default" className="gap-1"><Clock className="w-3 h-3" /> {daysLeft} dias restantes</Badge>
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30" variant="outline">ATIVA</Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progresso da Rede</span>
                      <span className="font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">Meta: {formatBRL(campaign.targetValue)}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-sm">Premiação</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{campaign.rewardDescription}</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Ranking da Campanha</p>
                  <div className="space-y-2">
                    {top3.map((f, i) => (
                      <div key={f.franchiseId} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                        <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{f.franchiseName}</p>
                        </div>
                        <span className="font-bold text-sm">{formatBRL(f.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Finished Campaigns */}
      {finished.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">Campanhas Finalizadas</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {finished.map(campaign => (
              <Card key={campaign.id} className="opacity-80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.periodStart} → {campaign.periodEnd}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] gap-1"><CheckCircle className="w-3 h-3" /> Finalizada</Badge>
                  </div>
                  {campaign.winnerName && (
                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Vencedor: {campaign.winnerName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { Share2, Link } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";

const networks = [
  { name: "Instagram", icon: "📸", followers: "12.5k", engagement: "4.2%", reach: "8.3k", color: "from-pink-500/10 to-purple-500/10" },
  { name: "Facebook", icon: "👤", followers: "8.2k", engagement: "2.1%", reach: "5.1k", color: "from-blue-500/10 to-blue-600/10" },
  { name: "LinkedIn", icon: "💼", followers: "3.8k", engagement: "5.7%", reach: "2.9k", color: "from-sky-500/10 to-sky-600/10" },
];

export default function ClienteRedesSociais() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Redes Sociais"
        subtitle="Dashboard de performance nas redes"
        icon={<Share2 className="w-5 h-5 text-primary" />}
        badge="Em breve"
      />

      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
        <Link className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Integração com APIs das redes sociais em breve. Dados abaixo são ilustrativos.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {networks.map(n => (
          <Card key={n.name} className={`bg-gradient-to-br ${n.color} hover:shadow-md transition-all`}>
            <CardContent className="py-6 text-center">
              <span className="text-3xl">{n.icon}</span>
              <p className="text-sm font-bold mt-2">{n.name}</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div><p className="text-lg font-black">{n.followers}</p><p className="text-[10px] text-muted-foreground">Seguidores</p></div>
                <div><p className="text-lg font-black text-primary">{n.engagement}</p><p className="text-[10px] text-muted-foreground">Engajamento</p></div>
                <div><p className="text-lg font-black">{n.reach}</p><p className="text-[10px] text-muted-foreground">Alcance</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

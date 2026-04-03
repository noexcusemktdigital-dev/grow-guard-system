import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import type { ElementType } from "react";

interface Insight {
  label: string;
  type: "urgent" | "warning" | "info";
  path: string;
  icon: ElementType;
}

interface Announcement {
  id: string;
  title: string;
  content?: string;
  priority?: string;
  published_at?: string;
  status?: string;
}

interface ClienteInicioAlertsProps {
  insights: Insight[];
  unreadAnnouncements: Announcement[];
}

export function ClienteInicioAlerts({ insights, unreadAnnouncements }: ClienteInicioAlertsProps) {
  const navigate = useNavigate();

  if (insights.length === 0 && unreadAnnouncements.length === 0) return null;

  return (
    <>
      {/* Insights alerts */}
      {insights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(insight.path)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  insight.type === "urgent"
                    ? "bg-destructive/5 border-destructive/15 hover:bg-destructive/10"
                    : insight.type === "warning"
                    ? "bg-amber-500/5 border-amber-500/15 hover:bg-amber-500/10"
                    : "bg-blue-500/5 border-blue-500/15 hover:bg-blue-500/10"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  insight.type === "urgent" ? "text-destructive" : insight.type === "warning" ? "text-amber-500" : "text-blue-500"
                }`} />
                <span className={`text-xs font-medium ${
                  insight.type === "urgent" ? "text-destructive" : insight.type === "warning" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                }`}>{insight.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Announcement alerts */}
      {unreadAnnouncements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          {unreadAnnouncements.map((ann) => (
            <Card key={ann.id} className={`border-l-4 ${ann.priority === "critical" ? "border-l-destructive bg-destructive/5" : ann.priority === "high" ? "border-l-amber-500 bg-amber-500/5" : "border-l-primary bg-primary/5"}`}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <Megaphone className={`w-4 h-4 shrink-0 ${ann.priority === "critical" ? "text-destructive" : ann.priority === "high" ? "text-amber-500" : "text-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ann.title}</p>
                  {ann.content && <p className="text-xs text-muted-foreground line-clamp-1">{ann.content}</p>}
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">Comunicado</Badge>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </>
  );
}

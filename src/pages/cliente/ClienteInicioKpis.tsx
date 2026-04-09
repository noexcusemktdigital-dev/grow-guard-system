// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ElementType } from "react";

interface KpiConfigItem {
  label: string;
  icon: ElementType;
  gradient: string;
  iconColor: string;
  path: string;
}

interface KpiValue {
  value: string;
  rawValue: number;
  sublabel: string;
  trend: "up" | "down" | "neutral";
}

interface ClienteInicioKpisProps {
  kpiConfig: KpiConfigItem[];
  kpiValues: KpiValue[];
  leadsLoading: boolean;
}

export function ClienteInicioKpis({ kpiConfig, kpiValues, leadsLoading }: ClienteInicioKpisProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpiConfig.map((cfg, i) => {
        const kpi = kpiValues[i];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={cfg.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          >
            <Card
              className={`hover-scale bg-gradient-to-br ${cfg.gradient} border-0 shadow-sm cursor-pointer group transition-all duration-300 hover:shadow-md`}
              onClick={() => navigate(cfg.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{cfg.label}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.iconColor} bg-background/60 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {leadsLoading ? <Skeleton className="h-7 w-24" /> : kpi.value}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                  {kpi.trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
                  <span className={`text-[11px] font-medium ${kpi.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : kpi.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
                    {kpi.sublabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

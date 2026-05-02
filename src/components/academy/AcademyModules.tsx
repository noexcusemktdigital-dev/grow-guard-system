import { useState } from "react";
import { BookOpen, Clock, Play, ArrowRight, TrendingUp, Target, Building2, Package, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AcademyModuleCategory } from "@/types/academy";
import { categoryGradients, categoryColors } from "@/types/academy";
import { useAcademyModules, useAcademyLessons, useAcademyProgress, computeModuleProgress } from "@/hooks/useAcademy";

const categoryFilters: (AcademyModuleCategory | "Todos")[] = ["Todos", "Comercial", "Estrategia", "Institucional", "Produtos"];

const categoryIcons: Record<string, React.ElementType> = {
  Comercial: TrendingUp,
  Estrategia: Target,
  Institucional: Building2,
  Produtos: Package,
};

const chipColors: Record<string, string> = {
  Todos: "bg-muted text-foreground",
  Comercial: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Estrategia: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  Institucional: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Produtos: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
};

const badgeColors: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  emerald: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  orange: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
};

interface Props {
  onSelectModule: (moduleId: string) => void;
}

export function AcademyModules({ onSelectModule }: Props) {
  const [filter, setFilter] = useState<AcademyModuleCategory | "Todos">("Todos");
  const { data: modules = [] } = useAcademyModules();
  const { data: allLessons = [] } = useAcademyLessons();
  const { data: progress = [] } = useAcademyProgress();

  const publishedModules = modules.filter(m => m.is_published);
  const filtered = filter === "Todos" ? publishedModules : publishedModules.filter(m => m.category === filter);

  const getCategoryCount = (cat: string) => publishedModules.filter(m => m.category === cat).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filter pills with icon + count */}
      <div className="flex gap-2 flex-wrap">
        {categoryFilters.map((cat) => {
          const count = cat === "Todos" ? publishedModules.length : getCategoryCount(cat);
          const CatIcon = cat !== "Todos" ? categoryIcons[cat] : null;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                filter === cat ? chipColors[cat] + " ring-1 ring-current shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {CatIcon && <CatIcon className="w-3.5 h-3.5" />}
              {cat}
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Modules — horizontal cards */}
      <div className="space-y-3">
        {filtered.map((mod) => {
          const modProgress = computeModuleProgress(mod.id, allLessons, progress);
          const color = categoryColors[(mod.category as AcademyModuleCategory) ?? "Comercial"];
          const gradient = categoryGradients[(mod.category as AcademyModuleCategory) ?? "Comercial"];
          const CatIcon = categoryIcons[mod.category ?? ""] || BookOpen;
          const isComplete = modProgress === 100;
          const lessonsCount = allLessons.filter(l => l.module_id === mod.id).length;
          const estimatedHours = Math.round(allLessons.filter(l => l.module_id === mod.id).reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0) / 60 * 10) / 10;

          return (
            <Card
              key={mod.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.005] group flex flex-col md:flex-row"
              onClick={() => onSelectModule(mod.id)}
            >
              {/* Left gradient panel with icon */}
              <div className={`relative w-full md:w-44 h-28 md:h-auto bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                <CatIcon className="w-10 h-10 text-white/80" />
                {isComplete && (
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
                <Badge className={`absolute top-2 left-2 ${badgeColors[color]} border text-[10px]`}>
                  {mod.category}
                </Badge>
              </div>

              {/* Right content */}
              <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base leading-tight mb-1">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{mod.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {lessonsCount} aulas</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{estimatedHours}h</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Progress circle */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke={isComplete ? "hsl(142, 71%, 45%)" : "hsl(var(--primary))"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(modProgress / 100) * 100.5} 100.5`} className="transition-all duration-500" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{modProgress}%</span>
                  </div>

                  <div className="flex-1" />

                  <Button
                    size="sm"
                    className="gap-2 group-hover:gap-3 transition-all"
                    variant={modProgress > 0 ? "default" : "outline"}
                  >
                    {modProgress > 0 ? (
                      <><Play className="w-3.5 h-3.5" /> Continuar</>
                    ) : (
                      <><ArrowRight className="w-3.5 h-3.5" /> Iniciar</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

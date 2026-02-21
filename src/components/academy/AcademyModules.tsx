import { useState } from "react";
import { BookOpen, Clock, Play, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  type AcademyModule,
  type AcademyModuleCategory,
  mockModules,
  getModuleProgress,
  categoryGradients,
  categoryColors,
} from "@/data/academyData";

const categoryFilters: (AcademyModuleCategory | "Todos")[] = ["Todos", "Comercial", "Estrategia", "Institucional", "Produtos"];

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

  const filtered = filter === "Todos" ? mockModules.filter(m => m.status === "published") : mockModules.filter((m) => m.category === filter && m.status === "published");

  return (
    <div className="space-y-5">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {categoryFilters.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === cat ? chipColors[cat] + " ring-1 ring-current" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((mod) => {
          const progress = getModuleProgress(mod.id);
          const color = categoryColors[mod.category];
          const gradient = categoryGradients[mod.category];

          return (
            <Card
              key={mod.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] group"
              onClick={() => onSelectModule(mod.id)}
            >
              {/* Cover gradient */}
              <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-end p-4`}>
                <Badge className={`absolute top-3 right-3 ${badgeColors[color]} border text-[10px]`}>
                  {mod.category}
                </Badge>
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">{mod.title}</h3>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{mod.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {mod.lessonsCount} aulas</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{mod.estimatedHours}h</span>
                  <span>{mod.version}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <Button
                  size="sm"
                  className="w-full gap-2 group-hover:gap-3 transition-all"
                  variant={progress > 0 ? "default" : "outline"}
                >
                  {progress > 0 ? (
                    <><Play className="w-3.5 h-3.5" /> Continuar</>
                  ) : (
                    <><ArrowRight className="w-3.5 h-3.5" /> Iniciar</>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

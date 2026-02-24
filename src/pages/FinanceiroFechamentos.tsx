import { useState } from "react";
import { Inbox, Upload, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFinanceClosings } from "@/hooks/useFinance";

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function FinanceiroFechamentos() {
  const { data: closings, isLoading } = useFinanceClosings();

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="page-header-title">Fechamentos (DRE)</h1>
        <p className="text-sm text-muted-foreground mt-1">Demonstrativo de Resultado por franqueado</p>
      </div>

      {(closings ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">Nenhum fechamento disponível</h3>
          <p className="text-sm text-muted-foreground">Os fechamentos serão gerados quando houver receitas e despesas registradas.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {(closings ?? []).map(cl => (
            <Card key={cl.id} className="glass-card">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileDown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cl.title}</p>
                    <p className="text-xs text-muted-foreground">{monthNames[(cl.month || 1) - 1]} / {cl.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cl.status === "published" ? "default" : "secondary"}>
                    {cl.status === "published" ? "Publicado" : "Pendente"}
                  </Badge>
                  {cl.file_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cl.file_url} target="_blank" rel="noreferrer"><FileDown className="w-4 h-4 mr-1" />Baixar</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Building2, ArrowLeft, Users, FileText, Settings, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockUnidades, mockUnidadeUsers, mockUnidadeDocs, Unidade, UnidadeUser, UnidadeDoc } from "@/data/unidadesData";
import { UnidadesList } from "@/components/unidades/UnidadesList";
import { UnidadeDados } from "@/components/unidades/UnidadeDados";
import { UnidadeUsuarios } from "@/components/unidades/UnidadeUsuarios";
import { UnidadeDocumentos } from "@/components/unidades/UnidadeDocumentos";
import { UnidadeFinanceiro } from "@/components/unidades/UnidadeFinanceiro";

export default function Unidades() {
  const [unidades, setUnidades] = useState<Unidade[]>(mockUnidades);
  const [users, setUsers] = useState<UnidadeUser[]>(mockUnidadeUsers);
  const [docs, setDocs] = useState<UnidadeDoc[]>(mockUnidadeDocs);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = unidades.find(u => u.id === selectedId);

  const handleAddUnidade = (u: Unidade) => setUnidades(prev => [...prev, u]);
  const handleUpdateUnidade = (u: Unidade) => setUnidades(prev => prev.map(x => x.id === u.id ? u : x));
  const handleUpdateUsers = (updated: UnidadeUser[]) => {
    setUsers(prev => {
      const others = prev.filter(u => u.unidadeId !== selectedId);
      return [...others, ...updated];
    });
  };
  const handleUpdateDocs = (updated: UnidadeDoc[]) => {
    setDocs(prev => {
      const others = prev.filter(d => d.unidadeId !== selectedId);
      return [...others, ...updated];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {selected && (
          <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{selected ? selected.nome : "Unidades"}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {selected ? "Gerenciamento da unidade" : "Cadastro e gerenciamento das franquias da rede"}
          </p>
        </div>
      </div>

      {!selected ? (
        <UnidadesList unidades={unidades} onSelect={setSelectedId} onAdd={handleAddUnidade} />
      ) : (
        <div className="animate-fade-in">
          <Tabs defaultValue="dados">
            <TabsList className="mb-6">
              <TabsTrigger value="dados" className="gap-2"><ClipboardList className="w-4 h-4" /> Dados</TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-2"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
              <TabsTrigger value="documentos" className="gap-2"><FileText className="w-4 h-4" /> Documentos</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-2"><Settings className="w-4 h-4" /> Financeiro</TabsTrigger>
            </TabsList>
            <TabsContent value="dados"><UnidadeDados unidade={selected} onUpdate={handleUpdateUnidade} /></TabsContent>
            <TabsContent value="usuarios"><UnidadeUsuarios users={users.filter(u => u.unidadeId === selectedId)} unidadeId={selectedId} onUpdate={handleUpdateUsers} /></TabsContent>
            <TabsContent value="documentos"><UnidadeDocumentos docs={docs.filter(d => d.unidadeId === selectedId)} unidadeId={selectedId} onUpdate={handleUpdateDocs} /></TabsContent>
            <TabsContent value="financeiro"><UnidadeFinanceiro unidade={selected} onUpdate={handleUpdateUnidade} /></TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

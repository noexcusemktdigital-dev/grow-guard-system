import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, Plus } from "lucide-react";
import { matrizUsersMock, type MatrizUser, applyPerfil, getAreaColor } from "@/data/matrizData";
import { MatrizUserList } from "@/components/matriz/MatrizUserList";
import { MatrizUserForm } from "@/components/matriz/MatrizUserForm";
import { MatrizPermissions } from "@/components/matriz/MatrizPermissions";
import { MatrizSpecialPermissions } from "@/components/matriz/MatrizSpecialPermissions";
import { MatrizProfiles } from "@/components/matriz/MatrizProfiles";
import { toast } from "@/hooks/use-toast";

type View = "list" | "detail" | "create";

export default function Matriz() {
  const [view, setView] = useState<View>("list");
  const [users, setUsers] = useState<MatrizUser[]>(matrizUsersMock);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const selectedUser = users.find(u => u.id === selectedUserId);

  const handleView = (id: string) => { setSelectedUserId(id); setEditMode(false); setView("detail"); };
  const handleEdit = (id: string) => { setSelectedUserId(id); setEditMode(true); setView("detail"); };
  const handleBack = () => { setView("list"); setSelectedUserId(null); setEditMode(false); };

  const handleSaveNew = (user: MatrizUser) => {
    setUsers(prev => [...prev, user]);
    toast({ title: "Usuário criado", description: `${user.nome} foi adicionado à Matriz.` });
    setView("list");
  };

  const handleUpdateUser = (updated: MatrizUser) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    toast({ title: "Usuário atualizado", description: `${updated.nome} foi salvo.` });
  };

  const handlePermChange = (permissoes: MatrizUser["permissoes"]) => {
    if (!selectedUser) return;
    handleUpdateUser({ ...selectedUser, permissoes, perfilBase: undefined });
  };

  const handleEspeciaisChange = (permissoesEspeciais: MatrizUser["permissoesEspeciais"]) => {
    if (!selectedUser) return;
    handleUpdateUser({ ...selectedUser, permissoesEspeciais });
  };

  const handleApplyPerfil = (perfilId: string) => {
    if (!selectedUser) return;
    const updated = applyPerfil(selectedUser, perfilId);
    handleUpdateUser(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== "list" && (
            <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft className="w-5 h-5" /></Button>
          )}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-header-title">Matriz</h1>
              <Badge variant="secondary">Franqueadora</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {view === "list" && "Gestão de usuários e permissões da franqueadora"}
              {view === "detail" && selectedUser && `${selectedUser.nome} — ${selectedUser.cargo}`}
              {view === "create" && "Cadastrar novo usuário"}
            </p>
          </div>
        </div>
        {view === "list" && (
          <Button onClick={() => setView("create")}><Plus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
        )}
      </div>

      {/* Content */}
      {view === "list" && <MatrizUserList users={users} onViewUser={handleView} onEditUser={handleEdit} />}

      {view === "create" && <MatrizUserForm onSave={handleSaveNew} onCancel={handleBack} />}

      {view === "detail" && selectedUser && (
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="permissoes">Permissões por Módulo</TabsTrigger>
            <TabsTrigger value="especiais">Permissões Especiais</TabsTrigger>
            <TabsTrigger value="perfis">Perfis</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            <MatrizUserForm user={selectedUser} onSave={handleUpdateUser} onCancel={handleBack} />
          </TabsContent>

          <TabsContent value="permissoes" className="mt-4">
            <MatrizPermissions permissoes={selectedUser.permissoes} onChange={handlePermChange} readOnly={!editMode} />
          </TabsContent>

          <TabsContent value="especiais" className="mt-4">
            <MatrizSpecialPermissions permissoes={selectedUser.permissoesEspeciais} onChange={handleEspeciaisChange} readOnly={!editMode} />
          </TabsContent>

          <TabsContent value="perfis" className="mt-4">
            <MatrizProfiles onApply={editMode ? handleApplyPerfil : undefined} activePerfilId={selectedUser.perfilBase} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

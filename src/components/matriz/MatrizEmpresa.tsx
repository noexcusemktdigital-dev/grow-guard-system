// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Camera, Save, Loader2 } from "lucide-react";
import { useOrgProfile } from "@/hooks/useOrgProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { reportError } from "@/lib/error-toast";

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function MatrizEmpresa() {
  const { data: org, isLoading, update } = useOrgProfile();
  const { user } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    trade_name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    legal_nature: "",
    company_size: "",
    founded_at: "",
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "",
        legal_name: org.legal_name || "",
        trade_name: org.trade_name || "",
        cnpj: org.cnpj || "",
        email: org.email || "",
        phone: org.phone || "",
        address: org.address || "",
        city: org.city || "",
        state: org.state || "",
        legal_nature: org.legal_nature || "",
        company_size: org.company_size || "",
        founded_at: org.founded_at || "",
      });
    }
  }, [org]);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Nome fantasia é obrigatório");
      return;
    }
    update.mutate(form);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    if (file.size > 2 * 1024 * 1024) {
      reportError(new Error("Logo deve ter no máximo 2MB"), { title: "Logo deve ter no máximo 2MB", category: "empresa.logo_size" });
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${org.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      reportError(error, { title: "Erro ao fazer upload da logo", category: "empresa.logo_upload" });
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    update.mutate({ logo_url: `${urlData.publicUrl}?t=${Date.now()}` });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      {/* Logo + Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identidade da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => logoRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted">
                {org?.logo_url ? (
                  <img src={org.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div>
                <Label>Nome Fantasia *</Label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div>
                <Label>Razão Social</Label>
                <Input value={form.legal_name} onChange={e => set("legal_name", e.target.value)} placeholder="Razão social" />
              </div>
              <div className="md:col-span-2">
                <Label>Nome Comercial</Label>
                <Input value={form.trade_name} onChange={e => set("trade_name", e.target.value)} placeholder="Nome comercial / marca" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Cadastrais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <Label>Natureza Jurídica</Label>
              <Input value={form.legal_nature} onChange={e => set("legal_nature", e.target.value)} placeholder="Ex: Sociedade Limitada" />
            </div>
            <div>
              <Label>Porte da Empresa</Label>
              <Select value={form.company_size} onValueChange={v => set("company_size", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mei">MEI</SelectItem>
                  <SelectItem value="me">Microempresa (ME)</SelectItem>
                  <SelectItem value="epp">Empresa de Pequeno Porte (EPP)</SelectItem>
                  <SelectItem value="medio">Médio Porte</SelectItem>
                  <SelectItem value="grande">Grande Porte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Fundação</Label>
              <Input type="date" value={form.founded_at} onChange={e => set("founded_at", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rua, número, complemento" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cidade" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.state} onValueChange={v => set("state", v)}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={update.isPending} size="lg">
          {update.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Dados da Empresa
        </Button>
      </div>
    </div>
  );
}

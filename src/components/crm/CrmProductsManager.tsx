import { useState } from "react";
import { Plus, Search, Package, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useCrmProducts, useCrmProductMutations, type CrmProduct } from "@/hooks/useCrmProducts";
import { useToast } from "@/hooks/use-toast";

const UNITS = [
  { value: "un", label: "Unidade" },
  { value: "hora", label: "Hora" },
  { value: "mes", label: "Mês" },
  { value: "projeto", label: "Projeto" },
];

export function CrmProductsManager() {
  const { toast } = useToast();
  const { data: products, isLoading } = useCrmProducts(false);
  const { createProduct, updateProduct, deleteProduct } = useCrmProductMutations();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CrmProduct | null>(null);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("un");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);

  const categories = [...new Set((products || []).map(p => p.category).filter(Boolean))] as string[];

  const filtered = (products || []).filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category !== catFilter) return false;
    return true;
  });

  const resetForm = () => { setName(""); setDescription(""); setPrice(""); setUnit("un"); setCategory(""); setIsActive(true); setEditing(null); };

  const openNew = () => { resetForm(); setShowForm(true); };
  const openEdit = (p: CrmProduct) => {
    setEditing(p); setName(p.name); setDescription(p.description || "");
    setPrice(p.price.toString()); setUnit(p.unit); setCategory(p.category || "");
    setIsActive(p.is_active); setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = { name, description: description || null, price: parseFloat(price) || 0, unit, category: category || null, is_active: isActive };
    if (editing) {
      updateProduct.mutate({ id: editing.id, ...payload });
      toast({ title: "Produto atualizado" });
    } else {
      createProduct.mutate(payload as Omit<CrmProduct, 'id' | 'organization_id' | 'created_at'>);
      toast({ title: "Produto criado" });
    }
    setShowForm(false); resetForm();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-8 h-8 text-sm" aria-label="Buscar produto" />
        </div>
        {categories.length > 0 && (
          <Select value={catFilter} onValueChange={v => setCatFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" className="h-8 text-xs gap-1" onClick={openNew}><Plus className="w-3 h-3" /> Produto</Button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id} className={`${!p.is_active ? "opacity-50" : ""}`}>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {!p.is_active && <Badge variant="outline" className="text-[9px]">Inativo</Badge>}
                  {p.category && <Badge variant="secondary" className="text-[9px]">{p.category}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / {UNITS.find(u => u.value === p.unit)?.label || p.unit}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Switch checked={p.is_active} onCheckedChange={checked => { updateProduct.mutate({ id: p.id, is_active: checked }); }} className="scale-75" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Mais opções"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs">
                    <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="w-3 h-3 mr-2" />Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => { deleteProduct.mutate(p.id); toast({ title: "Produto excluído" }); }}><Trash2 className="w-3 h-3 mr-2" />Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={o => { if (!o) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="text-xs min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Preço</Label><Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="h-8 text-sm" /></div>
              <div>
                <Label className="text-xs">Unidade</Label>
                <Select value={unit} onValueChange={setUnit}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u.value} value={u.value} className="text-sm">{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Categoria</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Serviços, Produtos..." className="h-8 text-sm" /></div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Ativo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

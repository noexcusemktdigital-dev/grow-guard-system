import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, MapPin, Building2, Search } from "lucide-react";

interface LocationItem {
  label: string;
  type: "estado" | "cidade";
  uf: string;
}

const LOCATIONS: LocationItem[] = [
  // Estados
  { label: "Acre", type: "estado", uf: "AC" },
  { label: "Alagoas", type: "estado", uf: "AL" },
  { label: "Amapá", type: "estado", uf: "AP" },
  { label: "Amazonas", type: "estado", uf: "AM" },
  { label: "Bahia", type: "estado", uf: "BA" },
  { label: "Ceará", type: "estado", uf: "CE" },
  { label: "Distrito Federal", type: "estado", uf: "DF" },
  { label: "Espírito Santo", type: "estado", uf: "ES" },
  { label: "Goiás", type: "estado", uf: "GO" },
  { label: "Maranhão", type: "estado", uf: "MA" },
  { label: "Mato Grosso", type: "estado", uf: "MT" },
  { label: "Mato Grosso do Sul", type: "estado", uf: "MS" },
  { label: "Minas Gerais", type: "estado", uf: "MG" },
  { label: "Pará", type: "estado", uf: "PA" },
  { label: "Paraíba", type: "estado", uf: "PB" },
  { label: "Paraná", type: "estado", uf: "PR" },
  { label: "Pernambuco", type: "estado", uf: "PE" },
  { label: "Piauí", type: "estado", uf: "PI" },
  { label: "Rio de Janeiro", type: "estado", uf: "RJ" },
  { label: "Rio Grande do Norte", type: "estado", uf: "RN" },
  { label: "Rio Grande do Sul", type: "estado", uf: "RS" },
  { label: "Rondônia", type: "estado", uf: "RO" },
  { label: "Roraima", type: "estado", uf: "RR" },
  { label: "Santa Catarina", type: "estado", uf: "SC" },
  { label: "São Paulo", type: "estado", uf: "SP" },
  { label: "Sergipe", type: "estado", uf: "SE" },
  { label: "Tocantins", type: "estado", uf: "TO" },
  // Capitais e cidades principais
  { label: "São Paulo", type: "cidade", uf: "SP" },
  { label: "Rio de Janeiro", type: "cidade", uf: "RJ" },
  { label: "Brasília", type: "cidade", uf: "DF" },
  { label: "Salvador", type: "cidade", uf: "BA" },
  { label: "Fortaleza", type: "cidade", uf: "CE" },
  { label: "Belo Horizonte", type: "cidade", uf: "MG" },
  { label: "Manaus", type: "cidade", uf: "AM" },
  { label: "Curitiba", type: "cidade", uf: "PR" },
  { label: "Recife", type: "cidade", uf: "PE" },
  { label: "Goiânia", type: "cidade", uf: "GO" },
  { label: "Belém", type: "cidade", uf: "PA" },
  { label: "Porto Alegre", type: "cidade", uf: "RS" },
  { label: "Guarulhos", type: "cidade", uf: "SP" },
  { label: "Campinas", type: "cidade", uf: "SP" },
  { label: "São Luís", type: "cidade", uf: "MA" },
  { label: "Maceió", type: "cidade", uf: "AL" },
  { label: "Campo Grande", type: "cidade", uf: "MS" },
  { label: "Teresina", type: "cidade", uf: "PI" },
  { label: "João Pessoa", type: "cidade", uf: "PB" },
  { label: "Natal", type: "cidade", uf: "RN" },
  { label: "São Bernardo do Campo", type: "cidade", uf: "SP" },
  { label: "Santo André", type: "cidade", uf: "SP" },
  { label: "Osasco", type: "cidade", uf: "SP" },
  { label: "Ribeirão Preto", type: "cidade", uf: "SP" },
  { label: "Sorocaba", type: "cidade", uf: "SP" },
  { label: "São José dos Campos", type: "cidade", uf: "SP" },
  { label: "Uberlândia", type: "cidade", uf: "MG" },
  { label: "Contagem", type: "cidade", uf: "MG" },
  { label: "Juiz de Fora", type: "cidade", uf: "MG" },
  { label: "Aracaju", type: "cidade", uf: "SE" },
  { label: "Feira de Santana", type: "cidade", uf: "BA" },
  { label: "Cuiabá", type: "cidade", uf: "MT" },
  { label: "Joinville", type: "cidade", uf: "SC" },
  { label: "Florianópolis", type: "cidade", uf: "SC" },
  { label: "Londrina", type: "cidade", uf: "PR" },
  { label: "Niterói", type: "cidade", uf: "RJ" },
  { label: "Duque de Caxias", type: "cidade", uf: "RJ" },
  { label: "São Gonçalo", type: "cidade", uf: "RJ" },
  { label: "Porto Velho", type: "cidade", uf: "RO" },
  { label: "Macapá", type: "cidade", uf: "AP" },
  { label: "Rio Branco", type: "cidade", uf: "AC" },
  { label: "Boa Vista", type: "cidade", uf: "RR" },
  { label: "Palmas", type: "cidade", uf: "TO" },
  { label: "Vitória", type: "cidade", uf: "ES" },
  { label: "Serra", type: "cidade", uf: "ES" },
  { label: "Vila Velha", type: "cidade", uf: "ES" },
  { label: "Caxias do Sul", type: "cidade", uf: "RS" },
  { label: "Pelotas", type: "cidade", uf: "RS" },
  { label: "Canoas", type: "cidade", uf: "RS" },
  { label: "Maringá", type: "cidade", uf: "PR" },
  { label: "Ponta Grossa", type: "cidade", uf: "PR" },
  { label: "Blumenau", type: "cidade", uf: "SC" },
  { label: "Santos", type: "cidade", uf: "SP" },
  { label: "Jundiaí", type: "cidade", uf: "SP" },
  { label: "Piracicaba", type: "cidade", uf: "SP" },
  { label: "Bauru", type: "cidade", uf: "SP" },
  { label: "São José do Rio Preto", type: "cidade", uf: "SP" },
  { label: "Aparecida de Goiânia", type: "cidade", uf: "GO" },
  { label: "Anápolis", type: "cidade", uf: "GO" },
  { label: "Caruaru", type: "cidade", uf: "PE" },
  { label: "Jaboatão dos Guararapes", type: "cidade", uf: "PE" },
  { label: "Olinda", type: "cidade", uf: "PE" },
  { label: "Caucaia", type: "cidade", uf: "CE" },
  { label: "Juazeiro do Norte", type: "cidade", uf: "CE" },
  { label: "Sobral", type: "cidade", uf: "CE" },
  { label: "Imperatriz", type: "cidade", uf: "MA" },
  { label: "Campina Grande", type: "cidade", uf: "PB" },
  { label: "Mossoró", type: "cidade", uf: "RN" },
  { label: "Parnamirim", type: "cidade", uf: "RN" },
  { label: "Vitória da Conquista", type: "cidade", uf: "BA" },
  { label: "Camaçari", type: "cidade", uf: "BA" },
  { label: "Lauro de Freitas", type: "cidade", uf: "BA" },
  { label: "Itabuna", type: "cidade", uf: "BA" },
  { label: "Montes Claros", type: "cidade", uf: "MG" },
  { label: "Betim", type: "cidade", uf: "MG" },
  { label: "Uberaba", type: "cidade", uf: "MG" },
  { label: "Governador Valadares", type: "cidade", uf: "MG" },
  { label: "Ipatinga", type: "cidade", uf: "MG" },
  { label: "Sete Lagoas", type: "cidade", uf: "MG" },
  { label: "Divinópolis", type: "cidade", uf: "MG" },
  { label: "Rondonópolis", type: "cidade", uf: "MT" },
  { label: "Sinop", type: "cidade", uf: "MT" },
  { label: "Dourados", type: "cidade", uf: "MS" },
  { label: "Três Lagoas", type: "cidade", uf: "MS" },
  { label: "Ananindeua", type: "cidade", uf: "PA" },
  { label: "Marabá", type: "cidade", uf: "PA" },
  { label: "Santarém", type: "cidade", uf: "PA" },
  { label: "Cascavel", type: "cidade", uf: "PR" },
  { label: "Foz do Iguaçu", type: "cidade", uf: "PR" },
  { label: "Chapecó", type: "cidade", uf: "SC" },
  { label: "Criciúma", type: "cidade", uf: "SC" },
  { label: "Novo Hamburgo", type: "cidade", uf: "RS" },
  { label: "São Leopoldo", type: "cidade", uf: "RS" },
  { label: "Santa Maria", type: "cidade", uf: "RS" },
  { label: "Passo Fundo", type: "cidade", uf: "RS" },
];

function formatItem(item: LocationItem): string {
  return item.type === "estado" ? `${item.label} (Estado)` : `${item.label} - ${item.uf}`;
}

interface BrazilLocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function BrazilLocationAutocomplete({ value, onChange }: BrazilLocationAutocompleteProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const items = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const isBrasilInteiro = items.includes("Brasil inteiro");

  const updateValue = (newItems: string[]) => onChange(newItems.join(", "));

  const toggleBrasilInteiro = (checked: boolean) => {
    updateValue(checked ? ["Brasil inteiro"] : []);
  };

  const addItem = (formatted: string) => {
    if (!items.includes(formatted)) {
      updateValue([...items.filter((i) => i !== "Brasil inteiro"), formatted]);
    }
    setSearch("");
    setOpen(false);
  };

  const removeItem = (item: string) => {
    updateValue(items.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      addItem(search.trim());
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const query = search.toLowerCase();
  const filtered = query.length >= 2
    ? LOCATIONS.filter((loc) =>
        loc.label.toLowerCase().includes(query) || loc.uf.toLowerCase().includes(query)
      ).filter((loc) => !items.includes(formatItem(loc)))
    : [];

  const estados = filtered.filter((l) => l.type === "estado").slice(0, 4);
  const cidades = filtered.filter((l) => l.type === "cidade").slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Brasil inteiro toggle */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <Switch checked={isBrasilInteiro} onCheckedChange={toggleBrasilInteiro} id="brasil-inteiro" />
        <Label htmlFor="brasil-inteiro" className="text-sm font-medium cursor-pointer">
          🇧🇷 Brasil inteiro
        </Label>
      </div>

      {/* Search input */}
      {!isBrasilInteiro && (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Digite um estado ou cidade..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>

          {/* Dropdown */}
          {open && (estados.length > 0 || cidades.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {estados.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase px-3 pt-2 pb-1">Estados</p>
                  {estados.map((loc) => (
                    <button
                      key={`estado-${loc.uf}`}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                      onClick={() => addItem(formatItem(loc))}
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{loc.label}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{loc.uf}</span>
                    </button>
                  ))}
                </div>
              )}
              {cidades.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase px-3 pt-2 pb-1">Cidades</p>
                  {cidades.map((loc) => (
                    <button
                      key={`cidade-${loc.label}-${loc.uf}`}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                      onClick={() => addItem(formatItem(loc))}
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{loc.label}</span>
                      <span className="text-muted-foreground text-xs ml-auto">{loc.uf}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {open && search.length >= 2 && estados.length === 0 && cidades.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-3">
              <p className="text-xs text-muted-foreground text-center">
                Nenhum resultado. Pressione <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> para adicionar "{search}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="default" className="text-xs py-1 px-2.5 gap-1">
              {item}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => item === "Brasil inteiro" ? toggleBrasilInteiro(false) : removeItem(item)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

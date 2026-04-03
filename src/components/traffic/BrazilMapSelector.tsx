import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STATES: { uf: string; name: string; d: string }[] = [
  { uf: "AC", name: "Acre", d: "M95,330 L100,320 L110,318 L115,325 L112,335 L102,338Z" },
  { uf: "AL", name: "Alagoas", d: "M462,260 L470,255 L478,258 L476,265 L468,268Z" },
  { uf: "AM", name: "Amazonas", d: "M110,200 L130,180 L180,175 L220,180 L240,195 L235,230 L220,250 L180,260 L140,255 L115,240 L105,220Z" },
  { uf: "AP", name: "Amapá", d: "M260,150 L275,140 L285,145 L290,160 L280,175 L265,172Z" },
  { uf: "BA", name: "Bahia", d: "M380,250 L420,240 L460,250 L470,270 L465,300 L450,320 L420,330 L390,325 L375,300 L370,275Z" },
  { uf: "CE", name: "Ceará", d: "M430,195 L450,185 L470,190 L475,205 L465,220 L445,222 L430,215Z" },
  { uf: "DF", name: "Distrito Federal", d: "M345,305 L352,300 L358,305 L352,310Z" },
  { uf: "ES", name: "Espírito Santo", d: "M430,335 L445,330 L450,340 L445,355 L432,352Z" },
  { uf: "GO", name: "Goiás", d: "M310,290 L345,280 L365,290 L370,315 L355,335 L330,340 L310,325 L305,305Z" },
  { uf: "MA", name: "Maranhão", d: "M340,185 L370,175 L395,180 L405,200 L395,225 L370,230 L350,220 L340,205Z" },
  { uf: "MT", name: "Mato Grosso", d: "M210,270 L260,260 L305,275 L310,310 L295,340 L260,350 L225,340 L210,310Z" },
  { uf: "MS", name: "Mato Grosso do Sul", d: "M260,350 L295,340 L310,360 L305,390 L285,400 L260,395 L250,375Z" },
  { uf: "MG", name: "Minas Gerais", d: "M340,310 L380,300 L420,310 L435,335 L425,360 L395,375 L360,370 L340,350 L335,330Z" },
  { uf: "PA", name: "Pará", d: "M200,170 L250,155 L290,165 L310,180 L320,200 L310,230 L280,245 L240,250 L210,240 L195,215Z" },
  { uf: "PB", name: "Paraíba", d: "M445,225 L465,220 L480,225 L478,235 L460,238 L445,235Z" },
  { uf: "PR", name: "Paraná", d: "M290,390 L325,385 L350,395 L348,415 L325,425 L295,420 L285,405Z" },
  { uf: "PE", name: "Pernambuco", d: "M430,235 L460,230 L480,238 L478,250 L455,255 L430,250Z" },
  { uf: "PI", name: "Piauí", d: "M385,200 L410,195 L425,210 L425,240 L410,255 L390,250 L380,235 L380,215Z" },
  { uf: "RJ", name: "Rio de Janeiro", d: "M390,370 L415,365 L430,375 L425,388 L405,392 L390,385Z" },
  { uf: "RN", name: "Rio Grande do Norte", d: "M450,200 L468,195 L480,200 L478,215 L462,218 L450,212Z" },
  { uf: "RS", name: "Rio Grande do Sul", d: "M290,430 L320,425 L340,440 L335,465 L315,480 L290,475 L280,455Z" },
  { uf: "RO", name: "Rondônia", d: "M165,280 L195,270 L210,285 L205,310 L185,318 L168,305Z" },
  { uf: "RR", name: "Roraima", d: "M170,140 L195,130 L210,140 L208,165 L190,175 L170,168Z" },
  { uf: "SC", name: "Santa Catarina", d: "M300,425 L330,420 L345,430 L340,445 L318,448 L300,440Z" },
  { uf: "SP", name: "São Paulo", d: "M320,365 L355,358 L385,370 L380,395 L355,405 L325,400 L315,385Z" },
  { uf: "SE", name: "Sergipe", d: "M460,265 L472,260 L478,268 L474,278 L462,278Z" },
  { uf: "TO", name: "Tocantins", d: "M310,225 L340,220 L355,235 L360,265 L345,280 L320,278 L310,260 L305,240Z" },
];

interface BrazilMapSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BrazilMapSelector({ value, onChange }: BrazilMapSelectorProps) {
  const [cityInput, setCityInput] = useState("");

  // Parse value into selected items
  const items = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const isBrasilInteiro = items.includes("Brasil inteiro");

  const selectedUFs = items.filter((i) => STATES.some((s) => s.uf === i));
  const customCities = items.filter((i) => i !== "Brasil inteiro" && !STATES.some((s) => s.uf === i));

  const updateValue = (newItems: string[]) => {
    onChange(newItems.join(", "));
  };

  const toggleState = (uf: string) => {
    if (isBrasilInteiro) return;
    const newItems = selectedUFs.includes(uf)
      ? [...selectedUFs.filter((u) => u !== uf), ...customCities]
      : [...selectedUFs, uf, ...customCities];
    updateValue(newItems);
  };

  const toggleBrasilInteiro = (checked: boolean) => {
    if (checked) {
      updateValue(["Brasil inteiro"]);
    } else {
      updateValue([]);
    }
  };

  const addCity = () => {
    const city = cityInput.trim();
    if (city && !items.includes(city)) {
      updateValue([...items.filter((i) => i !== "Brasil inteiro"), city]);
      setCityInput("");
    }
  };

  const removeItem = (item: string) => {
    updateValue(items.filter((i) => i !== item));
  };

  return (
    <div className="space-y-4">
      {/* Brasil inteiro toggle */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <Switch
          checked={isBrasilInteiro}
          onCheckedChange={toggleBrasilInteiro}
          id="brasil-inteiro"
        />
        <Label htmlFor="brasil-inteiro" className="text-sm font-medium cursor-pointer">
          🇧🇷 Brasil inteiro
        </Label>
      </div>

      {/* SVG Map */}
      <TooltipProvider delayDuration={100}>
        <div className="relative flex justify-center">
          <svg
            viewBox="80 120 420 380"
            className="w-full max-w-[400px] h-auto"
            style={{ opacity: isBrasilInteiro ? 0.4 : 1 }}
          >
            {STATES.map((state) => {
              const isSelected = selectedUFs.includes(state.uf) || isBrasilInteiro;
              return (
                <Tooltip key={state.uf}>
                  <TooltipTrigger asChild>
                    <path
                      d={state.d}
                      fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                      stroke="hsl(var(--border))"
                      strokeWidth="1.5"
                      className={`transition-colors duration-150 ${!isBrasilInteiro ? "cursor-pointer hover:fill-[hsl(var(--primary)/0.5)]" : ""}`}
                      onClick={() => toggleState(state.uf)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {state.name} ({state.uf})
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </div>
      </TooltipProvider>

      {/* City search */}
      {!isBrasilInteiro && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Adicione cidades específicas (opcional):</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: São Paulo, Campinas..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCity();
                }
              }}
              className="flex-1"
            />
            <button
              type="button"
              onClick={addCity}
              className="px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Selected chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="default" className="text-xs py-1 px-2.5 gap-1">
              {STATES.find((s) => s.uf === item)?.name || item}
              {item !== "Brasil inteiro" && (
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeItem(item)}
                />
              )}
              {item === "Brasil inteiro" && (
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => toggleBrasilInteiro(false)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

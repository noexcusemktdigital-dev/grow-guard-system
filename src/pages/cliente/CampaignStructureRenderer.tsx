// @ts-nocheck
import { Badge } from "@/components/ui/badge";
import { Layers, ChevronRight } from "lucide-react";

/* ── Normalize platform type to canonical key ── */
export function normalizePlatformType(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  if (lower.includes("google")) return "Google";
  if (lower.includes("meta") || lower.includes("facebook") || lower.includes("instagram")) return "Meta";
  if (lower.includes("tiktok") || lower.includes("tik tok")) return "TikTok";
  if (lower.includes("linkedin")) return "LinkedIn";
  return raw; // fallback to original
}

/* ── Reusable campaign structure renderer ── */
export function CampaignStructureRenderer({ structure }: { structure: unknown }) {
  if (!structure) return null;

  const cs = structure;

  // String
  if (typeof cs === "string") {
    return (
      <div>
        <SectionTitle />
        <p className="text-xs leading-relaxed whitespace-pre-line">{cs}</p>
      </div>
    );
  }

  // Array
  if (Array.isArray(cs)) {
    return (
      <div>
        <SectionTitle />
        <div className="space-y-2">
          {cs.map((item, i) => (
            <CampaignItem key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // Object with .campaigns
  if (typeof cs === "object" && cs !== null) {
    const obj = cs as Record<string, unknown>;

    if (Array.isArray(obj.campaigns)) {
      return (
        <div>
          <SectionTitle />
          <div className="space-y-2">
            {(obj.campaigns as unknown[]).map((c, ci) => (
              <CampaignItem key={ci} item={c} index={ci} />
            ))}
          </div>
        </div>
      );
    }

    // Generic object — render key/value pairs
    return (
      <div>
        <SectionTitle />
        <div className="space-y-1.5">
          {Object.entries(obj).map(([key, val]) => (
            <div key={key} className="p-2.5 rounded-lg bg-muted/10 border">
              <p className="text-[11px] font-semibold capitalize">{key.replace(/_/g, " ")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {typeof val === "string" ? val : JSON.stringify(val, null, 2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function SectionTitle() {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Layers className="w-3.5 h-3.5 text-primary" />
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Estrutura de Campanhas</p>
    </div>
  );
}

function CampaignItem({ item, index }: { item: unknown; index: number }) {
  if (typeof item === "string") {
    return (
      <div className="p-2.5 rounded-lg bg-muted/10 border">
        <p className="text-xs">{item}</p>
      </div>
    );
  }

  if (typeof item !== "object" || item === null) return null;

  const obj = item as Record<string, unknown>;
  const name = String(obj.name || obj.title || obj.campaign_name || `Campanha ${index + 1}`);
  const desc = obj.description || obj.objective;
  const adSets = Array.isArray(obj.ad_sets) ? obj.ad_sets :
                 Array.isArray(obj.adsets) ? obj.adsets :
                 Array.isArray(obj.ad_groups) ? obj.ad_groups : null;
  const ads = Array.isArray(obj.ads) ? obj.ads : null;

  return (
    <div className="p-3 rounded-xl bg-muted/10 border space-y-2">
      {/* Campaign name */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-primary">{index + 1}</span>
        </div>
        <p className="text-xs font-bold">{name}</p>
      </div>

      {desc && <p className="text-[10px] text-muted-foreground ml-7">{String(desc)}</p>}

      {/* Ad Sets */}
      {adSets && adSets.length > 0 && (
        <div className="ml-4 space-y-1.5">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase">Conjuntos de Anúncios</p>
          {adSets.map((as_: unknown, ai: number) => (
            <AdSetItem key={ai} item={as_} index={ai} />
          ))}
        </div>
      )}

      {/* Ads */}
      {ads && ads.length > 0 && (
        <div className="ml-4 space-y-1.5">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase">Anúncios</p>
          {ads.map((ad: unknown, ai: number) => (
            <div key={ai} className="ml-3 pl-2 border-l-2 border-primary/20">
              <p className="text-[10px]">
                {typeof ad === "string" ? ad : String((ad as Record<string, unknown>).name || (ad as Record<string, unknown>).title || `Anúncio ${ai + 1}`)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Render remaining keys as badges */}
      {renderExtraFields(obj)}
    </div>
  );
}

function AdSetItem({ item, index }: { item: unknown; index: number }) {
  if (typeof item === "string") {
    return (
      <div className="ml-3 pl-2 border-l-2 border-muted">
        <p className="text-[11px]">{item}</p>
      </div>
    );
  }

  if (typeof item !== "object" || item === null) return null;

  const obj = item as Record<string, unknown>;
  const name = String(obj.name || obj.title || `Conjunto ${index + 1}`);
  const targeting = obj.targeting || obj.segmentation || obj.audience;

  return (
    <div className="ml-3 pl-2.5 border-l-2 border-muted space-y-0.5">
      <p className="text-[11px] font-medium">{name}</p>
      {targeting && <p className="text-[10px] text-muted-foreground">{String(targeting)}</p>}
      {obj.budget && <p className="text-[10px] text-muted-foreground">Orçamento: {String(obj.budget)}</p>}
    </div>
  );
}

function renderExtraFields(obj: Record<string, unknown>) {
  const skipKeys = new Set(["name", "title", "campaign_name", "description", "objective", "ad_sets", "adsets", "ad_groups", "ads"]);
  const extras = Object.entries(obj).filter(([k]) => !skipKeys.has(k));
  if (extras.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 ml-7 mt-1">
      {extras.slice(0, 6).map(([key, val]) => {
        const display = typeof val === "string" ? val : Array.isArray(val) ? val.join(", ") : null;
        if (!display) return null;
        return (
          <Badge key={key} variant="outline" className="text-[8px]">
            {key.replace(/_/g, " ")}: {display.length > 40 ? display.slice(0, 40) + "…" : display}
          </Badge>
        );
      })}
    </div>
  );
}

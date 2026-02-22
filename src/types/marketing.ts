// Marketing types (extracted from marketingData.ts)
import {
  Image, Target, Presentation, Palette, Briefcase,
  FileText, FileImage, FileVideo, FileArchive, File,
} from "lucide-react";

export type MarketingCategory =
  | "RedesSociais"
  | "CampanhaProduto"
  | "ApresentacaoPortfolio"
  | "Marca"
  | "KitDiaADia";

export type MarketingFormat =
  | "feed" | "story" | "reels" | "carrossel" | "legenda"
  | "pdf" | "ppt" | "zip" | "png" | "svg" | "psd" | "jpg"
  | "mp4" | "doc" | "ai" | "figma";

export type MarketingProduct = "Noexcuse" | "SaaS" | "Sistema" | "Franquia" | "Geral";

export interface MarketingAsset {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  type: MarketingCategory;
  year: number;
  month: number;
  product: MarketingProduct;
  campaign?: string;
  format: MarketingFormat;
  tags: string[];
  version: string;
  isPublished: boolean;
  uploadedBy: string;
  createdAt: string;
  folder?: string;
}

export interface MarketingFolder {
  id: string;
  name: string;
  parentId: string | null;
  category: MarketingCategory;
  path: string;
  childCount: number;
}

// Plano Marketing (from clienteData)
export interface PlanoMarketingData {
  posicionamento: {
    publicoAlvo: string;
    persona: string;
    ticketMedio: number;
    diferenciais: string;
    concorrentes: string[];
    mercado: string;
  };
  objetivo: {
    tipo: "reconhecimento" | "leads" | "vendas" | "autoridade";
    metaLeads: number;
    metaVendas: number;
    roiEsperado: number;
  };
  canais: { name: string; active: boolean; icon: string; frequenciaSugerida: string }[];
  orcamento: {
    organico: number;
    pago: number;
    producao: number;
  };
  funil: {
    topo: { descricao: string; conteudo: string; metrica: string };
    meio: { descricao: string; conteudo: string; metrica: string };
    fundo: { descricao: string; conteudo: string; metrica: string };
  };
  planoAcao: {
    postsSemanais: number;
    cronograma: { dia: string; tipo: string }[];
    estrategiaTrafego: string;
    campanhasSugeridas: string[];
    landingPageSugerida: string;
  };
}

export interface CampanhaMarketing {
  id: string;
  name: string;
  objective: string;
  channel: string;
  audience: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  status: "Ativa" | "Pausada" | "Finalizada" | "Rascunho";
  leads: number;
  conversions: number;
  entregaveis: {
    conteudos: number;
    anuncios: number;
    landingPages: number;
    disparos: number;
  };
}

export interface ConteudoMarketing {
  id: string;
  title: string;
  network: string;
  format: "Feed" | "Story" | "Reels" | "Carrossel" | "Blog" | "Email";
  funnelStage: "Topo" | "Meio" | "Fundo";
  status: "Rascunho" | "Agendado" | "Publicado";
  date: string;
  description: string;
  copy?: string;
  cta?: string;
  hashtags?: string[];
  campaignId?: string;
}

// Helpers
export function getCategoryLabel(cat: MarketingCategory): string {
  const map: Record<MarketingCategory, string> = {
    RedesSociais: "Redes Sociais",
    CampanhaProduto: "Campanhas por Produto",
    ApresentacaoPortfolio: "Apresentações & Portfólio",
    Marca: "Materiais da Marca",
    KitDiaADia: "Kit do Dia a Dia",
  };
  return map[cat];
}

export function getCategoryIcon(cat: MarketingCategory) {
  const map: Record<MarketingCategory, React.ElementType> = {
    RedesSociais: Image,
    CampanhaProduto: Target,
    ApresentacaoPortfolio: Presentation,
    Marca: Palette,
    KitDiaADia: Briefcase,
  };
  return map[cat];
}

const imageFormats: MarketingFormat[] = ["png", "jpg", "svg", "psd", "ai", "figma", "feed", "story", "reels", "carrossel"];
const videoFormats: MarketingFormat[] = ["mp4"];
const archiveFormats: MarketingFormat[] = ["zip"];
const docFormats: MarketingFormat[] = ["pdf", "doc", "ppt", "legenda"];

export function getFormatIcon(fmt: MarketingFormat) {
  if (imageFormats.includes(fmt)) return FileImage;
  if (videoFormats.includes(fmt)) return FileVideo;
  if (archiveFormats.includes(fmt)) return FileArchive;
  if (docFormats.includes(fmt)) return FileText;
  return File;
}

export function getCategoryColor(cat: MarketingCategory): string {
  const map: Record<MarketingCategory, string> = {
    RedesSociais: "blue",
    CampanhaProduto: "orange",
    ApresentacaoPortfolio: "emerald",
    Marca: "rose",
    KitDiaADia: "amber",
  };
  return map[cat];
}

export function getCategoryDescription(cat: MarketingCategory): string {
  const map: Record<MarketingCategory, string> = {
    RedesSociais: "Posts, stories, reels e carrosséis para suas redes",
    CampanhaProduto: "Materiais de campanhas organizados por produto",
    ApresentacaoPortfolio: "Apresentações institucionais e portfólio de cases",
    Marca: "Logos, manual da marca e identidade visual",
    KitDiaADia: "Fundos, assinaturas e templates do dia a dia",
  };
  return map[cat];
}

export const allCategories: MarketingCategory[] = [
  "RedesSociais", "CampanhaProduto",
  "ApresentacaoPortfolio", "Marca", "KitDiaADia",
];

export const allProducts: MarketingProduct[] = ["Noexcuse", "SaaS", "Sistema", "Franquia", "Geral"];

export const allFormats: MarketingFormat[] = [
  "feed", "story", "reels", "carrossel", "legenda",
  "pdf", "ppt", "zip", "png", "svg", "psd", "jpg",
  "mp4", "doc", "ai", "figma",
];

export const monthLabels = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Mock data and data-dependent helpers (placeholder until fully backed by database)
export const mockFolders: MarketingFolder[] = [
  { id: "rs-1", name: "2026", parentId: null, category: "RedesSociais", path: "2026", childCount: 1 },
  { id: "rs-2", name: "02 Fevereiro", parentId: "rs-1", category: "RedesSociais", path: "2026/02 Fevereiro", childCount: 5 },
  { id: "rs-3", name: "Feed", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Feed", childCount: 2 },
  { id: "rs-4", name: "Story", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Story", childCount: 1 },
  { id: "cp-1", name: "Noexcuse", parentId: null, category: "CampanhaProduto", path: "Noexcuse", childCount: 1 },
  { id: "mk-1", name: "Logos", parentId: null, category: "Marca", path: "Logos", childCount: 1 },
  { id: "kd-1", name: "Fundos Tela", parentId: null, category: "KitDiaADia", path: "Fundos Tela", childCount: 1 },
  { id: "ap-1", name: "Institucional", parentId: null, category: "ApresentacaoPortfolio", path: "Institucional", childCount: 1 },
];

export const mockAssets: MarketingAsset[] = [
  { id: "a1", title: "Post Lançamento Noexcuse", fileName: "post-lancamento-noexcuse.png", fileSize: "2.4 MB", type: "RedesSociais", year: 2026, month: 2, product: "Noexcuse", format: "feed", tags: ["lançamento"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-01", folder: "2026/02 Fevereiro/Feed" },
  { id: "a2", title: "Carrossel Benefícios", fileName: "carrossel-beneficios.png", fileSize: "4.1 MB", type: "RedesSociais", year: 2026, month: 2, product: "Franquia", format: "carrossel", tags: ["franquia"], version: "v2", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-03", folder: "2026/02 Fevereiro/Feed" },
  { id: "a7", title: "Banner Campanha Venda Franquia", fileName: "banner-venda-franquia.png", fileSize: "1.8 MB", type: "CampanhaProduto", year: 2026, month: 2, product: "Noexcuse", format: "png", tags: ["banner"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-28", folder: "Noexcuse" },
  { id: "a16", title: "Logo Principal PNG", fileName: "logo-principal.png", fileSize: "540 KB", type: "Marca", year: 2026, month: 1, product: "Geral", format: "png", tags: ["logo"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2025-12-01", folder: "Logos" },
  { id: "a13", title: "Apresentação Institucional 2026", fileName: "institucional-2026.ppt", fileSize: "15.4 MB", type: "ApresentacaoPortfolio", year: 2026, month: 1, product: "Geral", format: "ppt", tags: ["institucional"], version: "v3", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-15", folder: "Institucional" },
  { id: "a18", title: "Fundo Zoom Institucional", fileName: "fundo-zoom.png", fileSize: "1.2 MB", type: "KitDiaADia", year: 2026, month: 1, product: "Geral", format: "png", tags: ["zoom"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-10", folder: "Fundos Tela" },
];

export function getCategoryAssetCount(cat: MarketingCategory): number {
  return mockAssets.filter((a) => a.type === cat).length;
}

export function getAssetsByCategory(category: MarketingCategory): MarketingAsset[] {
  return mockAssets.filter((a) => a.type === category);
}

export function getFoldersByCategory(category: MarketingCategory): MarketingFolder[] {
  return mockFolders.filter((f) => f.category === category);
}

export function getChildFolders(category: MarketingCategory, parentPath: string): MarketingFolder[] {
  return mockFolders.filter((f) => {
    if (f.category !== category) return false;
    if (parentPath === "") return f.parentId === null;
    const parts = f.path.split("/");
    const parentParts = parentPath.split("/");
    return parts.length === parentParts.length + 1 && f.path.startsWith(parentPath + "/");
  });
}

export function getAssetsInFolder(category: MarketingCategory, folderPath: string): MarketingAsset[] {
  return mockAssets.filter((a) => {
    if (a.type !== category) return false;
    return (a.folder || "") === folderPath;
  });
}

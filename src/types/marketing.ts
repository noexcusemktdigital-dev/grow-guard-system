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


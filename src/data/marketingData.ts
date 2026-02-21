import {
  Image, Target, Package, Presentation, Palette, Briefcase,
  FileText, FileImage, FileVideo, FileArchive, File, FileSpreadsheet,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────
export type MarketingCategory =
  | "RedesSociais"
  | "CampanhaProduto"
  | "EmbaldeMensal"
  | "ApresentacaoPortfolio"
  | "Marca"
  | "KitDiaADia";

export type MarketingFormat =
  | "feed" | "story" | "reels" | "carrossel" | "legenda"
  | "pdf" | "ppt" | "zip" | "png" | "svg" | "psd" | "jpg"
  | "mp4" | "doc" | "ai" | "figma";

export type MarketingProduct = "Noexcuse" | "SaaS" | "Sistema" | "Franquia" | "Geral";

// ── Interfaces ─────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────
export function getCategoryLabel(cat: MarketingCategory): string {
  const map: Record<MarketingCategory, string> = {
    RedesSociais: "Redes Sociais",
    CampanhaProduto: "Campanhas por Produto",
    EmbaldeMensal: "Embalde Mensal",
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
    EmbaldeMensal: Package,
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
    EmbaldeMensal: "purple",
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
    EmbaldeMensal: "Pacote completo pronto para uso mensal",
    ApresentacaoPortfolio: "Apresentações institucionais e portfólio de cases",
    Marca: "Logos, manual da marca e identidade visual",
    KitDiaADia: "Fundos, assinaturas e templates do dia a dia",
  };
  return map[cat];
}

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

export const allCategories: MarketingCategory[] = [
  "RedesSociais", "CampanhaProduto", "EmbaldeMensal",
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

// ── Mock Folders ───────────────────────────────────────
export const mockFolders: MarketingFolder[] = [
  // Redes Sociais
  { id: "rs-1", name: "2026", parentId: null, category: "RedesSociais", path: "2026", childCount: 1 },
  { id: "rs-2", name: "02 Fevereiro", parentId: "rs-1", category: "RedesSociais", path: "2026/02 Fevereiro", childCount: 5 },
  { id: "rs-3", name: "Feed", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Feed", childCount: 2 },
  { id: "rs-4", name: "Story", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Story", childCount: 1 },
  { id: "rs-5", name: "Reels", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Reels", childCount: 1 },
  { id: "rs-6", name: "Carrossel", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Carrossel", childCount: 1 },
  { id: "rs-7", name: "Legendas", parentId: "rs-2", category: "RedesSociais", path: "2026/02 Fevereiro/Legendas", childCount: 1 },

  // Campanhas por Produto
  { id: "cp-1", name: "Noexcuse", parentId: null, category: "CampanhaProduto", path: "Noexcuse", childCount: 1 },
  { id: "cp-2", name: "Venda Franquia 2026", parentId: "cp-1", category: "CampanhaProduto", path: "Noexcuse/Venda Franquia 2026", childCount: 3 },
  { id: "cp-3", name: "Criativos", parentId: "cp-2", category: "CampanhaProduto", path: "Noexcuse/Venda Franquia 2026/Criativos", childCount: 2 },
  { id: "cp-4", name: "Copy", parentId: "cp-2", category: "CampanhaProduto", path: "Noexcuse/Venda Franquia 2026/Copy", childCount: 1 },
  { id: "cp-5", name: "Mídia Paga", parentId: "cp-2", category: "CampanhaProduto", path: "Noexcuse/Venda Franquia 2026/Mídia Paga", childCount: 1 },

  // Embalde Mensal
  { id: "em-1", name: "2026", parentId: null, category: "EmbaldeMensal", path: "2026", childCount: 1 },
  { id: "em-2", name: "02 Fevereiro", parentId: "em-1", category: "EmbaldeMensal", path: "2026/02 Fevereiro", childCount: 0 },

  // Apresentações
  { id: "ap-1", name: "Institucional", parentId: null, category: "ApresentacaoPortfolio", path: "Institucional", childCount: 1 },
  { id: "ap-2", name: "Portfólio", parentId: null, category: "ApresentacaoPortfolio", path: "Portfólio", childCount: 1 },
  { id: "ap-3", name: "Propostas", parentId: null, category: "ApresentacaoPortfolio", path: "Propostas", childCount: 1 },
  { id: "ap-4", name: "Cases", parentId: null, category: "ApresentacaoPortfolio", path: "Cases", childCount: 1 },

  // Marca
  { id: "mk-1", name: "Logos", parentId: null, category: "Marca", path: "Logos", childCount: 1 },
  { id: "mk-2", name: "Manual", parentId: null, category: "Marca", path: "Manual", childCount: 1 },
  { id: "mk-3", name: "Paleta", parentId: null, category: "Marca", path: "Paleta", childCount: 1 },
  { id: "mk-4", name: "Arquivos Abertos", parentId: null, category: "Marca", path: "Arquivos Abertos", childCount: 1 },

  // Kit Dia a Dia
  { id: "kd-1", name: "Fundos Tela", parentId: null, category: "KitDiaADia", path: "Fundos Tela", childCount: 1 },
  { id: "kd-2", name: "Foto Perfil", parentId: null, category: "KitDiaADia", path: "Foto Perfil", childCount: 1 },
  { id: "kd-3", name: "Assinatura Email", parentId: null, category: "KitDiaADia", path: "Assinatura Email", childCount: 1 },
  { id: "kd-4", name: "Templates Docs", parentId: null, category: "KitDiaADia", path: "Templates Docs", childCount: 1 },
];

// ── Mock Assets ────────────────────────────────────────
export const mockAssets: MarketingAsset[] = [
  // Redes Sociais
  { id: "a1", title: "Post Lançamento Noexcuse", fileName: "post-lancamento-noexcuse.png", fileSize: "2.4 MB", type: "RedesSociais", year: 2026, month: 2, product: "Noexcuse", format: "feed", tags: ["lançamento", "captação"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-01", folder: "2026/02 Fevereiro/Feed" },
  { id: "a2", title: "Carrossel Benefícios Franquia", fileName: "carrossel-beneficios.png", fileSize: "4.1 MB", type: "RedesSociais", year: 2026, month: 2, product: "Franquia", format: "carrossel", tags: ["franquia", "institucional"], version: "v2", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-03", folder: "2026/02 Fevereiro/Feed" },
  { id: "a3", title: "Story Promo Fevereiro", fileName: "story-promo-fev.mp4", fileSize: "8.2 MB", type: "RedesSociais", year: 2026, month: 2, product: "Noexcuse", format: "story", tags: ["promoção"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-02-05", folder: "2026/02 Fevereiro/Story" },
  { id: "a4", title: "Reels Resultados Janeiro", fileName: "reels-resultados-jan.mp4", fileSize: "12.5 MB", type: "RedesSociais", year: 2026, month: 2, product: "Geral", format: "reels", tags: ["resultados"], version: "v1", isPublished: false, uploadedBy: "Ana Paula", createdAt: "2026-02-07", folder: "2026/02 Fevereiro/Reels" },
  { id: "a5", title: "Carrossel Expansão", fileName: "carrossel-expansao.png", fileSize: "3.8 MB", type: "RedesSociais", year: 2026, month: 2, product: "Franquia", format: "carrossel", tags: ["expansão"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-02-08", folder: "2026/02 Fevereiro/Carrossel" },
  { id: "a6", title: "Legendas Fevereiro", fileName: "legendas-fev-2026.doc", fileSize: "245 KB", type: "RedesSociais", year: 2026, month: 2, product: "Geral", format: "legenda", tags: ["copy"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-02", folder: "2026/02 Fevereiro/Legendas" },

  // Campanhas por Produto
  { id: "a7", title: "Banner Campanha Venda Franquia", fileName: "banner-venda-franquia.png", fileSize: "1.8 MB", type: "CampanhaProduto", year: 2026, month: 2, product: "Noexcuse", campaign: "Venda Franquia 2026", format: "png", tags: ["banner", "mídia paga"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-28", folder: "Noexcuse/Venda Franquia 2026/Criativos" },
  { id: "a8", title: "Vídeo Institucional Campanha", fileName: "video-institucional.mp4", fileSize: "45 MB", type: "CampanhaProduto", year: 2026, month: 2, product: "Noexcuse", campaign: "Venda Franquia 2026", format: "mp4", tags: ["vídeo", "institucional"], version: "v2", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-01", folder: "Noexcuse/Venda Franquia 2026/Criativos" },
  { id: "a9", title: "Copy Anúncios Facebook", fileName: "copy-anuncios-fb.doc", fileSize: "120 KB", type: "CampanhaProduto", year: 2026, month: 2, product: "Noexcuse", campaign: "Venda Franquia 2026", format: "doc", tags: ["copy", "facebook"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-02-02", folder: "Noexcuse/Venda Franquia 2026/Copy" },
  { id: "a10", title: "Criativo Google Ads", fileName: "criativo-google-ads.jpg", fileSize: "890 KB", type: "CampanhaProduto", year: 2026, month: 2, product: "Noexcuse", campaign: "Venda Franquia 2026", format: "jpg", tags: ["google ads", "mídia paga"], version: "v1", isPublished: false, uploadedBy: "Ana Paula", createdAt: "2026-02-10", folder: "Noexcuse/Venda Franquia 2026/Mídia Paga" },

  // Embalde Mensal
  { id: "a11", title: "Embalde Fevereiro 2026", fileName: "embalde-fev-2026.zip", fileSize: "128 MB", type: "EmbaldeMensal", year: 2026, month: 2, product: "Geral", format: "zip", tags: ["embalde", "mensal"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-01", folder: "2026/02 Fevereiro" },
  { id: "a12", title: "Guia de Uso Fevereiro", fileName: "guia-uso-fev-2026.pdf", fileSize: "3.2 MB", type: "EmbaldeMensal", year: 2026, month: 2, product: "Geral", format: "pdf", tags: ["guia", "instrução"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-02-01", folder: "2026/02 Fevereiro" },

  // Apresentações
  { id: "a13", title: "Apresentação Institucional 2026", fileName: "institucional-2026.ppt", fileSize: "15.4 MB", type: "ApresentacaoPortfolio", year: 2026, month: 1, product: "Geral", format: "ppt", tags: ["institucional"], version: "v3", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-15", folder: "Institucional" },
  { id: "a14", title: "Portfólio de Cases", fileName: "portfolio-cases.pdf", fileSize: "22 MB", type: "ApresentacaoPortfolio", year: 2026, month: 1, product: "Geral", format: "pdf", tags: ["portfólio", "cases"], version: "v2", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-01-20", folder: "Portfólio" },
  { id: "a15", title: "Proposta Modelo Franquia", fileName: "proposta-modelo.ppt", fileSize: "8.7 MB", type: "ApresentacaoPortfolio", year: 2026, month: 1, product: "Franquia", format: "ppt", tags: ["proposta"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-22", folder: "Propostas" },

  // Marca
  { id: "a16", title: "Logo Principal PNG", fileName: "logo-principal.png", fileSize: "540 KB", type: "Marca", year: 2026, month: 1, product: "Geral", format: "png", tags: ["logo", "principal"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2025-12-01", folder: "Logos" },
  { id: "a17", title: "Manual da Marca", fileName: "manual-marca-2026.pdf", fileSize: "18 MB", type: "Marca", year: 2026, month: 1, product: "Geral", format: "pdf", tags: ["manual", "brand"], version: "v2", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-01-05", folder: "Manual" },

  // Kit Dia a Dia
  { id: "a18", title: "Fundo Zoom Institucional", fileName: "fundo-zoom.png", fileSize: "1.2 MB", type: "KitDiaADia", year: 2026, month: 1, product: "Geral", format: "png", tags: ["zoom", "fundo"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-10", folder: "Fundos Tela" },
  { id: "a19", title: "Foto Perfil Padrão", fileName: "foto-perfil-padrao.png", fileSize: "320 KB", type: "KitDiaADia", year: 2026, month: 1, product: "Geral", format: "png", tags: ["perfil", "whatsapp"], version: "v1", isPublished: true, uploadedBy: "Ana Paula", createdAt: "2026-01-10", folder: "Foto Perfil" },
  { id: "a20", title: "Assinatura Email HTML", fileName: "assinatura-email.doc", fileSize: "45 KB", type: "KitDiaADia", year: 2026, month: 1, product: "Geral", format: "doc", tags: ["assinatura", "email"], version: "v1", isPublished: true, uploadedBy: "Carlos", createdAt: "2026-01-12", folder: "Assinatura Email" },
];

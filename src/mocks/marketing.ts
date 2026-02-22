import {
  Image, Target, Presentation, Palette, Briefcase,
  FileText, FileImage, FileVideo, FileArchive, File,
} from "lucide-react";
import type {
  MarketingCategory, MarketingFormat, MarketingProduct,
  MarketingAsset, MarketingFolder,
} from "@/types/marketing";

// ── Mock Data (re-export from data to avoid duplicating large arrays) ──
export { mockFolders, mockAssets } from "@/data/marketingData";
import { mockFolders, mockAssets } from "@/data/marketingData";

// ── Helpers ──

export function getCategoryLabel(cat: MarketingCategory): string {
  const map: Record<MarketingCategory, string> = { RedesSociais: "Redes Sociais", CampanhaProduto: "Campanhas por Produto", ApresentacaoPortfolio: "Apresentações & Portfólio", Marca: "Materiais da Marca", KitDiaADia: "Kit do Dia a Dia" };
  return map[cat];
}

export function getCategoryIcon(cat: MarketingCategory) {
  const map: Record<MarketingCategory, React.ElementType> = { RedesSociais: Image, CampanhaProduto: Target, ApresentacaoPortfolio: Presentation, Marca: Palette, KitDiaADia: Briefcase };
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
  const map: Record<MarketingCategory, string> = { RedesSociais: "blue", CampanhaProduto: "orange", ApresentacaoPortfolio: "emerald", Marca: "rose", KitDiaADia: "amber" };
  return map[cat];
}

export function getCategoryDescription(cat: MarketingCategory): string {
  const map: Record<MarketingCategory, string> = { RedesSociais: "Posts, stories, reels e carrosséis para suas redes", CampanhaProduto: "Materiais de campanhas organizados por produto", ApresentacaoPortfolio: "Apresentações institucionais e portfólio de cases", Marca: "Logos, manual da marca e identidade visual", KitDiaADia: "Fundos, assinaturas e templates do dia a dia" };
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
  return mockAssets.filter((a) => a.type === category && (a.folder || "") === folderPath);
}

export const allCategories: MarketingCategory[] = ["RedesSociais", "CampanhaProduto", "ApresentacaoPortfolio", "Marca", "KitDiaADia"];
export const allProducts: MarketingProduct[] = ["Noexcuse", "SaaS", "Sistema", "Franquia", "Geral"];
export const allFormats: MarketingFormat[] = ["feed", "story", "reels", "carrossel", "legenda", "pdf", "ppt", "zip", "png", "svg", "psd", "jpg", "mp4", "doc", "ai", "figma"];
export const monthLabels = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];


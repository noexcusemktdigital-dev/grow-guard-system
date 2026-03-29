// @ts-nocheck
import React from "react";
import {
  DollarSign, Sparkles, Target, Users, Globe, BarChart3, Zap,
  Eye, MousePointer, TrendingUp, PlayCircle, ExternalLink,
  ChevronDown, ChevronUp, Loader2, History, CheckCircle2,
  ArrowLeft, ArrowRight, Briefcase, MapPin, Package, Link2,
  Image, Video, Layout, Monitor, MessageSquare, BookOpen,
  PieChart, Lightbulb, Trophy, ChevronRight,
} from "lucide-react";

export const OBJECTIVES = [
  { value: "gerar_leads", label: "Gerar Leads", icon: Users },
  { value: "vender_produtos", label: "Vender Produtos", icon: DollarSign },
  { value: "agendar_reunioes", label: "Agendar Reuniões", icon: Briefcase },
  { value: "captar_franqueados", label: "Captar Franqueados", icon: Trophy },
  { value: "trafego_site", label: "Tráfego no Site", icon: Globe },
];

export const AUDIENCES = ["Empresários", "Médicos", "Pequenas Empresas", "Consumidores Finais", "Profissionais Liberais", "Startups"];

export const DESTINATIONS = [
  { value: "site", label: "Site Institucional", icon: Monitor },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "formulario", label: "Formulário", icon: BookOpen },
];

export const PLATFORMS = [
  { value: "Meta", label: "Meta Ads", icon: Users, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "Google", label: "Google Ads", icon: Globe, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "TikTok", label: "TikTok Ads", icon: PlayCircle, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "LinkedIn", label: "LinkedIn Ads", icon: BarChart3, color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
];

export const ASSETS = [
  { value: "site", label: "Site", icon: Monitor },
  { value: "landing_page", label: "Landing Page", icon: Layout },
  { value: "artes", label: "Artes", icon: Image },
  { value: "videos", label: "Vídeos", icon: Video },
];

export const STEPS = [
  { id: "objetivo", label: "Objetivo", icon: Target },
  { id: "produto", label: "Produto", icon: Package },
  { id: "publico", label: "Público", icon: Users },
  { id: "destino", label: "Destino", icon: Link2 },
  { id: "orcamento", label: "Orçamento", icon: DollarSign },
  { id: "plataformas", label: "Plataformas", icon: Globe },
  { id: "regiao", label: "Região", icon: MapPin },
  { id: "ativos", label: "Ativos", icon: Image },
] as const;

export const platformColors: Record<string, string> = {
  Google: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Meta: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TikTok: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  LinkedIn: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

export const platformIcons: Record<string, React.ReactNode> = {
  Google: <Globe className="w-5 h-5" />,
  Meta: <Users className="w-5 h-5" />,
  TikTok: <PlayCircle className="w-5 h-5" />,
  LinkedIn: <BarChart3 className="w-5 h-5" />,
};

export const platformLinks: Record<string, string> = {
  Google: "https://ads.google.com",
  Meta: "https://business.facebook.com/adsmanager",
  TikTok: "https://ads.tiktok.com",
  LinkedIn: "https://www.linkedin.com/campaignmanager",
};


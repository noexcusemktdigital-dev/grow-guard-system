export interface DiagField {
  key: string;
  label: string;
  type: "text" | "select" | "textarea" | "checkbox-group" | "conditional-text" | "slider";
  placeholder?: string;
  options?: string[];
  conditionKey?: string;
  conditionValues?: string[];
  subFields?: DiagField[];
  min?: number;
  max?: number;
}

export interface DiagSection {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  fields: DiagField[];
}

// Service IDs available in the calculator for mapping
export const CALCULATOR_SERVICE_IDS = [
  "logo-manual", "material-marca", "midia-off", "naming", "registro-inpi",
  "ebook", "apresentacao-comercial",
  "artes-organicas", "videos-reels", "programacao-meta", "programacao-linkedin",
  "programacao-tiktok", "programacao-youtube", "capa-destaques", "criacao-avatar",
  "template-canva", "edicao-youtube",
  "gestao-meta", "gestao-google", "gestao-linkedin", "gestao-tiktok",
  "config-gmb", "artes-campanha", "videos-campanha",
  "pagina-site", "lp-link-bio", "lp-vsl", "lp-vendas", "lp-captura", "lp-ebook",
  "alterar-contato", "alterar-secao", "ecommerce",
  "config-crm",
] as const;

// @ts-nocheck
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

// src/app/models/system-faqs.models.ts

export interface SystemFaqItem {
  id: number;
  question: string;
  answer: string;
  categoria: string | null;
  activo: 0 | 1;
  version: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

export interface SystemFaqListResponse {
  exito: boolean;
  data: SystemFaqItem[];
}

export interface SystemFaqSingleResponse {
  exito: boolean;
  mensaje: string;
  data: SystemFaqItem;
}

export interface SystemFaqDeleteResponse {
  exito: boolean;
  mensaje: string;
}

export interface SystemFaqCategoriasResponse {
  exito: boolean;
  data: string[];
}

export interface CreateSystemFaqDto {
  question: string;
  answer: string;
  categoria?: string | null;
}

export type UpdateSystemFaqDto = CreateSystemFaqDto;

// ── Mismo criterio de acceso que las FAQs de modelo ──────────────────────────
export const SYSTEM_FAQ_EDIT_ACCESS = [8, 10] as const;
export type SystemFaqEditAccess = typeof SYSTEM_FAQ_EDIT_ACCESS[number];

export function canEditSystemFaqs(fullaccess?: number): boolean {
  if (fullaccess === undefined) return false;
  return SYSTEM_FAQ_EDIT_ACCESS.includes(fullaccess as SystemFaqEditAccess);
}

// Filtro "activo" para la UI: todas / solo activas / solo inactivas
export type ActivoFilter = 'all' | '1' | '0';
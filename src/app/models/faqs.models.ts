// src/app/models/faqs.models.ts

export interface FaqItem {
  id: number;
  model_id: number | string;
  question: string;
  answer: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}


export interface FaqListResponse {
  exito: boolean;
  
 data: FaqItem[];
}


export interface FaqSingleResponse {
  exito: boolean;
  
  mensaje: string;
  data: FaqItem;
}


export interface FaqDeleteResponse {
  exito: boolean;
  
  mensaje: string;
}

export interface CreateFaqDto {
  modelId: number | string;
  question: string;
  answer: string;
}


export interface UpdateFaqDto {
  question: string;
  answer: string;
}


export const FAQ_EDIT_ACCESS = [8, 10] as const;


export type FaqEditAccess = typeof FAQ_EDIT_ACCESS[number];


export function canEditFaqs(fullaccess?: number): boolean {
  if (fullaccess === undefined) return false;
  return FAQ_EDIT_ACCESS.includes(fullaccess as FaqEditAccess);
}
// src/app/models/terminos.model.ts
export interface AliasItem {
  id: number;
  alias: string;
  created_at: string;
}

export interface Termino {
  id: number;
  termino: string;
  activo: number;
  created_at: string;
  alias: AliasItem[];
}

export interface CreateTerminoInput {
  termino: string;
  alias?: string[];
}

export interface UpdateTerminoInput {
  termino?: string;
  activo?: number;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  termino?: T;
  terminos?: T[];
  conteo?: number;
  alias?: AliasItem;
  message?: string;
  error?: string;
}
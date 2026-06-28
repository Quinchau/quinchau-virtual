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
  id_entidad?: number | null;
  entidad_nombre?: string | null;
  alias: AliasItem[];
}

export interface CreateTerminoInput {
  termino: string;
  alias?: string[];
  id_entidad?: number | null;
}

export interface UpdateTerminoInput {
  termino?: string;
  activo?: number;
  id_entidad?: number | null;
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

export interface Entidad {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
}
// src/app/models/campanas.model.ts

export type EstadoCampana = 'en_pausa' | 'en_proceso' | 'terminada';
export type EstadoDetalle = 'pendiente' | 'enviado' | 'fallido';

export interface Campana {
  id_campana: number;
  typeid: number;
  modelo_descrip: string;
  plantilla: string;
  estado: EstadoCampana;
  total_destinatarios: number;
  pendientes: number;
  enviados: number;
  fallidos: number;
  created_at: string;
  updated_at: string;
  finalizada_en: string | null;
}

export interface CampanaDetalleItem {
  telefono: string;
  nombre: string;
  origen: 'cliente' | 'visitante';
  estado: EstadoDetalle;
  ghl_contact_id: string | null;
  error: string | null;
  intentos: number;
  enviado_en: string | null;
}

export interface CampanaConDetalle extends Campana {
  detalle: CampanaDetalleItem[];
}

export interface CrearCampanaPayload {
  typeid: number;
  plantilla: string;
  test_phone?: string;
}

export interface CrearCampanaResult {
  id_campana?: number;
  typeid: number;
  modelo_descrip?: string;
  catalogo_url?: string;
  plantilla: string;
  total_encolados: number;
  campana_activa?: Campana;
  error?: string;
}

export interface TransicionResult {
  success: boolean;
  id_campana: number;
  estado?: EstadoCampana;
  error?: string;
}

export type ResultadoFinal = 'exitosa' | 'con_fallos' | 'cancelada';

/**
 * Deriva cómo terminó una campaña 'terminada', sin campo extra en backend.
 */
export function obtenerResultadoFinal(c: Campana): ResultadoFinal | null {
  if (c.estado !== 'terminada') return null;
  if (c.pendientes > 0) return 'cancelada';
  return c.fallidos > 0 ? 'con_fallos' : 'exitosa';
}

/**
 * Obtiene el texto y color para el badge de estado de una campaña
 */
export function getEstadoBadgeInfo(c: Campana): { text: string; classes: string } {
  if (c.estado === 'en_pausa') {
    return { text: 'EN PAUSA', classes: 'bg-amber-100 text-amber-700' };
  }
  if (c.estado === 'en_proceso') {
    return { text: 'ENVIANDO', classes: 'bg-green-100 text-green-700' };
  }
  // estado === 'terminada'
  const resultado = obtenerResultadoFinal(c);
  if (resultado === 'exitosa') {
    return { text: 'COMPLETADA', classes: 'bg-green-100 text-green-700' };
  }
  if (resultado === 'con_fallos') {
    return { text: 'CON FALLOS', classes: 'bg-amber-100 text-amber-700' };
  }
  return { text: 'CANCELADA', classes: 'bg-slate-100 text-slate-600' };
}
// src/app/models/on-demand.model.ts

export type OnDemandStatus = 'pending' | 'available' | 'notified' | 'closed';
export type OnDemandDisplayStatus = 'pending' | 'available' | 'replacement_available' | 'notified' | 'closed';
export type OnDemandType = 'original' | 'replacement';

export interface OnDemandProducto {
  stockid: string;
  descripcion: string;
  stock_actual: number;
  imagen: string | null;
}

export interface OnDemandCliente {
  tipo: string;
  nombre: string;
  email: string | null;
  telefono: string;
  whatsapp_url: string;
}

export interface OnDemandNotificacion {
  notificado: boolean;
  ultima_notificacion: string | null;
  total_notificaciones: number;
}

export interface OnDemandSubscription {
  id: number;
  stockid: string;
  parent_id: number | null;
  type: OnDemandType;
  status: OnDemandStatus;
  display_status: OnDemandDisplayStatus;
  created_at: string;
  producto: OnDemandProducto;
  cliente: OnDemandCliente;
  notificacion: OnDemandNotificacion;
}

export interface OnDemandListResponse {
  exito: boolean;
  total: number;
  data: OnDemandSubscription[];
}
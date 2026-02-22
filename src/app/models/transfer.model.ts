// src/app/models/transfer.model.ts
export interface Transfer {
  idtransfer: number;
  stockid: string;
  description: string;
  shipqty: number;
  status: string;
  tipo: 'ship' | 'rec';
  location_name: string;
}

export interface TransferenciaDetalle {
  idtransfer: number;
  reference: number;
  stockid: string;
  shipqty: number;
  recqty: number;
  shipdate: string;
  recdate: string;
  status: 'Pendiente' | 'Recogido' | 'Entregado' | 'Devuelto' ;
  longdescription: string;
  units: string;
  shiploc_name: string;
  recloc_name: string;
  shiploc_qty: number;
  shiplocation: string;
  recloc_qty: number | null;
  reclocation: string;
  user_name: string;
  tipo: 'ship' | 'rec' | 'unknown';
  imagenes: string[];
}

export interface NewTransfer {
  stockid: string;
  shipqty: number;
  shiploc: string;
  recloc: string;
  user: string;
}

export interface User {
  realname: string;
  defaultlocation: string;
  fullaccess: number;
}

export interface NewTransfer {
  stockid: string;
  shipqty: number;
  shiploc: string;
  recloc: string;
  user: string;
}

export interface Product {
  stockid: string;
  description: string;
  longdescription: string;
  units: string;
  price_with_tax: number;
  total_quantity: number;
  idmodelo: number;
  tags: string | null;
  latest_trandate: string;
  cover_image_id: string;
  all_image_ids: string | null;
  url: string;
  modelo_ids: number[];
  modelos: string[];
}

export interface AvailableLocation {
  loccode: string;
  locationname: string;
  qty: number;
}

export interface ProductDetailData {
  stockid: string;
  longdescription: string;
  units: string;
  idmodelo: string | null;
  tags: string | null;
  latest_trandate: string | null;
  cover_image_id: string | null;
  all_image_ids: string[] | null;
  available_locations: AvailableLocation[] | null;
}
export interface DashboardResponse {
  userData: User;          
  transfers: Transfer[];
}

export interface ProductFilter {
  query: string;
  stock: boolean;
}

export interface Visitante {
  id: number;
  tipo: 'visitante' | 'visitante_nuevo' | 'usuario';  // Añadimos tipo
  token?: string;                                      // Token opcional (solo en nuevos)
  nuevo?: boolean | number;                            // Indicador de nuevo visitante
  payload?: any;                                       // Payload completo del JWT
  session_key?: string;                                // Session key si existe
}

export interface HomeData {
  banners: any[];                                       // Ajusta el tipo según tu estructura
  modelos: any[];                                       // Ajusta el tipo según tu estructura
  visitante?: Visitante;                                // Visitante (nuevo o existente)
  identidad?: any;                                      // Para cuando viene identidad de usuario
  _debug?: any;                                          // Para debug (opcional)
}

export interface Banner {
  idbanner: string;
  titulo: string;
  descripcion: string;
  img_url: string;
  link_url: string;
}

export interface Modelo {
  idmodelo: string;
  idmarca: string;
  modeldescrip: string;
  img_url: string;
  show_web: string; // Viene como string "0" o "1" desde PHP
  url_filtro: string; // Nuestra URL absoluta
  seo_note: string;   // Para el title del link
  alt_text: string;   // Para la accesibilidad de la imagen
}
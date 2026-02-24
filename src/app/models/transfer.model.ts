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
  qty_in_order: number;
}

export interface ProductListResponse {
  productos: Product[];
  identidad?: Visitante;
}

export interface ProductDetailResponse extends Product {
  identidad: Visitante;
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
  tipo: 'visitante' | 'visitante_nuevo' | 'usuario';
  cantidad_referencias?: number;
  token?: string;
  nuevo?: boolean | number;
  payload?: any;
  session_key?: string;
}

export interface HomeData {
  banners: any[];
  modelos: any[];
  visitante?: Visitante;
  identidad?: any;
  _debug?: any;
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
  show_web: string;
  url_filtro: string;
  seo_note: string;
  alt_text: string;
}
// src/app/models/transfer.model.ts
export interface Transfer {
  idtransfer: number;
  stockid: string;
  description: string;
  shipqty: number;
  status: string;
  tipo: 'ship' | 'rec';
  location_name: string;
  loccode: string; 
  cover_image_url: string | null;
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
  waitlist?: string[];
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
  slug: string;
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
  waitlist?: string[];
}

export interface HomeData {
  banners: Banner[];
  modelos: Modelo[];
  visitante?: Visitante;
  identidad?: Visitante;
  categorias?: CategoriaNavegacion[];
  marcas?: MarcaConModelos[];
  pendingWhatsappCount?: number;
  sentTodayCount?: number;
  _debug?: any;
}

export interface CategoriaNavegacion {
  idcategoria: string;
  nombre: string;
  slug: string;
  url: string;
  marcas: MarcaConModelos[];
}

export interface MarcaConModelos {
  nombre: string;
  slug: string;
  url_seo: string;
  img_url?: string;
  modelos: Modelo[];
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
  marcadescrip: string;
  categorydescription: string;
  img_url: string;
  show_web: string;
  url_app: string;
  seo_note: string;
  alt_text: string;
}

export interface MarcaBackend {
  nombre: string;
  slug: string;
  url_seo: string;
  modelos: Modelo[];
}

export interface CategoriaBackend {
  nombre: string;
  slug: string;
  url: string;
  marcas: MarcaBackend[];
}

export interface OutgoingMessage {
  id: number;
  chat_id: string;
  phone_number: string;
  message_text: string;
  queued_at: string;
  priority: 'high' | 'low';
  campaign_id: number | null;
  status: 'pending' | 'wait' | 'sent' | 'failed';
  image: string | null;
  locked_by: string | null;
  locked_at: string | null;
  whatsapp_link: string;
}

export interface SentStats {
  today:     number;
  yesterday: number;
  week:      number;
}
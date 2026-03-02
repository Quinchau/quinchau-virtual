interface CartItem {
  item_id: number;
  stockid: string;
  description: string;
  longdescription: string;  units: string;
  quantity: number;
  price: number;
  taxrate: number;
  subtotal: number;
  image: string | null;
}


export interface CartResponse {
  exito: boolean;
  cotizacion_id: number;
  items: CartItem[];
  total: number;
  cantidad_items: number;
  identidad: any;
}

export interface DatosRegistro {
  nombre: string;
  prefijo: string;
  numero: string;
}

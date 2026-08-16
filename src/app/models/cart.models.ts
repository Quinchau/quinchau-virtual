// src/app/models/cart.models.ts
// Basado en la doc técnica "API de Carritos (Cotizaciones)".

export type CotizacionEstatus = 'Pendiente' | 'Abandonado' | 'Cerrado' | 'Cancelado';

export interface CartItem {
    stockid: string;
    price: number;
    taxrate: number;
    quantity: number;
    description: string | null;
    cover_image: string | null;
    url: string | null;
}

export interface CartOrder {
    cotizacion_id: number;
    typeabbrev: string;
    status: CotizacionEstatus;
    date: string; // ISO 8601
    items: CartItem[];
}

/** Carrito huérfano (sin cotizacion_cliente_id) — GET /api/cart/abandonados */
export interface AbandonedCart extends CartOrder {
    visitante_id: string | null;
    visitante_nombre: string | null;
    visitante_telefono_prefijo: string | null;
    visitante_telefono_numero: string | null;
}

export interface AbandonedCartsResponse {
    error: false;
    carts: AbandonedCart[];
}

export interface MarkAbandonedResponse {
    error: false;
    message: string;
}

export interface CartApiError {
    error: true;
    message: string;
}

/** Cliente con sus carritos exitosos (checkout completado, cliente_id != NULL) — GET /api/cart/exitosos */
export interface ClientWithOrders {
    client_id: number;
    client_name: string;
    orders: CartOrder[];
}

export interface SuccessfulCartsResponse {
    error: false;
    clients: ClientWithOrders[];
}
// src/app/pages/orders/orders.models.ts

export interface WarehouseOption {
    stkloc: string;
    description: string;
}

export interface StockAvailabilityData {
    stkcode: string;
    shiploc: string;
    shiplocStock: number;
    requiresSelection: boolean;
    autoTransfer?: boolean;
    autoSource?: string;
    totalAvailable?: number;
    locations: StockLocation[];
}

export interface StockAvailabilityResponse {
    exito: boolean;
    data: StockAvailabilityData;
}

export interface StockLocation {
    stkloc: string;
    description: string;
    available: number;
    selectedQty?: number;
}

export interface CreateOrderPayload {
    debtorno: string;
    branchcode: string;
    ordertype: string;
    shipvia?: number;
    deliverydate?: string;
    comments?: string;
    shiploc: string;
    deliverto?: string;
    contactphone?: string;
    deladd1?: string;
    deladd2?: string;
    deladd3?: string;
    is_different_shipping_address?: boolean;
    customer_id?: string;
    shipping_carrier?: string;
}

export interface AddLinePayload {
    stkcode: string;
    quantity: number;
    discountpercent?: number;
    narrative?: string;
    sourceloc?: string;
}

export interface OrderLine {
    orderlineno: number;
    stkcode: string;
    description: string;
    units: string;
    quantity: number;
    unitprice: number;
    discountpercent: number;
    line_total: number;
    standardcost: number;
    stock_disponible: number;
    sourceloc: string | null;
    transferStatus: 'pending' | 'completed' | null;
}

export interface AddLineResponse {
    exito: boolean;
    mensaje: string;
    data: OrderLine;
}

export interface CreateOrderResponse {
    exito: boolean;
    mensaje: string;
    data: { orderno: number };
}

export interface UpdateLinePayload {
    quantity: number;
    unitprice: number;
    discountpercent: number;
    narrative?: string;
}

export interface CustomerResult {
    debtorno: string;
    name: string;
    taxref: string;
    currcode: string;
    salestype: string;
    branchcode: string;
    brname: string;
    area: string;
    salesman: string;
    phoneno: string;
    defaultlocation: string;
    braddress1?: string;
}

export interface CustomerDisplay {
    debtorno: string;
    name: string;
    taxref: string;
    area: string;
    salesman: string;
    phoneno: string;
    branches: CustomerResult[];
}
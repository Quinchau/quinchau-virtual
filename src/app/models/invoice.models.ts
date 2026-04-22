// ─────────────────────────────────────────────────────────────
//  MODELOS — invoice.models.ts
// ─────────────────────────────────────────────────────────────

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
}

export interface CustomerSearchResponse {
  exito: boolean;
  total: number;
  data: CustomerResult[];
}

/**
 * Cliente único para mostrar en la lista de selección.
 * Agrupa todos los branches de un mismo debtorno.
 * El branch correcto se resuelve en confirmCustomer() según defaultlocation.
 */
export interface CustomerDisplay {
  debtorno: string;
  name: string;
  taxref: string;
  area: string;
  salesman: string;
  phoneno: string;
  /** Todos los branches que el backend devolvió para este cliente */
  branches: CustomerResult[];
}

export interface CreateOrderPayload {
  debtorno: string;
  branchcode: string;
  ordertype: string;
  shipvia?: number;
  deliverydate?: string;
  comments?: string;
}

export interface CreateOrderResponse {
  exito: boolean;
  mensaje: string;
  data: { orderno: number };
}

export interface AddLinePayload {
  stkcode: string;
  quantity: number;
  discountpercent?: number;
  narrative?: string;
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
}

export interface AddLineResponse {
  exito: boolean;
  mensaje: string;
  data: OrderLine;
}

export interface UpdateLinePayload {
  quantity: number;
  unitprice: number;
  discountpercent: number;
  narrative?: string;
}

export interface UpdateLineResponse {
  exito: boolean;
  mensaje: string;
  data: {
    orderno: number;
    orderlineno: number;
    quantity: number;
    unitprice: number;
    discountpercent: number;
  };
}

export interface TaxEntry {
  taxAuthId: number;
  description: string;
  taxRate: number;
  taxAmount: number;
}

export interface PreviewLine {
  orderlineno: number;
  stkcode: string;
  description: string;
  units: string;
  qtyPending: number;
  unitprice: number;
  discountpercent: number;
  lineTotal: number;
  taxAmount: number;
  lineTotalWithTax: number;
  taxes: TaxEntry[];
}

export interface PaymentMethod {
  paymentid: number;
  paymentname: string;
}

export interface InvoicePreview {
  orderno: number;
  debtorno: string;
  customerName: string;
  branchcode: string;
  fromstkloc: string;
  ordertype: string;
  currencyRate: number;
  freightCost: number;
  lines: PreviewLine[];
  subtotal: number;
  taxTotal: number;
  freightTax: number;
  grandTotal: number;
  paymentMethods: PaymentMethod[];
}

export interface InvoicePreviewResponse {
  exito: boolean;
  data: InvoicePreview;
}

export interface ValidateResponse {
  exito: boolean;
  data: { valido: boolean; lineas?: number; mensaje?: string };
}

export interface ExecuteInvoicePayload {
  dispatchDate: string;
  paymentMethodId: number;
  invoiceText: string;
  consignment: string;
  boPolicy: 'CAN' | 'BO';
  chargeFreightCost: number;
}

export interface ExecuteInvoiceResponse {
  exito: boolean;
  mensaje: string;
  data: {
    invoiceNo: number;
    total: number;
    taxTotal: number;
    grandTotal: number;
  };
}
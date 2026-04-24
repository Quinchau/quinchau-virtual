// ─── Catálogos de branch ─────────────────────────────────────────────────────

export interface Area {
    areacode:        string;
    areadescription: string;
}

export interface Salesman {
    salesmancode: string;
    salesmanname: string;
}

export interface BranchCatalogsResponse {
    areas:    Area[];
    salesman: Salesman[];
}

// ─── Branch ──────────────────────────────────────────────────────────────────

export interface Branch {
    branchcode:          string;
    debtorno:            string;
    brname:              string;
    braddress1:          string;
    braddress2:          string;
    braddress3:          string;
    braddress4:          string;
    braddress5:          string;
    braddress6:          string;
    area:                string;
    salesman:            string;
    phoneno:             string;
    faxno:               string;
    contactname:         string;
    email:               string;
    defaultlocation:     string;
    taxgroupid:          number;
    defaultshipvia:      number;
    deliverblind:        number;
    disabletrans:        number;
    specialinstructions: string;
    transactionCount:    number;   // COUNT desde stockmoves
}

export interface CreateBranchPayload {
    branchCode:           string;
    brname?:              string;
    braddress1?:          string;
    braddress2?:          string;
    braddress3?:          string;
    braddress4?:          string;
    braddress5?:          string;
    braddress6?:          string;
    area:                 string;
    salesman?:            string;
    phoneno?:             string;
    faxno?:               string;
    contactname?:         string;
    email?:               string;
    defaultlocation:      string;
    taxgroupid?:          number;
    defaultshipvia?:      number;
    specialinstructions?: string;
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

export interface CustomerSummary {
    debtorno:       string;
    name:           string;
    address1:       string;
    currcode:       string;
    holdreason:     number;
    creditlimit:    number;
    salestype:      string;
    paymentterms:   string;
    clientsince:    string;
    taxref:         string;
    total_branches: number;
}

// Datos del cliente (sin incluir branches)
export interface CustomerData {
    debtorno:      string;
    name:          string;
    address1:      string;
    address2:      string;
    address3:      string;
    address4:      string;
    address5:      string;
    address6:      string;
    currcode:      string;
    salestype:     string;
    typeid:        number;
    discount:      number;
    pymtdiscount:  number;
    creditlimit:   number;
    paymentterms:  string;
    holdreason:    number;
    taxref:        string;
    discountcode:  string;
    zona:          string;
}

// Estructura completa de la respuesta del API (getCustomer)
export interface CustomerDetailResponse {
    customer: CustomerData;
    branches: Branch[];
}

// Para compatibilidad con código existente que espera CustomerDetail
export interface CustomerDetail extends CustomerData {
    branches: Branch[];
}

// Estructura de respuesta para getCustomer con la estructura anidada real
export interface CustomerDetailResult {
    exito: boolean;
    data: CustomerDetailResponse;
}

// Estructura de respuesta para list/search (retorna array de CustomerSummary)
export interface CustomerSearchResult {
    exito: boolean;
    total: number;
    data: CustomerSummary[];
}

// Estructura de respuesta para create/update (retorna datos simples)
export interface CustomerSaveResult {
    exito: boolean;
    mensaje: string;
    data?: {
        debtorNo: string;
        branchCode?: string;
    };
}
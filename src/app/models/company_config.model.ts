export interface CompanyConfig {
  coycode: string;
  coyname: string;
  gstno: string;
  companynumber: string;
  regoffice1: string;
  regoffice2: string;
  regoffice3: string;
  regoffice4: string;
  regoffice5: string;
  regoffice6: string;
  telephone: string;
  fax: string;
  email: string;
  currencydefault: string;
  taxrate: number;
}

export interface ConfigResponse {
  identidad: any; // O el tipo Visitante si lo importas aquí
  company: CompanyConfig | null;
}
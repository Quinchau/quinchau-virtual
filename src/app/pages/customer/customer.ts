import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { Currency, SalesType, DebtorType } from '../../models/company_config.model';
 
@Component({
  selector: 'app-customer',
  imports: [FormsModule],
  templateUrl: './customer.html',
  styles: '',
})
export class Customer implements OnInit {
 
  private apis   = inject(ManagerApis);
  private router = inject(Router);
 
  // ── Catálogos ────────────────────────────────────────────
  currencies  = signal<Currency[]>([]);
  salesTypes  = signal<SalesType[]>([]);
  debtorTypes = signal<DebtorType[]>([]);
  loadingCatalogs = signal(true);
 
  // ── Formulario ───────────────────────────────────────────
  form = {
    debtorNo:     '',
    name:         '',
    currcode:     '',
    salestype:    '',
    typeid:       1,
    discount:     0,
    creditlimit:  0,
    paymentterms: '20',
    holdreason:   0,
  };
 
  // ── Estado de envío ──────────────────────────────────────
  saving  = signal(false);
  error   = signal<string | null>(null);
 
  ngOnInit() {
    this.apis.getCatalogs().subscribe({
      next: (data) => {
        this.currencies.set(data.currencies);
        this.salesTypes.set(data.salesTypes);
        this.debtorTypes.set(data.debtorTypes);
        // Preseleccionar primer valor de cada catálogo
        this.form.currcode     = data.currencies[0]?.currabrev  ?? '';
        this.form.salestype    = data.salesTypes[0]?.typeabbrev  ?? '';
        this.form.typeid       = data.debtorTypes[0]?.typeid     ?? 1;
        this.loadingCatalogs.set(false);
      },
      error: () => this.loadingCatalogs.set(false),
    });
  }

  onDebtorNoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
 
  setHoldReason(value: 0 | 1) {
    this.form.holdreason = value;
  }
 
  guardar() {
    this.error.set(null);
    this.saving.set(true);
    this.apis.createCustomer(this.form).subscribe({
      next: () => this.router.navigate(['/customers']),
      error: (err) => {
        this.error.set(err?.error?.mensaje ?? 'Error al guardar el cliente');
        this.saving.set(false);
      },
    });
  }
}
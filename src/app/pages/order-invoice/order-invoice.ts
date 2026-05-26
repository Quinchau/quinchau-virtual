import { Component, inject, signal, computed, OnInit, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';

@Component({
  selector: 'app-order-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-invoice.html'
})
export class OrderInvoice implements OnInit {
  private apis = inject(ManagerApis);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly loadingInvoice = signal(false);
  readonly error = signal('');
  readonly invoiceError = signal('');
  readonly successMessage = signal('');
  readonly preview = signal<any | null>(null);
  readonly orderno = signal<number | null>(null);

  // Formulario con Signals
  readonly dispatchDate = signal(new Date().toISOString().split('T')[0]);
  readonly invoiceText = signal('');
  readonly consignment = signal('');
  
  readonly selectedPaymentMethodId = linkedSignal({
    source: this.preview,
    computation: (p) => p?.paymentMethods[0]?.paymentid ?? 0
  });

  readonly freightCost = linkedSignal({
    source: this.preview,
    computation: (p) => p?.freightCost ?? 0
  });

  // Resumen de montos calculado en tiempo real
  readonly currentTotals = computed(() => {
    const p = this.preview();
    if (!p) return { subtotal: 0, tax: 0, freight: 0, total: 0 };

    const subtotal = p.subtotal || 0;
    const tax = p.taxTotal || 0;
    const freight = Number(this.freightCost()) || 0;

    return {
      subtotal,
      tax,
      freight,
      total: subtotal + tax + freight
    };
  });

  readonly canInvoice = computed(() => {
    return this.selectedPaymentMethodId() > 0 &&
           this.invoiceText().trim().length > 0 &&
           this.dispatchDate().length > 0 &&
           !this.loadingInvoice();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('orderno');
    if (id) {
      this.orderno.set(parseInt(id, 10));
      this.loadOrderPreview();
    }
  }

  private loadOrderPreview(): void {
    this.loading.set(true);
    this.apis.getInvoicePreview(this.orderno()!).subscribe({
      next: (res: any) => {
        this.preview.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.mensaje || 'Error al cargar preview');
        this.loading.set(false);
      }
    });
  }

  generateInvoice(): void {
  if (!this.canInvoice()) return;

  this.loadingInvoice.set(true);

  const [year, month, day] = this.dispatchDate().split('-').map(Number);
  const localDate = new Date(year, month - 1, day).toLocaleDateString('en-CA'); 

  const payload = {
    dispatchDate: localDate,
    paymentMethodId: this.selectedPaymentMethodId(),
    invoiceText: this.invoiceText().trim(),
    consignment: this.consignment().trim(),
    chargeFreightCost: this.freightCost(),
    boPolicy: 'BO' as const
  };

  this.apis.executeInvoice(this.orderno()!, payload).subscribe({
    next: (res: any) => {
      this.successMessage.set(`Factura #${res.data.invoiceNo} generada`);
      setTimeout(() => this.router.navigate(['/order-list']), 2000);
    },
    error: (err) => {
      this.invoiceError.set(err?.error?.mensaje || 'Error en proceso');
      this.loadingInvoice.set(false);
    }
  });
}

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }

  goBack() { this.router.navigate(['/order-list']); }
}
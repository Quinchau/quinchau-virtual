// src/app/pages/invoice/invoice.ts

import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { ManagerApis } from '../../services/manager-apis';
import { Home } from '../home/home';
import { ProductPicker } from '../../components/product-picker/product-picker';
import {
  CustomerResult,
  CustomerDisplay,
  CreateOrderPayload,
  OrderLine,
  AddLinePayload,
  UpdateLinePayload,
  InvoicePreview,
  ExecuteInvoicePayload,
} from '../../models/invoice.models';


@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductPicker],
  templateUrl: './invoice.html',
  styles: ``,
})
export class Invoice implements OnDestroy {

  private apis = inject(ManagerApis);

  // ── Estado de UI ──────────────────────────────────────────
  readonly loadingSearch   = signal(false);
  readonly loadingConfirm  = signal(false);
  readonly loadingAddLine  = signal(false);
  readonly loadingPreview  = signal(false);
  readonly loadingInvoice  = signal(false);

  readonly searchError     = signal('');
  readonly addLineError    = signal('');
  readonly invoiceError    = signal('');
  readonly successMessage  = signal('');
  readonly sec1State = signal<'search' | 'confirm' | 'frozen'>('search');
  readonly customerResults = signal<CustomerDisplay[]>([]);
  readonly selectedCustomer = signal<CustomerDisplay | null>(null);
  readonly selectedBranch = signal<CustomerResult | null>(null);
  readonly orderno = signal<number | null>(null);
  readonly lines = signal<OrderLine[]>([]);
  readonly preview = signal<InvoicePreview | null>(null);
  readonly showErrorModal = signal(false);
  readonly errorModalTitle = signal('');
  readonly errorModalMessage = signal('');

  /** Controla la visibilidad del overlay de búsqueda de productos */
  readonly showProductPicker = signal(false);

  // ── Campos del formulario ─────────────────────────────────
  phoneInput      = '';
  productCode     = '';
  productQty      = 1;
  productDiscount = 0;

  readonly paymentMethodId = signal(0);
  readonly dispatchDate    = signal(this.todayIso());
  readonly boPolicy        = signal<'CAN' | 'BO'>('BO');
  readonly freight         = signal(0);
  readonly consignment     = signal('');
  readonly invoiceText     = signal('');
  readonly sec2Active = computed(() => this.orderno() !== null);
  readonly sec3Active = computed(() => this.lines().length > 0);
  readonly taxRateLabel = computed(() => {
    const p = this.preview();
    if (!p?.lines?.[0]?.taxes?.[0]) return 'IVA';
    const rate = (p.lines[0].taxes[0].taxRate * 100).toFixed(0);
    return `IVA (${rate}%)`;
  });

  readonly summarySubtotal  = computed(() => this.preview()?.subtotal ?? 0);
  readonly summaryTax       = computed(() => this.preview()?.taxTotal ?? 0);
  readonly summaryTotal     = computed(() => this.preview()?.grandTotal ?? 0);
  readonly summaryDiscounts = computed(() =>
    this.lines().reduce((acc, l) =>
      acc + (l.unitprice * l.quantity * (l.discountpercent / 100)), 0)
  );

  readonly paymentMethods = computed(() => this.preview()?.paymentMethods ?? []);

  readonly canInvoice = computed(() =>
    this.sec3Active() &&
    this.paymentMethodId() > 0 &&
    this.invoiceText().trim().length > 0 &&
    this.dispatchDate().length > 0
  );

  // ─────────────────────────────────────────────────────────
  //  PRODUCT PICKER
  // ─────────────────────────────────────────────────────────

  /**
   * Abre el overlay del buscador de productos.
   * Solo disponible cuando hay un pedido activo (sec2Active).
   */
  openProductPicker(): void {
    this.showProductPicker.set(true);
  }

  /**
   * Cierra el overlay del buscador de productos.
   */
  closeProductPicker(): void {
    this.showProductPicker.set(false);
  }

  /**
   * Recibe el producto emitido por app-home en modo 'picker'.
   * Puebla productCode con el stkcode y dispara addLine() automáticamente.
   */
  onProductPicked(product: any): void {
    this.showProductPicker.set(false);
    this.productCode = product.stkcode ?? product.stockid ?? '';
    this.addLineError.set('');
    this.addLine();
  }

  // ─────────────────────────────────────────────────────────
  //  SECCIÓN 1 — CLIENTE
  // ─────────────────────────────────────────────────────────

  searchCustomer(): void {
    if (this.phoneInput.trim().length < 5) {
      this.searchError.set('Ingrese al menos 5 dígitos.');
      return;
    }
    this.searchError.set('');
    this.loadingSearch.set(true);
    this.customerResults.set([]);
    this.selectedCustomer.set(null);
    this.selectedBranch.set(null);
    this.sec1State.set('search');

    this.apis.searchCustomerByPhone(this.phoneInput.trim()).subscribe({
      next: (res) => {
        this.loadingSearch.set(false);

        if (!res.exito || !res.data?.length) {
          this.searchError.set('No se encontró ningún cliente con ese número.');
          return;
        }

        const map = new Map<string, CustomerDisplay>();

        for (const row of res.data) {
          if (!map.has(row.debtorno)) {
            map.set(row.debtorno, {
              debtorno: row.debtorno,
              name:     row.name,
              taxref:   row.taxref,
              area:     row.area,
              salesman: row.salesman,
              phoneno:  row.phoneno,
              branches: [row],
            });
          } else {
            const existing = map.get(row.debtorno)!;
            existing.branches.push(row);

            if (row.name && row.name.length < existing.name.length) {
              existing.name = row.name;
            }
            if (row.taxref && row.taxref !== existing.taxref) {
              existing.taxref = row.taxref;
            }
          }
        }

        const uniqueCustomers = Array.from(map.values());

        if (uniqueCustomers.length === 0) {
          this.searchError.set('No se encontró ningún cliente con ese número.');
          return;
        }

        this.customerResults.set(uniqueCustomers);
        this.sec1State.set('confirm');
      },
      error: () => {
        this.loadingSearch.set(false);
        this.searchError.set('Error al conectar con el servidor.');
      }
    });
  }

  selectCustomer(customer: CustomerDisplay): void {
    this.selectedCustomer.set(customer);
    this.selectedBranch.set(null);
    this.searchError.set('');
  }

  confirmCustomer(): void {
  const customer = this.selectedCustomer();
  if (!customer) {
    this.searchError.set('Por favor, seleccione un cliente de la lista.');
    return;
  }

  const validBranch = customer.branches.find(b => b.defaultlocation);

  if (!validBranch) {
    this.errorModalTitle.set('Cliente no asignado al Almacén');
    this.errorModalMessage.set(
      `El cliente "${customer.name}" no tiene una delegación registrada para su almacén.\n\n` +
      `Por favor, solicite al administrador que registre la delegación antes de facturar.`
    );
    this.showErrorModal.set(true);
    return;
  }

  this.loadingConfirm.set(true);
  this.selectedBranch.set(validBranch);

  const deliveryDate = new Date(Date.now() + 4 * 86_400_000)
    .toISOString().split('T')[0];

  const payload: CreateOrderPayload = {
    debtorno:     validBranch.debtorno,
    branchcode:   validBranch.branchcode,
    ordertype:    validBranch.salestype || '01',
    shipvia:      1,
    deliverydate: deliveryDate,
    comments:     '',
  };

  this.apis.createOrder(payload).subscribe({
    next: (res) => {
      this.loadingConfirm.set(false);
      if (!res.exito) {
        this.searchError.set(res.mensaje || 'Error al crear el pedido.');
        return;
      }
      this.orderno.set(res.data.orderno);
      this.sec1State.set('frozen');
    },
    error: (err) => {
      this.loadingConfirm.set(false);
      this.searchError.set(err?.error?.mensaje || 'Error al conectar con el servidor.');
    }
  });
}

  changeCustomer(): void {
    const confirmed = this.lines().length > 0
      ? confirm('¿Cambiar de cliente? Se perderán las líneas del pedido actual.')
      : true;

    if (!confirmed) return;

    const order = this.orderno();
    if (order) {
      this.apis.deleteOrder(order).subscribe({ error: () => {} });
    }

    this.resetAll();
  }

  // ─────────────────────────────────────────────────────────
  //  SECCIÓN 2 — LÍNEAS
  // ─────────────────────────────────────────────────────────

  addLine(): void {
    const orderno = this.orderno();
    if (!orderno) return;
    if (!this.productCode.trim()) {
      this.addLineError.set('Ingrese un código de producto.');
      return;
    }
    this.addLineError.set('');
    this.loadingAddLine.set(true);

    const payload: AddLinePayload = {
      stkcode:         this.productCode.trim(),
      quantity:        this.productQty,
      discountpercent: this.productDiscount,
    };

    this.apis.addOrderLine(orderno, payload).subscribe({
      next: (res) => {
        this.loadingAddLine.set(false);
        if (!res.exito) {
          this.addLineError.set(res.mensaje || 'Error al agregar el producto.');
          return;
        }
        this.lines.update(lines => [...lines, res.data]);
        this.productCode     = '';
        this.productQty      = 1;
        this.productDiscount = 0;
        this.loadPreview();
      },
      error: (err) => {
        this.loadingAddLine.set(false);
        this.addLineError.set(
          err?.error?.mensaje || 'Error al conectar con el servidor.'
        );
      }
    });
  }

  updateLine(index: number, field: 'quantity' | 'discountpercent', value: number): void {
    const orderno = this.orderno();
    const line    = this.lines()[index];
    if (!orderno || !line) return;

    const payload: UpdateLinePayload = {
      quantity:        field === 'quantity'        ? value : line.quantity,
      unitprice:       line.unitprice,
      discountpercent: field === 'discountpercent' ? value : line.discountpercent,
    };

    this.apis.updateOrderLine(orderno, line.orderlineno, payload).subscribe({
      next: (res) => {
        if (!res.exito) return;
        this.lines.update(lines =>
          lines.map((l, i) => i === index ? { ...l, ...res.data } : l)
        );
        this.loadPreview();
      },
      error: () => {}
    });
  }

  deleteLine(index: number): void {
    const orderno = this.orderno();
    const line    = this.lines()[index];
    if (!orderno || !line) return;

    if (!confirm(`¿Eliminar "${line.description || line.stkcode}" del pedido?`)) return;

    this.apis.deleteOrderLine(orderno, line.orderlineno).subscribe({
      next: () => {
        this.lines.update(lines => lines.filter((_, i) => i !== index));
        if (this.lines().length > 0) {
          this.loadPreview();
        } else {
          this.preview.set(null);
        }
      },
      error: () => {}
    });
  }

  // ─────────────────────────────────────────────────────────
  //  SECCIÓN 3 — PREVIEW Y FACTURA
  // ─────────────────────────────────────────────────────────

  private loadPreview(): void {
    const orderno = this.orderno();
    if (!orderno) return;
    this.loadingPreview.set(true);

    this.apis.getInvoicePreview(orderno).subscribe({
      next: (res) => {
        this.loadingPreview.set(false);
        if (res.exito) {
          this.preview.set(res.data);
        }
      },
      error: () => {
        this.loadingPreview.set(false);
      }
    });
  }

  generateInvoice(): void {
    if (!this.canInvoice()) return;
    const orderno = this.orderno();
    if (!orderno) return;

    this.loadingInvoice.set(true);
    this.invoiceError.set('');

    this.apis.validateInvoiceConcurrency(orderno).pipe(
      switchMap((valRes) => {
        if (!valRes.data?.valido) {
          throw new Error(
            valRes.data?.mensaje ||
            'El pedido fue modificado por otro usuario. Recarga el resumen antes de continuar.'
          );
        }
        const payload: ExecuteInvoicePayload = {
          dispatchDate:      this.dispatchDate(),
          paymentMethodId:   this.paymentMethodId(),
          invoiceText:       this.invoiceText().trim(),
          consignment:       this.consignment().trim(),
          boPolicy:          this.boPolicy(),
          chargeFreightCost: this.freight(),
        };
        return this.apis.executeInvoice(orderno, payload);
      })
    ).subscribe({
      next: (res) => {
        this.loadingInvoice.set(false);
        if (!res.exito) {
          this.invoiceError.set(res.mensaje || 'Error al generar la factura.');
          return;
        }
        this.successMessage.set(
          `Factura #${res.data.invoiceNo} generada — Total: $${res.data.grandTotal.toFixed(2)}`
        );
        setTimeout(() => this.resetAll(), 3000);
      },
      error: (err) => {
        this.loadingInvoice.set(false);
        this.invoiceError.set(
          err?.message || err?.error?.mensaje || 'Error al procesar la factura.'
        );
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────

  private resetAll(): void {
    this.sec1State.set('search');
    this.customerResults.set([]);
    this.selectedCustomer.set(null);
    this.selectedBranch.set(null);
    this.orderno.set(null);
    this.lines.set([]);
    this.preview.set(null);
    this.phoneInput      = '';
    this.productCode     = '';
    this.productQty      = 1;
    this.productDiscount = 0;
    this.paymentMethodId.set(0);
    this.dispatchDate.set(this.todayIso());
    this.boPolicy.set('BO');
    this.freight.set(0);
    this.consignment.set('');
    this.invoiceText.set('');
    this.searchError.set('');
    this.addLineError.set('');
    this.invoiceError.set('');
    this.successMessage.set('');
    this.showProductPicker.set(false);
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
  }

  closeErrorModal(): void {
    this.showErrorModal.set(false);
    this.errorModalTitle.set('');
    this.errorModalMessage.set('');
  }

  closeErrorModalAndReset(): void {
    this.showErrorModal.set(false);
    this.errorModalTitle.set('');
    this.errorModalMessage.set('');
    this.selectedCustomer.set(null);
    this.customerResults.set([]);
    this.sec1State.set('search');
    this.phoneInput = '';
  }

  // ─────────────────────────────────────────────────────────
  //  EVENT HANDLERS PARA EL TEMPLATE
  // ─────────────────────────────────────────────────────────

  onSearchCustomer(): void  { this.searchCustomer();  }
  onConfirmCustomer(): void { this.confirmCustomer(); }
  onChangeCustomer(): void  { this.changeCustomer();  }
  onAddLine(): void         { this.addLine();         }
  onGenerateInvoice(): void { this.generateInvoice(); }

  onSelectCustomer(customer: CustomerDisplay): void {
    this.selectCustomer(customer);
  }

  onUpdateLineQuantity(index: number, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) this.updateLine(index, 'quantity', value);
  }

  onUpdateLineDiscount(index: number, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) this.updateLine(index, 'discountpercent', value);
  }

  onDeleteLine(index: number): void {
    this.deleteLine(index);
  }

  onPaymentMethodChange(event: Event): void {
    this.paymentMethodId.set(
      parseInt((event.target as HTMLSelectElement).value, 10)
    );
  }

  ngOnDestroy(): void {
    const orderno  = this.orderno();
    const hasLines = this.lines().length > 0;
    if (orderno && !hasLines) {
      this.apis.deleteOrder(orderno).subscribe({ error: () => {} });
    }
  }
}
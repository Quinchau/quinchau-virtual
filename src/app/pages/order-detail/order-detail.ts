// src/app/pages/order-detail/order-detail.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';
import { ProductPicker } from '../../components/product-picker/product-picker';
import { AddLinePayload, OrderLine, StockLocation } from '../../models/orders.models';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, ProductPicker],
    templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit {

    private apis   = inject(ManagerApis);
    private router = inject(Router);
    private route  = inject(ActivatedRoute);
    public state   = inject(ManagerState);

    public readonly userLocation = this.state.userLocation;

    readonly loading        = signal(false);
    readonly loadingAction  = signal(false);
    readonly error          = signal('');
    readonly actionError    = signal('');
    readonly successMessage = signal('');

    // Uploads
    readonly uploadingVoucher     = signal(false);
    readonly uploadingShippingDoc = signal(false);

    readonly header   = signal<any>(null);
    readonly lines    = signal<any[]>([]);
    readonly orderno  = signal<number | null>(null);
    readonly docsOpen = signal(false);

    // Menú 3 puntos
    readonly openMenuLineno = signal<number | null>(null);

    // Modal editar línea
    readonly editingLine = signal<any | null>(null);
    readonly editQty     = signal<number>(1);

    // ── Agregar producto ──────────────────────────────────────────
    readonly showProductPicker    = signal(false);
    readonly loadingAddLine       = signal(false);
    readonly addLineError         = signal('');
    readonly pendingProduct       = signal<any>(null);
    readonly pendingQty           = signal(1);
    readonly addLineState         = signal<'idle' | 'loading' | 'awaiting_stock_selection' | 'awaiting_multi_stock_selection'>('idle');
    readonly pendingStockOptions  = signal<StockLocation[]>([]);
    readonly pendingProductCode   = signal('');
    readonly pendingProductQty    = signal(1);

    // ── Computed ──────────────────────────────────────────────────

    readonly isseller = computed(() =>
        this.header()?.fromstkloc === this.userLocation()
    );

    readonly isDispatch = computed(() =>
        this.header()?.shiploc === this.userLocation()
    );

    readonly allPicked = computed(() =>
        this.lines().length > 0 &&
        this.lines().every(l => l.picking_status === 1)
    );

    readonly canDeliver = computed(() =>
        this.isDispatch() && this.allPicked() && !this.header()?.delivered
    );

    readonly canInvoice = computed(() =>
        this.isseller() && this.header()?.delivered === 1
    );

    readonly canEdit = computed(() =>
        this.isseller() && !this.header()?.delivered
    );

    readonly canAddProducts = computed(() =>
        this.isseller() && !this.header()?.delivered
    );

    readonly totalDistributed = computed(() =>
        this.pendingStockOptions().reduce((sum, loc) => sum + (loc.selectedQty || 0), 0)
    );

    readonly totalStockAvailable = computed(() =>
        this.pendingStockOptions().reduce((sum, loc) => sum + loc.available, 0)
    );

    readonly grandTotal = computed(() => {
    const h = this.header();
    if (!h) return 0;
    // line_total ya incluye IVA — solo sumar flete
    return this.lines().reduce((acc, line) => acc + (Number(line.line_total) || 0), 0)
           + (Number(h.freightcost) || 0);
});

    // ── Lifecycle ─────────────────────────────────────────────────

    ngOnInit(): void {
        const orderno = parseInt(this.route.snapshot.paramMap.get('orderno') ?? '0', 10);
        this.orderno.set(orderno);
        this.loadDetail(orderno);
    }

    // ── Carga ─────────────────────────────────────────────────────

    loadDetail(orderno: number): void {
        this.loading.set(true);
        this.error.set('');

        this.apis.getOrderDetail(orderno).subscribe({
            next: (res) => {
                this.loading.set(false);
                if (!res.exito) {
                    this.error.set('Error al cargar el pedido');
                    return;
                }
                this.header.set(res.data.header);
                this.lines.set(res.data.lines);
            },
            error: () => {
                this.loading.set(false);
                this.error.set('Error al conectar con el servidor');
            }
        });
    }

    // ── Documentos ────────────────────────────────────────────────

    toggleDocs(): void {
        this.docsOpen.update(v => !v);
    }

    triggerFileUpload(type: 'voucher' | 'shipping-doc'): void {
        const orderno = this.orderno();
        if (!orderno) return;

        const input       = document.createElement('input');
        input.type        = 'file';
        input.accept      = 'image/*,application/pdf';
        input.capture     = 'environment';
        input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';

        document.body.appendChild(input);

        input.onchange = (e: any) => {
            const file = e.target.files[0];
            document.body.removeChild(input);
            if (!file) return;

            if (type === 'voucher') {
                this.uploadingVoucher.set(true);
                this.apis.uploadOrderVoucher(orderno, file).subscribe({
                    next: (res) => {
                        this.uploadingVoucher.set(false);
                        this.header.update(h => ({ ...h, voucher_url: res.data.voucher_url }));
                        this.showSuccess('Comprobante subido correctamente');
                    },
                    error: (err) => {
                        this.uploadingVoucher.set(false);
                        this.actionError.set(err?.error?.mensaje || 'Error al subir comprobante');
                    }
                });
            } else {
                this.uploadingShippingDoc.set(true);
                this.apis.uploadOrderShippingDoc(orderno, file).subscribe({
                    next: (res) => {
                        this.uploadingShippingDoc.set(false);
                        this.header.update(h => ({ ...h, shipping_doc_url: res.data.shipping_doc_url }));
                        this.showSuccess('Guía de despacho subida correctamente');
                    },
                    error: (err) => {
                        this.uploadingShippingDoc.set(false);
                        this.actionError.set(err?.error?.mensaje || 'Error al subir guía');
                    }
                });
            }
        };

        input.oncancel = () => { document.body.removeChild(input); };
        input.click();
    }

    // ── Picking ───────────────────────────────────────────────────

    pickLine(lineno: number): void {
        const orderno = this.orderno();
        if (!orderno) return;

        this.loadingAction.set(true);
        this.actionError.set('');

        this.apis.pickLine(orderno, lineno).subscribe({
            next: (res) => {
                this.loadingAction.set(false);
                if (!res.exito) { this.actionError.set(res.mensaje || 'Error al marcar línea'); return; }
                this.lines.update(lines =>
                    lines.map(l => l.orderlineno === lineno ? { ...l, picking_status: 1 } : l)
                );
            },
            error: (err) => {
                this.loadingAction.set(false);
                this.actionError.set(err?.error?.mensaje || 'Error al conectar');
            }
        });
    }

    markAsDelivered(): void {
        const orderno = this.orderno();
        if (!orderno || !this.canDeliver()) return;

        if (!confirm('¿Confirmar entrega/despacho? Esto transferirá el stock al almacén vendedor.')) return;

        this.loadingAction.set(true);
        this.actionError.set('');

        this.apis.markOrderAsDelivered(orderno).subscribe({
            next: (res) => {
                this.loadingAction.set(false);
                if (!res.exito) { this.actionError.set(res.mensaje || 'Error al marcar como entregado'); return; }
                this.header.update(h => ({ ...h, delivered: 1 }));
                this.showSuccess('✅ Pedido marcado como entregado. Stock transferido.');
            },
            error: (err) => {
                this.loadingAction.set(false);
                this.actionError.set(err?.error?.mensaje || 'Error al conectar');
            }
        });
    }

    // ── Menú 3 puntos ─────────────────────────────────────────────

    toggleLineMenu(lineno: number): void {
        this.openMenuLineno.update(v => v === lineno ? null : lineno);
    }

    closeLineMenu(): void {
        this.openMenuLineno.set(null);
    }

    // ── Modal editar línea ────────────────────────────────────────

    openEditModal(line: any): void {
        this.editingLine.set(line);
        this.editQty.set(line.quantity);
        this.closeLineMenu();
    }

    closeEditModal(): void {
        this.editingLine.set(null);
    }

    confirmEdit(): void {
    const line    = this.editingLine();
    const orderno = this.orderno();
    if (!line || !orderno) return;

    this.loadingAction.set(true);
    this.actionError.set('');

    this.apis.updateOrderLine(orderno, line.orderlineno, {
        quantity:        this.editQty(),
        unitprice:       line.unitprice,
        discountpercent: line.discountpercent
    }).subscribe({
        next: (res) => {
            this.loadingAction.set(false);
            if (!res.exito) { this.actionError.set(res.mensaje || 'Error al actualizar'); return; }
            this.lines.update(lines =>
                lines.map(l => l.orderlineno === line.orderlineno
                    ? {
                        ...l,
                        quantity:   this.editQty(),
                        // unitprice ya tiene IVA (viene del detail original), no tocar
                        line_total: Number((this.editQty() * l.unitprice * (1 - l.discountpercent)).toFixed(2))
                      }
                    : l
                )
            );
            this.closeEditModal();
            this.showSuccess('Cantidad actualizada');
        },
        error: (err) => {
            this.loadingAction.set(false);
            this.actionError.set(err?.error?.mensaje || 'Error al conectar');
        }
    });
}

    // ── Eliminar línea ────────────────────────────────────────────

    deleteLine(lineno: number): void {
        const orderno = this.orderno();
        if (!orderno) return;

        this.closeLineMenu();
        if (!confirm('¿Eliminar este producto del pedido?')) return;

        this.loadingAction.set(true);
        this.actionError.set('');

        this.apis.deleteOrderLine(orderno, lineno).subscribe({
            next: () => {
                this.loadingAction.set(false);
                this.lines.update(lines => lines.filter(l => l.orderlineno !== lineno));
                this.showSuccess('Producto eliminado');
            },
            error: (err) => {
                this.loadingAction.set(false);
                this.actionError.set(err?.error?.mensaje || 'Error al eliminar');
            }
        });
    }

    // ── Agregar producto ──────────────────────────────────────────

    openProductPicker(): void {
        this.showProductPicker.set(true);
        this.addLineError.set('');
    }

    closeProductPicker(): void {
        this.showProductPicker.set(false);
    }

    onProductPicked(product: any): void {
        this.showProductPicker.set(false);
        this.pendingProduct.set(product);
        this.pendingQty.set(1);
        this.addLineError.set('');
    }

    incrementPendingQty(): void {
        const max = this.pendingProduct()?.total_quantity ?? 999;
        this.pendingQty.update(q => Math.min(q + 1, max));
    }

    decrementPendingQty(): void {
        this.pendingQty.update(q => Math.max(q - 1, 1));
    }

    cancelPendingProduct(): void {
        this.pendingProduct.set(null);
        this.pendingQty.set(1);
        this.addLineError.set('');
    }

    confirmPendingProduct(): void {
        const product = this.pendingProduct();
        if (!product) return;
        const stkcode  = product.stkcode ?? product.stockid;
        const quantity = this.pendingQty();
        this.pendingProduct.set(null);
        this.checkStockAvailabilityFor(stkcode, quantity);
    }

    checkStockAvailabilityFor(stkcode: string, quantity: number): void {
        const orderno = this.orderno();
        if (!orderno) return;

        this.addLineState.set('loading');
        this.addLineError.set('');

        this.apis.checkStockAvailability(orderno, stkcode, quantity).subscribe({
            next: (res) => {
                const stock = res.data;
                if (stock.autoTransfer && stock.autoSource) {
                    this.addLineWithSourceloc(stkcode, quantity, stock.autoSource);
                } else if (!stock.requiresSelection && !stock.autoTransfer) {
                    this.addLineWithSourceloc(stkcode, quantity, null);
                } else if (stock.requiresSelection && stock.locations?.length > 0) {
                    this.pendingProductCode.set(stkcode);
                    this.pendingProductQty.set(quantity);
                    this.pendingStockOptions.set(stock.locations.map((loc: StockLocation) => ({ ...loc, selectedQty: 0 })));
                    this.addLineState.set('awaiting_multi_stock_selection');
                } else {
                    this.addLineError.set('No hay stock disponible en ningún almacén');
                    this.addLineState.set('idle');
                }
            },
            error: (err) => {
                this.addLineState.set('idle');
                this.addLineError.set(err?.error?.mensaje || 'Error al verificar stock');
            }
        });
    }

    addLineWithSourceloc(stkcode: string, quantity: number, sourceloc: string | null): Promise<any> {
        const orderno = this.orderno();
        if (!orderno) return Promise.reject('No order number');

        this.loadingAddLine.set(true);
        this.addLineError.set('');

        const payload: AddLinePayload = {
            stkcode,
            quantity,
            discountpercent: 0,
            sourceloc: sourceloc || undefined
        };

        return new Promise((resolve, reject) => {
            this.apis.addOrderLine(orderno, payload).subscribe({
                next: (res) => {
                    this.loadingAddLine.set(false);
                    if (!res.exito) {
                        this.addLineError.set(res.mensaje || 'Error al agregar producto');
                        reject(new Error(res.mensaje));
                        return;
                    }
                    this.lines.update(lines => [...lines, res.data]);
                    this.addLineState.set('idle');
                    this.showSuccess('Producto agregado al pedido');
                    resolve(res);
                },
                error: (err) => {
                    this.loadingAddLine.set(false);
                    this.addLineError.set(err?.error?.mensaje || 'Error al conectar');
                    reject(err);
                }
            });
        });
    }

    addLineWithMultipleSources(): void {
        const selectedSources = this.pendingStockOptions().filter(loc => (loc.selectedQty || 0) > 0);
        if (selectedSources.length === 0) { this.addLineError.set('Debe seleccionar al menos un almacén'); return; }

        const totalSelected = selectedSources.reduce((sum, loc) => sum + (loc.selectedQty || 0), 0);
        if (totalSelected !== this.pendingProductQty()) {
            this.addLineError.set(`La suma (${totalSelected}) no coincide con la cantidad solicitada (${this.pendingProductQty()})`);
            return;
        }

        this.loadingAddLine.set(true);
        this.addLineError.set('');
        let completed = 0;
        let hasError  = false;

        for (const source of selectedSources) {
            this.addLineWithSourceloc(this.pendingProductCode(), source.selectedQty!, source.stkloc)
                .then(() => {
                    completed++;
                    if (completed === selectedSources.length && !hasError) {
                        this.loadingAddLine.set(false);
                        this.addLineState.set('idle');
                        this.closeMultiStockModal();
                    }
                })
                .catch((err: any) => {
                    if (!hasError) {
                        hasError = true;
                        this.loadingAddLine.set(false);
                        this.addLineError.set(err?.message || 'Error al crear transferencia');
                        this.addLineState.set('idle');
                    }
                });
        }
    }

    closeMultiStockModal(): void {
        this.addLineState.set('idle');
        this.pendingStockOptions.set([]);
        this.pendingProductCode.set('');
        this.pendingProductQty.set(1);
    }

    closeStockModal(): void {
        this.addLineState.set('idle');
        this.pendingStockOptions.set([]);
    }

    updateDistribution(): void {
        const total     = this.totalDistributed();
        const remaining = this.pendingProductQty() - total;
        this.addLineError.set(remaining < 0 ? '⚠️ La suma no puede superar la cantidad solicitada' : '');
    }

    // ── Helpers ───────────────────────────────────────────────────

    private showSuccess(message: string): void {
        this.successMessage.set(message);
        setTimeout(() => this.successMessage.set(''), 4000);
    }

    formatCurrency(value: number): string {
        return '$' + value.toFixed(2);
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('es-VE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    goBack(): void {
        this.router.navigate(['/order-list']);
    }

    goToInvoice(): void {
        const orderno = this.orderno();
        if (orderno) this.router.navigate(['/order', orderno, 'invoice']);
    }

    goToPickProduct(lineno: number, index: number): void {
        const orderno     = this.orderno();
        const finalLineno = lineno !== undefined ? lineno : index;
        this.router.navigate(['/pick-list', orderno], {
            queryParams: { lineno: String(finalLineno) }
        });
    }

    goToFullPickList(): void {
        const orderno = this.orderno();
        if (orderno) this.router.navigate(['/order-detail', orderno]);
    }

    isImage(url: string): boolean {
        return /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i.test(url);
    }

    fileName(url: string): string {
        return url.split('/').pop()?.split('?')[0] ?? url;
    }
}
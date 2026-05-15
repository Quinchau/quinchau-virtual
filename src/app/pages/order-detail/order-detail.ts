// src/app/pages/order-detail/order-detail.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [CommonModule],
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

    // Estados de carga para uploads
    readonly uploadingVoucher     = signal(false);
    readonly uploadingShippingDoc = signal(false);

    readonly header  = signal<any>(null);
    readonly lines   = signal<any[]>([]);
    readonly orderno = signal<number | null>(null);
    readonly docsOpen = signal(false);

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

    readonly grandTotal = computed(() => {
        const h = this.header();
        const l = this.lines();
        if (!h) return 0;
        const subtotalLines = l.reduce((acc, line) => acc + (Number(line.line_total) || 0), 0);
        const tax     = Number(h.taxTotal) || Number(h.ovtax) || 0;
        const freight = Number(h.freightcost) || 0;
        return subtotalLines + tax + freight;
    });

    // ── Lifecycle ─────────────────────────────────────────────────

    ngOnInit(): void {
        const orderno = parseInt(this.route.snapshot.paramMap.get('orderno') ?? '0', 10);
        this.orderno.set(orderno);
        this.loadDetail(orderno);
    }

    // ── Methods ───────────────────────────────────────────────────

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

    toggleDocs(): void {
    this.docsOpen.update(v => !v);
}

    triggerFileUpload(type: 'voucher' | 'shipping-doc'): void {
        const orderno = this.orderno();
        if (!orderno) return;

        const input    = document.createElement('input');
        input.type     = 'file';
        input.accept   = 'image/*,application/pdf';

        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            if (type === 'voucher') {
                this.uploadingVoucher.set(true);
                this.apis.uploadOrderVoucher(orderno, file).subscribe({
                    next: (res) => {
                        this.uploadingVoucher.set(false);
                        // Actualizar la URL en el header local sin recargar toda la vista
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

        input.click();
    }

    pickLine(lineno: number): void {
        const orderno = this.orderno();
        if (!orderno) return;

        this.loadingAction.set(true);
        this.actionError.set('');

        this.apis.pickLine(orderno, lineno).subscribe({
            next: (res) => {
                this.loadingAction.set(false);
                if (!res.exito) {
                    this.actionError.set(res.mensaje || 'Error al marcar línea');
                    return;
                }
                this.lines.update(lines =>
                    lines.map(l => l.orderlineno === lineno
                        ? { ...l, picking_status: 1 }
                        : l
                    )
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
                if (!res.exito) {
                    this.actionError.set(res.mensaje || 'Error al marcar como entregado');
                    return;
                }
                this.header.update(h => ({ ...h, delivered: 1 }));
                this.showSuccess('✅ Pedido marcado como entregado. Stock transferido.');
            },
            error: (err) => {
                this.loadingAction.set(false);
                this.actionError.set(err?.error?.mensaje || 'Error al conectar');
            }
        });
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
 
    /** Extrae el nombre de archivo de una URL para mostrarlo en el bloque PDF */
    fileName(url: string): string {
        return url.split('/').pop()?.split('?')[0] ?? url;
    }

}
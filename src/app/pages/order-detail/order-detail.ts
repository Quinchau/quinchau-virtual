import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';
import { ProductPicker } from '../../components/product-picker/product-picker';
import { AddLinePayload, OrderLine, StockLocation } from '../../models/orders.models';
import { UploadQueueService } from '../../services/upload-queue.service';

// ── Tipos para imágenes con estado offline ────────────────
export type DocUploadStatus = 'done' | 'uploading' | 'queued' | 'error';

export interface OrderDoc {
  url:      string;       // objectURL (offline) o URL real (online)
  status:   DocUploadStatus;
  queueId?: string;       // ID en IndexedDB mientras está encolado
}

export interface ExtraImage {
  id?:      number;
  url:      string;
  status:   DocUploadStatus;
  queueId?: string;
}

@Component({
    selector: 'app-order-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, ProductPicker],
    templateUrl: './order-detail.html',
})
export class OrderDetail implements OnInit, OnDestroy {

    private apis         = inject(ManagerApis);
    private router       = inject(Router);
    private route        = inject(ActivatedRoute);
    private uploadQueue  = inject(UploadQueueService);
    public  state        = inject(ManagerState);

    public readonly userLocation = this.state.userLocation;

    readonly loading        = signal(false);
    readonly loadingAction  = signal(false);
    readonly error          = signal('');
    readonly actionError    = signal('');
    readonly successMessage = signal('');

    readonly header  = signal<any>(null);
    readonly lines   = signal<any[]>([]);
    readonly orderno = signal<number | null>(null);
    readonly docsOpen = signal(false);

    // ── Documentos con estado ─────────────────────────────
    readonly voucherDoc     = signal<OrderDoc | null>(null);
    readonly shippingDoc    = signal<OrderDoc | null>(null);
    readonly extraImages    = signal<ExtraImage[]>([]);

    // Menú 3 puntos
    readonly openMenuLineno = signal<number | null>(null);

    // Modal editar línea
    readonly editingLine = signal<any | null>(null);
    readonly editQty     = signal<number>(1);

    // ── Agregar producto ──────────────────────────────────
    readonly showProductPicker    = signal(false);
    readonly loadingAddLine       = signal(false);
    readonly addLineError         = signal('');
    readonly pendingProduct       = signal<any>(null);
    readonly pendingQty           = signal(1);
    readonly addLineState         = signal<'idle' | 'loading' | 'awaiting_stock_selection' | 'awaiting_multi_stock_selection'>('idle');
    readonly pendingStockOptions  = signal<StockLocation[]>([]);
    readonly pendingProductCode   = signal('');
    readonly pendingProductQty    = signal(1);

    // ── SW message listener ───────────────────────────────
    private swMessageListener?: (event: MessageEvent) => void;

    // ── Computed ──────────────────────────────────────────

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
        this.isseller() && this.header()?.delivered === 1 && !this.header()?.invoiced
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
        return this.lines().reduce((acc, line) => acc + (Number(line.line_total) || 0), 0)
               + (Number(h.freightcost) || 0);
    });

    // ── Lifecycle ─────────────────────────────────────────

    ngOnInit(): void {
        const orderno = parseInt(this.route.snapshot.paramMap.get('orderno') ?? '0', 10);
        this.orderno.set(orderno);
        this.loadDetail(orderno);
        this.listenSwMessages();
    }

    ngOnDestroy(): void {
        if (this.swMessageListener && 'serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', this.swMessageListener);
        }
    }

    // ── Escuchar mensajes del SW ──────────────────────────

    private listenSwMessages(): void {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        this.swMessageListener = (event: MessageEvent) => {
            const msg = event.data;
            if (msg?.type !== 'ORDER_UPLOAD_SUCCESS') return;
            if (msg.orderno !== this.orderno()) return;

            switch (msg.uploadType) {
                case 'order-voucher':
                    this.voucherDoc.set({ url: msg.url, status: 'done' });
                    this.header.update(h => ({ ...h, voucher_url: msg.url }));
                    this.showSuccess('✅ Comprobante subido correctamente');
                    break;

                case 'order-shipping-doc':
                    this.shippingDoc.set({ url: msg.url, status: 'done' });
                    this.header.update(h => ({ ...h, shipping_doc_url: msg.url }));
                    this.showSuccess('✅ Guía de despacho subida correctamente');
                    break;

                case 'order-extra-image':
                    this.extraImages.update(imgs =>
                        imgs.map(img =>
                            img.queueId === msg.queueId
                                ? { id: msg.imageId, url: msg.url, status: 'done' }
                                : img
                        )
                    );
                    this.showSuccess('✅ Imagen subida correctamente');
                    break;
            }
        };

        navigator.serviceWorker.addEventListener('message', this.swMessageListener);
    }

    // ── Carga ─────────────────────────────────────────────

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

                // Inicializar docs con estado 'done'
                if (res.data.header.voucher_url) {
                    this.voucherDoc.set({ url: res.data.header.voucher_url, status: 'done' });
                }
                if (res.data.header.shipping_doc_url) {
                    this.shippingDoc.set({ url: res.data.header.shipping_doc_url, status: 'done' });
                }
                this.extraImages.set(
                    (res.data.header.extra_images ?? []).map((img: any) => ({
                        id:     img.id,
                        url:    img.url,
                        status: 'done' as DocUploadStatus
                    }))
                );

                this.precacheOrderImages(res.data.header);
            },
            error: () => {
                this.loading.set(false);
                this.error.set('Error al conectar con el servidor');
            }
        });
    }

    private precacheOrderImages(header: any): void {
        const urls: string[] = [
            header.voucher_url,
            header.shipping_doc_url,
            ...(header.extra_images ?? []).map((img: any) => img.url)
        ].filter(Boolean);

        urls.forEach(url => {
            fetch(url, { mode: 'no-cors', cache: 'force-cache' }).catch(() => {});
        });
    }

    // ── Documentos ────────────────────────────────────────

    toggleDocs(): void {
        this.docsOpen.update(v => !v);
    }

    triggerFileUpload(type: 'voucher' | 'shipping-doc'): void {
        const orderno = this.orderno();
        if (!orderno) return;

        const input         = document.createElement('input');
        input.type          = 'file';
        input.accept        = 'image/*,application/pdf';
        input.capture       = 'environment';
        input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';

        document.body.appendChild(input);

        input.onchange = async (e: any) => {
        const file = e.target.files[0];
        document.body.removeChild(input);
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        let queued = false; // ← declarado aquí, en el scope del archivo

        if (!navigator.onLine) {
            queued = true;
            await this.enqueueDoc(type, orderno, file, previewUrl);
            return;
        }

        // Online → subir directamente
        const upload$ = type === 'voucher'
            ? this.apis.uploadOrderVoucher(orderno, file)
            : this.apis.uploadOrderShippingDoc(orderno, file);

        upload$.subscribe({
            next: (res) => {
            /* ... tu código actual ... */
            },
            error: async (err) => {
            if (queued) return; // ← guard: imposible llegar aquí con queue activo, pero por si acaso

            if (!navigator.onLine) {
                queued = true;
                await this.enqueueDoc(type, orderno, file, previewUrl);
            } else {
                const errDoc: OrderDoc = { url: previewUrl, status: 'error' };
                if (type === 'voucher') this.voucherDoc.set(errDoc);
                else this.shippingDoc.set(errDoc);
                this.actionError.set(err?.error?.mensaje || 'Error al subir archivo');
            }
            }
        });
        };

        input.oncancel = () => { document.body.removeChild(input); };
        input.click();
    }

    private async enqueueDoc(
        type: 'voucher' | 'shipping-doc',
        orderno: number,
        file: File,
        previewUrl: string
    ): Promise<void> {
        const uploadType = type === 'voucher' ? 'order-voucher' : 'order-shipping-doc';
        const queueId = await this.uploadQueue.enqueue({
            type: uploadType,
            blob: file,
            filename: file.name,
            meta: { orderno }
        });

        const queued: OrderDoc = { url: previewUrl, status: 'queued', queueId };
        if (type === 'voucher') this.voucherDoc.set(queued);
        else this.shippingDoc.set(queued);

        this.showSuccess('📶 Sin conexión — se subirá automáticamente al recuperar la señal');
    }

    // ── Picking ───────────────────────────────────────────

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

    // ── Menú 3 puntos ─────────────────────────────────────

    toggleLineMenu(lineno: number): void {
        this.openMenuLineno.update(v => v === lineno ? null : lineno);
    }

    closeLineMenu(): void {
        this.openMenuLineno.set(null);
    }

    // ── Modal editar línea ────────────────────────────────

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
                        ? { ...l, ...res.data }   // usa el line_total que calculó el backend, con IVA
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

    // ── Eliminar línea ────────────────────────────────────

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

    // ── Agregar producto ──────────────────────────────────

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

    // ── Imágenes adicionales ──────────────────────────────

    triggerExtraImageUpload(): void {
  const orderno = this.orderno();
  if (!orderno) return;

  const input = document.createElement('input');
  input.type  = 'file';
  input.accept = 'image/*,application/pdf';
  input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
  document.body.appendChild(input);

  input.onchange = async (e: any) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    let alreadyQueued = false; // ← flag anti-doble-enqueue

    if (!navigator.onLine) {
      alreadyQueued = true;
      const queueId = await this.uploadQueue.enqueue({
        type: 'order-extra-image',
        blob: file,
        filename: file.name,
        meta: { orderno }
      });
      this.extraImages.update(imgs => [
        ...imgs,
        { url: previewUrl, status: 'queued', queueId }
      ]);
      this.showSuccess('📶 Sin conexión — se subirá automáticamente al recuperar la señal');
      return;
    }

    this.extraImages.update(imgs => [...imgs, { url: previewUrl, status: 'uploading' }]);

    this.apis.uploadOrderExtraImage(orderno, file).subscribe({
      next: (res) => {
        this.extraImages.update(imgs =>
          imgs.map(img =>
            img.url === previewUrl
              ? { id: res.data.id, url: res.data.url, status: 'done' }
              : img
          )
        );
        this.showSuccess('Imagen agregada correctamente');
      },
      error: async (err) => {
        if (alreadyQueued) return; // ← guard: ya fue encolado, no duplicar

        if (!navigator.onLine) {
          alreadyQueued = true;
          const queueId = await this.uploadQueue.enqueue({
            type: 'order-extra-image',
            blob: file,
            filename: file.name,
            meta: { orderno }
          });
          this.extraImages.update(imgs =>
            imgs.map(img =>
              img.url === previewUrl
                ? { url: previewUrl, status: 'queued', queueId }
                : img
            )
          );
          this.showSuccess('📶 Sin conexión — se subirá automáticamente al recuperar la señal');
        } else {
          this.extraImages.update(imgs =>
            imgs.map(img =>
              img.url === previewUrl ? { ...img, status: 'error' } : img
            )
          );
          this.actionError.set(err?.error?.mensaje || 'Error al subir imagen');
        }
      }
    });
  };

  input.oncancel = () => { document.body.removeChild(input); };
  input.click();
}

    deleteExtraImage(imageId: number): void {
        const orderno = this.orderno();
        if (!orderno) return;
        if (!confirm('¿Eliminar esta imagen?')) return;

        this.apis.deleteOrderExtraImage(orderno, imageId).subscribe({
            next: () => {
                this.extraImages.update(imgs => imgs.filter(i => i.id !== imageId));
                this.showSuccess('Imagen eliminada');
            },
            error: (err) => {
                this.actionError.set(err?.error?.mensaje || 'Error al eliminar imagen');
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────

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
        const from = this.route.snapshot.queryParamMap.get('from');
        this.router.navigate(['/order-list'], {
            queryParams: from === 'history' ? { tab: 'history' } : {}
        });
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
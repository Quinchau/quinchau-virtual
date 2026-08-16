// src/app/pages/carts/carts.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerApis } from '../../services/manager-apis';
import { AbandonedCart, ClientWithOrders } from '../../models/cart.models';

type CartsTab = 'abandonados' | 'exitosos';

@Component({
    selector: 'app-carts',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './carts.html',
    styles: ``
})
export class Carts implements OnInit {

    private apis = inject(ManagerApis);

    // ============================================
    // TABS
    // ============================================
    readonly activeTab = signal<CartsTab>('abandonados');

    // ============================================
    // ABANDONADOS
    // ============================================
    readonly loadingAbandoned = signal(false);
    readonly abandonedError = signal('');
    readonly abandonedCarts = signal<AbandonedCart[]>([]);

    /** cotizacion_id del carrito que se está marcando (evita doble click / doble 409) */
    readonly markingId = signal<number | null>(null);

    readonly abandonedCount = computed(() => this.abandonedCarts().length);

    // ============================================
    // EXITOSOS
    // ============================================
    readonly loadingSuccessful = signal(false);
    readonly successfulError = signal('');
    readonly successfulClients = signal<ClientWithOrders[]>([]);

    readonly successfulOrdersCount = computed(() =>
        this.successfulClients().reduce((sum, c) => sum + c.orders.length, 0)
    );

    // ============================================
    // LIFECYCLE
    // ============================================

    ngOnInit(): void {
        this.loadAbandonedCarts();
    }

    // ============================================
    // TABS
    // ============================================

    switchTab(tab: CartsTab): void {
        this.activeTab.set(tab);
        if (tab === 'abandonados' && this.abandonedCarts().length === 0 && !this.loadingAbandoned()) {
            this.loadAbandonedCarts();
        }
        if (tab === 'exitosos' && this.successfulClients().length === 0 && !this.loadingSuccessful()) {
            this.loadSuccessfulCarts();
        }
    }

    // ============================================
    // ABANDONADOS — carga
    // ============================================

    loadAbandonedCarts(): void {
        this.loadingAbandoned.set(true);
        this.abandonedError.set('');

        this.apis.getAbandonedCarts().subscribe({
            next: (res) => {
                this.loadingAbandoned.set(false);
                this.abandonedCarts.set(res.carts ?? []);
            },
            error: (err) => {
                this.loadingAbandoned.set(false);
                if (err?.status === 404) {
                    // "No se encontraron carritos abandonados" — estado vacío, no es un error real.
                    this.abandonedCarts.set([]);
                    return;
                }
                this.abandonedError.set(
                    err?.error?.message || 'Error al cargar los carritos abandonados'
                );
            }
        });
    }

    refreshAbandoned(): void {
        this.loadAbandonedCarts();
    }

    // ============================================
    // EXITOSOS — carga
    // ============================================

    loadSuccessfulCarts(): void {
        this.loadingSuccessful.set(true);
        this.successfulError.set('');

        this.apis.getSuccessfulCarts().subscribe({
            next: (res) => {
                this.loadingSuccessful.set(false);
                this.successfulClients.set(res.clients ?? []);
            },
            error: (err) => {
                this.loadingSuccessful.set(false);
                if (err?.status === 404) {
                    // "No se encontraron carritos exitosos" — estado vacío, no error real.
                    this.successfulClients.set([]);
                    return;
                }
                this.successfulError.set(
                    err?.error?.message || 'Error al cargar los carritos exitosos'
                );
            }
        });
    }

    refreshSuccessful(): void {
        this.loadSuccessfulCarts();
    }

    // ============================================
    // ABANDONADOS — marcar manualmente
    // ============================================

    markAsAbandoned(cart: AbandonedCart): void {
        // Evita doble click mientras la request está en vuelo
        // (el backend responde 409 en la doble llamada, pero mejor prevenirlo en UI).
        if (this.markingId() !== null) return;

        const confirmed = confirm(
            `¿Marcar el carrito #${cart.cotizacion_id} de "${this.visitanteLabel(cart)}" como abandonado?\n\n` +
            `Esta acción no se puede deshacer.`
        );
        if (!confirmed) return;

        this.markingId.set(cart.cotizacion_id);

        this.apis.markCartAsAbandoned(cart.cotizacion_id).subscribe({
            next: () => {
                this.markingId.set(null);
                // El carrito deja de estar 'Pendiente' → desaparece de esta vista.
                this.abandonedCarts.update(carts =>
                    carts.filter(c => c.cotizacion_id !== cart.cotizacion_id)
                );
            },
            error: (err) => {
                this.markingId.set(null);
                const msg = err?.error?.message
                    || 'No se pudo marcar el carrito como abandonado. Puede que ya haya cambiado de estado.';
                alert(msg);
                // El carrito pudo haber cambiado de estado por otra vía (409) — refrescamos la lista.
                this.loadAbandonedCarts();
            }
        });
    }

    // ============================================
    // HELPERS DE VISTA
    // ============================================

    visitanteLabel(cart: AbandonedCart): string {
        return cart.visitante_nombre?.trim() || 'Visitante sin identificar';
    }

    visitanteTelefono(cart: AbandonedCart): string | null {
        if (cart.visitante_telefono_prefijo && cart.visitante_telefono_numero) {
            return `${cart.visitante_telefono_prefijo}${cart.visitante_telefono_numero}`;
        }
        return null;
    }

    cartItemCount(cart: { items: { quantity: number }[] }): number {
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    cartTotal(cart: { items: { price: number; quantity: number; taxrate: number }[] }): number {
        return cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity * (1 + item.taxrate),
            0
        );
    }

    clientTotal(client: ClientWithOrders): number {
        return client.orders.reduce((sum, order) => sum + this.cartTotal(order), 0);
    }

    formatCurrency(value: number): string {
        return '$' + value.toFixed(2);
    }

    formatDate(dateStr: string): string {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
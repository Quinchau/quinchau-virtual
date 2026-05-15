// src/app/pages/order-list/order-list.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './order-list.html',
})
export class OrderList implements OnInit {

    private apis = inject(ManagerApis);
    private router = inject(Router);
    public state = inject(ManagerState);

    public readonly userLocation = this.state.userLocation;

    readonly loading = signal(false);
    readonly error = signal('');
    readonly orders = signal<any[]>([]);

    // ── Computed ──────────────────────────────────────────────────

    readonly ordersSeller = computed(() =>
        this.orders().filter(o => o.fromstkloc === this.userLocation() && o.shiploc !== this.userLocation())
    );

    readonly ordersDispatch = computed(() =>
        this.orders().filter(o => o.shiploc === this.userLocation() && o.fromstkloc !== this.userLocation())
    );

    readonly ordersBoth = computed(() =>
        this.orders().filter(o => o.fromstkloc === this.userLocation() && o.shiploc === this.userLocation())
    );

    // ── Lifecycle ─────────────────────────────────────────────────

    ngOnInit(): void {
        this.loadOrders();
    }

    // ── Methods ───────────────────────────────────────────────────

    loadOrders(): void {
        this.loading.set(true);
        this.error.set('');

        this.apis.listOrders().subscribe({
            next: (res) => {
                this.loading.set(false);
                if (!res.exito) {
                    this.error.set('Error al cargar pedidos');
                    return;
                }
                this.orders.set(res.data);
            },
            error: () => {
                this.loading.set(false);
                this.error.set('Error al conectar con el servidor');
            }
        });
    }

    goToDetail(orderno: number): void {
        this.router.navigate(['/order-list', orderno]);
    }

    goToNewOrder(): void {
        this.router.navigate(['/orders']);
    }

    // ── Helpers ───────────────────────────────────────────────────

    getOrderStatus(order: any): { label: string; color: string } {
        if (order.delivered) {
            return { label: 'Listo para facturar', color: 'green' };
        }
        if (order.picked_lines === order.total_lines) {
            return { label: 'Listo para despachar', color: 'blue' };
        }
        if (order.picked_lines > 0) {
            return { label: 'COMPLETADO', color: 'green' };
        }
        return { label: 'Pendiente', color: 'slate' };
    }

    formatCurrency(value: number): string {
    return '$' + value.toFixed(2);
}

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString('es-VE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }
}
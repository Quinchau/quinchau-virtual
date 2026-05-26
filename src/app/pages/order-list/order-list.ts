// src/app/pages/order-list/order-list.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';
import { WarehouseOption } from '../../models/orders.models';

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
    readonly locMap = signal<Record<string, string>>({});

    // ── Lifecycle ─────────────────────────────────────────────────

    ngOnInit(): void {
        this.loadWarehouses();
        this.loadOrders();
    }

    // ── Methods ───────────────────────────────────────────────────

    loadWarehouses(): void {
        this.apis.getWarehouses().subscribe({
            next: (res) => {
                if (!res.exito) return;
                const map: Record<string, string> = {};
                res.data.forEach((w: WarehouseOption) => map[w.stkloc] = w.description);
                this.locMap.set(map);
            }
        });
    }

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

    getLocName(code: string): string {
        return this.locMap()[code] ?? code;
    }

    getOrderRole(order: any): 'seller' | 'dispatch' | 'both' | 'viewer' {
        const loc = this.userLocation();
        const isSeller   = order.fromstkloc === loc;
        const isDispatch = order.shiploc === loc;
        if (isSeller && isDispatch) return 'both';
        if (isSeller)   return 'seller';
        if (isDispatch) return 'dispatch';
        return 'viewer';
    }

    getOrderStatus(order: any): { label: string; color: string } {
    if (order.delivered)                                          return { label: 'Por facturar', color: 'green' };
    if (order.picked_lines >= order.total_lines && order.total_lines > 0) return { label: 'Recogido',           color: 'blue'  };
    if (order.picked_lines > 0)                                  return { label: 'En proceso',         color: 'amber' };
    return                                                               { label: 'Pendiente',          color: 'slate' };
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
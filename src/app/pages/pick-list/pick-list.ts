// src/app/pages/pick-list/pick-list.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-pick-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pick-list.html',
})
export class PickList implements OnInit {
  private apis  = inject(ManagerApis);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  public state   = inject(ManagerState);

  readonly loading        = signal(false);
  readonly picking        = signal(false);
  readonly error          = signal('');
  readonly successMessage = signal('');

  readonly product = signal<any>(null);
  readonly orderno = signal<number | null>(null);
  readonly lineno  = signal<number | null>(null);
  readonly shiploc = signal<string>('');

  ngOnInit(): void {
    const orderno    = Number(this.route.snapshot.paramMap.get('orderno'));
    const linenoStr  = this.route.snapshot.queryParamMap.get('lineno');
    const lineno     = Number(linenoStr);

    this.orderno.set(orderno);
    this.lineno.set(lineno);

    if (orderno && !isNaN(lineno)) {
      this.loadProduct(orderno, lineno);
    } else {
      this.error.set(`Parámetros inválidos: orderno=${orderno}, lineno=${linenoStr}`);
    }
  }

  loadProduct(orderno: number, lineno: number): void {
    this.loading.set(true);
    this.error.set('');

    this.apis.getOrderDetail(orderno).subscribe({
      next: (res: any) => {
        this.loading.set(false);

        if (!res?.exito) {
          this.error.set('Error al cargar el producto');
          return;
        }

        this.shiploc.set(res.data.header?.shiploc || '');

        const targetLineno = Number(lineno);
        const foundProduct = res.data.lines.find(
          (l: any) => Number(l.orderlineno) === targetLineno
        );

        if (foundProduct) {
          this.product.set(foundProduct);
        } else {
          this.error.set(`Producto no encontrado. Buscando línea: ${targetLineno}`);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al conectar con el servidor');
      }
    });
  }

  markAsPicked(): void {
    const orderno = this.orderno();
    const lineno  = this.lineno();
    if (!orderno || lineno === null) return;

    this.picking.set(true);
    this.error.set('');

    this.apis.pickLine(orderno, lineno).subscribe({
      next: (res: any) => {
        this.picking.set(false);
        if (!res.exito) {
          this.error.set(res.mensaje || 'Error al marcar');
          return;
        }
        this.product.update((p: any) => ({ ...p, picking_status: 1 }));
        this.successMessage.set('✅ Producto recogido');
        setTimeout(() => {
          this.router.navigate(['/order-list', this.orderno()]);
        }, 1500);
      },
      error: (err: any) => {
        this.picking.set(false);
        this.error.set(err?.error?.mensaje || 'Error al conectar');
      }
    });
  }

  unPickLine(): void {
    const orderno = this.orderno();
    const lineno  = this.lineno();
    if (!orderno || lineno === null) return;

    this.picking.set(true);
    this.error.set('');

    this.apis.unPickLine(orderno, lineno).subscribe({
      next: (res: any) => {
        this.picking.set(false);
        if (!res.exito) {
          this.error.set(res.mensaje || 'Error al devolver');
          return;
        }
        this.product.update((p: any) => ({ ...p, picking_status: 0 }));
        this.successMessage.set('↩️ Producto devuelto');
        setTimeout(() => {
          this.router.navigate(['/order-detail', this.orderno()]);
        }, 1500);
      },
      error: (err: any) => {
        this.picking.set(false);
        this.error.set(err?.error?.mensaje || 'Error al conectar');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/order-detail', this.orderno()]);
  }

  formatCurrency(value: number): string {
    return '$' + (value || 0).toFixed(2);
  }

  getProductImageUrl(): string | null {
    const id = this.product()?.cover_image_id;
    if (!id) return null;
    const idStr = id.toString();
    const path  = idStr.split('').join('/');
    return `https://quinchau.com/weberp/img/p/${path}/${idStr}-home_default.jpg`;
  }

  getStock(): number {
    return this.product()?.stock_at_location || 0;
  }

  getLocation(): string {
    return this.product()?.puesto || 'Sin puesto asignado';
  }
}
import { Component, OnInit, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router} from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';
import { ManagerApis } from '../../services/manager-apis';
import { Product } from '../../models/transfer.model';
import { ExeOrderComponent } from '../exe-order/exe-order';
import { LayerHistoryService } from '../../services/LayerHistoryService';
import { finalize, catchError, of } from 'rxjs';

type PendingAction = 'cart' | 'waitlist' | null;

const DEFAULT_OG_IMAGE = 'https://quinchau.com/assets/og-default.jpg'; // TODO: reemplazar por la imagen default real del sitio

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ExeOrderComponent],
  templateUrl: './product-page.html',
})
export class ProductPage implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private meta = inject(Meta);
  private title = inject(Title);
  private apis = inject(ManagerApis);
  public state = inject(ManagerState);
  public nav = inject(LayerHistoryService);
  private platformId = inject(PLATFORM_ID);

  // Estado local de la página
  public product = signal<Product | null>(null);
  public loading = signal(true);
  public error = signal(false);
  public selectedImage = signal<string | null>(null);
  public notifySuccess = signal(false);
  private pendingAction = signal<PendingAction>(null);
  public copiado = signal(false);
  public cartSuccess = signal(false);

  public readonly inWaitlist = computed(() => {
    const stockid = this.product()?.stockid;
    if (!stockid) return false;
    return this.state.waitlist().includes(stockid);
  });

  get quantity(): number {
    return this.product()?.qty_in_order || 1;
  }

  set quantity(value: number) {
    const p = this.product();
    if (!p) return;
    const v = Math.max(1, Math.min(Number(value), p.total_quantity));
    this.product.set({ ...p, qty_in_order: v });
  }

  // Genera el slug SEO a partir de la descripción
  public toSlug(text: string): string {
    return text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  public copiarUrl(): void {
  if (!isPlatformBrowser(this.platformId)) return;
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2000);
  });
}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const stockid = params.get('stockid');
      if (!stockid) {
        this.router.navigate(['/home']);
        return;
      }
      this.loadProduct(stockid);
    });
  }

  private loadProduct(stockid: string): void {
  this.loading.set(true);
  this.error.set(false);
  this.selectedImage.set(null);

  this.apis.getProductBySlug(stockid).pipe(
    finalize(() => this.loading.set(false)),
    catchError(() => {
      this.error.set(true);
      return of(null);
    })
  ).subscribe((res: any) => {
    const p = res?.productos?.[0] ?? res;
    if (!p || !p.stockid) {
      this.error.set(true);
      return;
    }
    this.product.set({ ...p, qty_in_order: p.qty_in_order || 1 });
    this.setMetaTags(p);
    this.setJsonLd(p);
  });
}

  // ─────────────────────────────────────────────────────────────
  // META TAGS (OG / Twitter)
  // CAMBIOS:
  // 1) El precio y el stock van AL PRINCIPIO de la descripción,
  //    porque WhatsApp corta el texto a pocos caracteres y el
  //    nombre del producto ya está cubierto por el og:title.
  // 2) Fallback seguro para og:image: si no hay `cover_image`
  //    (URL completa), NO usamos `cover_image_id` (es solo un
  //    número/ID, no una URL válida) — usamos una imagen default.
  // ─────────────────────────────────────────────────────────────
  private setMetaTags(p: Product): void {
    const titleText = `${p.description} | Quinchau`;

    const precioTexto = `$${p.price_with_tax.toFixed(2)}`;
    const stockTexto = p.total_quantity > 0
      ? `${p.total_quantity} disponibles`
      : 'Consulta disponibilidad';

    const description = `${precioTexto} | ${stockTexto} | ${p.description} (${p.stockid})`;

    const image = p.cover_image || DEFAULT_OG_IMAGE;
    const url = `https://quinchau.com/producto/${p.stockid}/${this.toSlug(p.description)}`;

    this.title.setTitle(titleText);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: titleText });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: titleText });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  // ─────────────────────────────────────────────────────────────
  // JSON-LD (Schema.org Product) — para Rich Snippets de Google
  // CAMBIO: se eliminó el guard `if (!isPlatformBrowser(...)) return;`
  // que existía antes. Ese guard impedía que este bloque se generara
  // durante el renderizado SSR, que es justamente el único momento
  // que le importa a Googlebot (lee el HTML inicial, no espera la
  // hidratación en el navegador). El `document` en SSR de Angular
  // Universal está disponible (DOM emulado), así que esto corre bien
  // en ambos entornos sin necesidad de ese chequeo.
  // ─────────────────────────────────────────────────────────────
  private setJsonLd(p: Product): void {
    const existing = document.getElementById('product-jsonld');
    if (existing) existing.remove();

    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: p.description,
      sku: p.stockid,
      image: p.images?.length ? [p.cover_image, ...p.images].filter(Boolean) : [p.cover_image || DEFAULT_OG_IMAGE],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: p.price_with_tax.toFixed(2),
        availability: p.total_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `https://quinchau.com/producto/${p.stockid}/${this.toSlug(p.description)}`
      }
    };

    const script = document.createElement('script');
    script.id = 'product-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  public selectImage(url: string): void {
    this.selectedImage.set(url);
  }

  increment() { this.quantity = this.quantity + 1; }
  decrement() { this.quantity = this.quantity - 1; }

  confirm(): void {
  const p = this.product();
  if (!p || this.quantity < 1) return;
  this.state.currentProductCard.set(p);
  this.state.addCurrentProductToCart().subscribe({
    next: () => {
      this.cartSuccess.set(true);
    },
    error: (err) => {
      if (err?.requiere_registro) {
        this.pendingAction.set('cart');
        this.abrirModalRegistro();
      }
    }
  });
}

goBack(): void {
  if (isPlatformBrowser(this.platformId)) {
    const referrer = document.referrer;

    const vieneDeMiSitio = referrer.includes('quinchau.com') || referrer.includes('localhost');

    if (vieneDeMiSitio && window.history.length > 1) {
      window.history.back();
      return;
    }
  }

  // En cualquier otro caso (falsos positivos, URLs directas, tráfico externo o SSR), al Home
  this.router.navigate(['/home']);
}

  notifyMe(): void {
    const stockid = this.product()?.stockid;
    if (!stockid) return;
    this.state.waitlist.update(current => [...current, stockid]);
    this.state.subscribeToWaitlist(stockid).subscribe({
      next: () => this.notifySuccess.set(true),
      error: (err) => {
        this.state.waitlist.update(current => current.filter(id => id !== stockid));
        if (err?.requiere_registro) {
          this.pendingAction.set('waitlist');
          this.abrirModalRegistro();
        }
      }
    });
  }

  abrirModalRegistro(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.nav.push('checkout', window.location.pathname + '?registro=true');
  }

  onRegistroCompleto(datos: any): void {
    if (this.pendingAction() === 'waitlist') {
      this.pendingAction.set(null);
      const stockid = this.product()?.stockid;
      if (stockid) {
        this.state.subscribeToWaitlist(stockid, datos).subscribe({
          next: () => this.notifySuccess.set(true)
        });
      }
    } else {
      this.pendingAction.set(null);
      const p = this.product();
      if (p) {
        this.state.currentProductCard.set(p);
        this.state.addCurrentProductToCart(datos).subscribe({
          next: () => this.router.navigate(['/checkout'])
        });
      }
    }
  }
}
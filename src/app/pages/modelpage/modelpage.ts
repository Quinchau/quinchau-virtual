// src/app/pages/modelpage/modelpage.ts

import { Component, inject, signal, computed, OnDestroy, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { Title, Meta } from '@angular/platform-browser';
import { FaqsComponent } from '../faqs/faqs';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

const OFFERS_OG_IMAGE = `${environment.imgModelsUrl}/ofertas-preview.jpg`;
const DEFAULT_MODEL_IMAGE = `${environment.imgModelsUrl}/image-model7.jpg`;

interface ModeloData {
  modeldescrip?: string;
  marcadescrip?: string;
  seo_note?: string;
  img_url?: string;
  url?: string;
  idmodelo?: number | string;
}


@Component({
  selector: 'app-modelpage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet],
  templateUrl: './modelpage.html',
})
export class Modelpage implements OnDestroy {

  private route        = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private router       = inject(Router);
  private title        = inject(Title);
  private meta         = inject(Meta);
  public  managerState = inject(ManagerState);

  public readonly isOffersPage   = this.route.snapshot.data['offersOnly'] === true;
  private paramMap = toSignal(this.route.paramMap, {
  initialValue: this.route.snapshot.paramMap,
});

  private slugCompleto = computed(() => this.paramMap().get('modelo') ?? '');
  private marcaSlug    = computed(() => this.paramMap().get('marca')  ?? '');
  private idFromSlug   = computed(() => this.slugCompleto().split('-').pop() ?? '');
  public copiado = signal(false);

  public onlyStock = toSignal(
    this.route.queryParamMap.pipe(
      map(params => params.get('stock') === '1')
    ),
    { initialValue: this.route.snapshot.queryParamMap.get('stock') === '1' }
  );

  public filteredProducts = computed(() => {
    const list = this.managerState.products() ?? [];
    return this.onlyStock() ? list.filter(p => p.total_quantity > 0) : list;
  });

  private dataLoadInterval: any;

  constructor() {
    effect(() => {
      if (this.isOffersPage) {
        this.managerState.setOffersOnly(true);
      } else {
        this.managerState.setModeloId(this.idFromSlug());
      }
      this.updateMetaTags();
    });
  }

  ngOnDestroy(): void {
  if (this.dataLoadInterval) {
    clearInterval(this.dataLoadInterval);
  }
  }

  public toggleOnlyStock(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stock: this.onlyStock() ? null : '1' },
      queryParamsHandling: 'merge',
    });
  }

  public handleProductSelection(producto: any): void {
    if (!producto?.stockid) return;
    this.router.navigate(['/producto', producto.stockid, this.slugify(producto.description)]);
  }

  public slugify(text: string): string {
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

  private updateMetaTags(): void {
  const childRoute = this.route.firstChild?.snapshot.routeConfig?.path;
  const isFaqRoute = childRoute === 'faq' || childRoute === 'faq/:faqId';

  if (this.isOffersPage) {
    const pageTitle   = 'Ofertas en Repuestos de Motos | Quinchau';
    const pageDesc    = 'Descubre las mejores ofertas en repuestos para motos. Carburadores, pistones, frenos y más. Envíos a todo el país.';
    const imagenUrl   =  OFFERS_OG_IMAGE;
    const urlCompleta = `${environment.siteUrl}/ofertas`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description',              content: pageDesc });
    this.meta.updateTag({ name: 'robots',                   content: 'index, follow' });
    this.meta.updateTag({ name: 'googlebot',                content: 'index, follow' });
    this.meta.updateTag({ property: 'og:title',             content: pageTitle });
    this.meta.updateTag({ property: 'og:description',       content: pageDesc });
    this.meta.updateTag({ property: 'og:image',             content: imagenUrl });
    this.meta.updateTag({ property: 'og:image:width',       content: '1200' });
    this.meta.updateTag({ property: 'og:image:height',      content: '630' });
    this.meta.updateTag({ property: 'og:image:alt',         content: 'Ofertas en Repuestos de Motos' });
    this.meta.updateTag({ property: 'og:url',               content: urlCompleta });
    this.meta.updateTag({ property: 'og:type',              content: 'website' });
    this.meta.updateTag({ property: 'og:site_name',         content: 'Quinchau' });
    this.meta.updateTag({ property: 'og:locale',            content: 'es_ES' });
    this.meta.updateTag({ name: 'twitter:card',             content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site',             content: '@quinchau' });
    this.meta.updateTag({ name: 'twitter:title',            content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description',      content: pageDesc });
    this.meta.updateTag({ name: 'twitter:image',            content: imagenUrl });
    this.meta.updateTag({ name: 'twitter:image:alt',        content: 'Ofertas en Repuestos de Motos' });
    this.meta.updateTag({ property: 'telegram:title',       content: pageTitle });
    this.meta.updateTag({ property: 'telegram:description', content: pageDesc });
    return;
  }

  const modelo = this.managerState.currentModel() as ModeloData | null;

  let imagenUrl: string;
let modeloEncontrado = modelo;

if (isFaqRoute) {
  imagenUrl = `${environment.imgModelsUrl}/faq-preview.png`;
} else {
  imagenUrl = modelo?.img_url ?? '';
  if (!imagenUrl) {
    const destacados = this.managerState.modelosDestacados?.() || [];
    const encontrado = destacados.find((m: any) =>
      m.idmodelo?.toString() === this.idFromSlug()

    );
    if (encontrado?.img_url) {
      imagenUrl = encontrado.img_url;
      modeloEncontrado = encontrado;
    }
  }
  if (!imagenUrl) {
    imagenUrl = `${environment.imgModelsUrl}/faq-preview.png`;
  }
}

  const nombreSlug = this.slugCompleto()
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const nombreModelo = modeloEncontrado?.modeldescrip ?? nombreSlug;
  const nombreMarca  = modeloEncontrado?.marcadescrip ?? this.marcaSlug().replace(/-/g, ' ').toUpperCase();
  const seoNote      = modeloEncontrado?.seo_note ?? `Encuentra repuestos originales y genéricos para ${nombreMarca} ${nombreModelo}. Carburadores, pistones, frenos, transmisión y más. Envíos a todo el país.`;

  // ✅ Títulos, descripciones y URL según si es ruta FAQ o modelo
  const pageTitle = isFaqRoute
    ? `Preguntas frecuentes · ${nombreMarca} ${nombreModelo} | Quinchau`
    : `Repuestos ${nombreMarca} ${nombreModelo} | Quinchau`;

  const pageDesc = isFaqRoute
    ? `Preguntas frecuentes sobre ${nombreMarca} ${nombreModelo}. Resolvé tus dudas antes de comprarlo.`
    : seoNote;

  const urlCompleta = isFaqRoute
  ? `${environment.siteUrl}/repuestos-motos/${this.marcaSlug()}/${this.slugCompleto()}/faq`
  : `${environment.siteUrl}/repuestos-motos/${this.marcaSlug()}/${this.slugCompleto()}`;

  const ogType = isFaqRoute ? 'website' : 'product.group';

  this.title.setTitle(pageTitle);
  this.meta.updateTag({ name: 'description',              content: pageDesc });
  this.meta.updateTag({ name: 'robots',                   content: 'index, follow' });
  this.meta.updateTag({ name: 'googlebot',                content: 'index, follow' });
  this.meta.updateTag({ property: 'og:title',             content: pageTitle });
  this.meta.updateTag({ property: 'og:description',       content: pageDesc });
  this.meta.updateTag({ property: 'og:image',             content: imagenUrl });
  this.meta.updateTag({ property: 'og:image:width',       content: '1200' });
  this.meta.updateTag({ property: 'og:image:height',      content: '630' });
  this.meta.updateTag({ property: 'og:image:alt',         content: `${nombreMarca} ${nombreModelo}` });
  this.meta.updateTag({ property: 'og:url',               content: urlCompleta });
  this.meta.updateTag({ property: 'og:type',              content: ogType });
  this.meta.updateTag({ property: 'og:site_name',         content: 'Quinchau' });
  this.meta.updateTag({ property: 'og:locale',            content: 'es_ES' });
  this.meta.updateTag({ name: 'twitter:card',             content: 'summary_large_image' });
  this.meta.updateTag({ name: 'twitter:site',             content: '@quinchau' });
  this.meta.updateTag({ name: 'twitter:title',            content: pageTitle });
  this.meta.updateTag({ name: 'twitter:description',      content: pageDesc });
  this.meta.updateTag({ name: 'twitter:image',            content: imagenUrl });
  this.meta.updateTag({ name: 'twitter:image:alt',        content: `${nombreMarca} ${nombreModelo}` });
  this.meta.updateTag({ property: 'telegram:title',       content: pageTitle });
  this.meta.updateTag({ property: 'telegram:description', content: pageDesc });
}
}
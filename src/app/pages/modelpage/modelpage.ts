// src/app/pages/modelpage/modelpage.ts

import { Component, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { Title, Meta } from '@angular/platform-browser';
import { FaqsComponent } from '../faqs/faqs';
import { FormsModule } from '@angular/forms';

interface ModeloData {
  modeldescrip?: string;
  marcadescrip?: string;
  seo_note?: string;
  img_url?: string;
  url?: string;
  idmodelo?: number | string;
}

const OFFERS_OG_IMAGE = 'https://quinchau.com/weberp/img/m/ofertas-preview.jpg';
const DEFAULT_MODEL_IMAGE = 'https://quinchau.com/weberp/img/m/image-model7.jpg';

@Component({
  selector: 'app-modelpage',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet],
  templateUrl: './modelpage.html',
})
export class Modelpage implements OnDestroy {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private title        = inject(Title);
  private meta         = inject(Meta);
  public  managerState = inject(ManagerState);

  public readonly isOffersPage   = this.route.snapshot.data['offersOnly'] === true;
  private readonly idFromSlug   = this.route.snapshot.paramMap.get('modelo')?.split('-').pop() ?? '';
  private readonly slugCompleto = this.route.snapshot.paramMap.get('modelo') ?? '';
  private readonly marcaSlug    = this.route.snapshot.paramMap.get('marca')  ?? '';

  public onlyStock = signal(false);

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
        this.managerState.setModeloId(this.idFromSlug);
      }
      this.updateMetaTags();
    });
  }

  ngOnDestroy(): void {
    if (this.dataLoadInterval) {
      clearInterval(this.dataLoadInterval);
    }
    this.managerState.setModeloId('');
    this.managerState.setOffersOnly(false);
  }

  public toggleOnlyStock(): void {
    this.onlyStock.update(v => !v);
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

  private updateMetaTags(): void {
  const childRoute = this.route.firstChild?.snapshot.routeConfig?.path;
  const isFaqRoute = childRoute === 'faq' || childRoute === 'faq/:faqId';

  if (this.isOffersPage) {
    const pageTitle   = 'Ofertas en Repuestos de Motos | Quinchau';
    const pageDesc    = 'Descubre las mejores ofertas en repuestos para motos. Carburadores, pistones, frenos y más. Envíos a todo el país.';
    const imagenUrl   =  OFFERS_OG_IMAGE;
    const urlCompleta = 'https://quinchau.com/ofertas';

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
  imagenUrl = 'https://quinchau.com/weberp/img/m/faq-preview.png';
} else {
  imagenUrl = modelo?.img_url ?? '';
  if (!imagenUrl) {
    const destacados = this.managerState.modelosDestacados?.() || [];
    const encontrado = destacados.find((m: any) =>
      m.idmodelo?.toString() === this.idFromSlug
    );
    if (encontrado?.img_url) {
      imagenUrl = encontrado.img_url;
      modeloEncontrado = encontrado;
    }
  }
  if (!imagenUrl) {
    imagenUrl = DEFAULT_MODEL_IMAGE;
  }
}

  const nombreSlug = this.slugCompleto
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const nombreModelo = modeloEncontrado?.modeldescrip ?? nombreSlug;
  const nombreMarca  = modeloEncontrado?.marcadescrip ?? this.marcaSlug.replace(/-/g, ' ').toUpperCase();
  const seoNote      = modeloEncontrado?.seo_note ?? `Encuentra repuestos originales y genéricos para ${nombreMarca} ${nombreModelo}. Carburadores, pistones, frenos, transmisión y más. Envíos a todo el país.`;

  // ✅ Títulos, descripciones y URL según si es ruta FAQ o modelo
  const pageTitle = isFaqRoute
    ? `Preguntas frecuentes · ${nombreMarca} ${nombreModelo} | Quinchau`
    : `Repuestos ${nombreMarca} ${nombreModelo} | Quinchau`;

  const pageDesc = isFaqRoute
    ? `Preguntas frecuentes sobre ${nombreMarca} ${nombreModelo}. Resolvé tus dudas antes de comprarlo.`
    : seoNote;

  const urlCompleta = isFaqRoute
    ? `https://quinchau.com/repuestos-motos/${this.marcaSlug}/${this.slugCompleto}/faq`
    : `https://quinchau.com/repuestos-motos/${this.marcaSlug}/${this.slugCompleto}`;

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
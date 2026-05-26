// src/app/pages/modelpage/modelpage.ts

import { Component, inject, signal, computed, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { ProductOrder } from '../product-order/product-order';
import { Title, Meta } from '@angular/platform-browser';

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
  imports: [CommonModule, RouterLink, ProductOrder],
  templateUrl: './modelpage.html',
})
export class Modelpage implements OnDestroy {

  private route        = inject(ActivatedRoute);
  private title        = inject(Title);
  private meta         = inject(Meta);
  public  managerState = inject(ManagerState);

  // Extraemos el ID directamente del slug de la ruta
  private readonly idFromSlug = this.route.snapshot.paramMap.get('modelo')?.split('-').pop() ?? '';
  private readonly slugCompleto = this.route.snapshot.paramMap.get('modelo') ?? '';
  private readonly marcaSlug    = this.route.snapshot.paramMap.get('marca')  ?? '';

  // Filtro de stock local
  public onlyStock = signal(false);

  public filteredProducts = computed(() => {
    const list = this.managerState.products() ?? [];
    return this.onlyStock() ? list.filter(p => p.total_quantity > 0) : list;
  });

  public selectedProductId = computed(() =>
    this.managerState.currentProductCard()?.stockid ?? null
  );

  private dataLoadInterval: any;

  constructor() {
  effect(() => {
    this.managerState.setModeloId(this.idFromSlug);
    this.updateMetaTags();
  });
}

  ngOnDestroy(): void {
    if (this.dataLoadInterval) {
      clearInterval(this.dataLoadInterval);
    }
    this.managerState.setModeloId('');
  }

  public toggleOnlyStock(): void {
    this.onlyStock.update(v => !v);
  }

  public handleProductSelection(producto: any): void {
    if (!producto?.stockid) return;
    this.managerState.currentProductCard.set({
      ...producto,
      qty_in_order: producto.qty_in_order ?? 1,
    });
  }

  public closeProduct(): void {
    this.managerState.closeProductDetail();
  }

  private updateMetaTags(): void {
    const modelo = this.managerState.currentModel() as ModeloData | null;
    
    // Buscar la imagen en modelosDestacados si no está en currentModel
    let imagenUrl = modelo?.img_url;
    let modeloEncontrado = modelo;
    
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
    
    // Fallback a imagen por defecto
    if (!imagenUrl) {
      imagenUrl = 'https://quinchau.com/weberp/img/m/image-model7.jpg';
    }
    
    // Construir nombres desde el slug como fallback
    const nombreSlug = this.slugCompleto
      .replace(/-\d+$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    const nombreModelo = modeloEncontrado?.modeldescrip ?? nombreSlug;
    const nombreMarca = modeloEncontrado?.marcadescrip ?? this.marcaSlug.replace(/-/g, ' ').toUpperCase();
    const seoNote = modeloEncontrado?.seo_note ?? `Encuentra repuestos originales y genéricos para ${nombreMarca} ${nombreModelo}. Carburadores, pistones, frenos, transmisión y más. Envíos a todo el país.`;
    
    const pageTitle = `Repuestos ${nombreMarca} ${nombreModelo} | Quinchau`;
    const pageDesc = seoNote;
    const urlCompleta = `https://quinchau.com/repuestos-motos/${this.marcaSlug}/${this.slugCompleto}`;
    
    // Meta tags básicas
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: pageDesc });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'googlebot', content: 'index, follow' });
    
    // Open Graph (Facebook, WhatsApp, LinkedIn, Telegram)
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: pageDesc });
    this.meta.updateTag({ property: 'og:image', content: imagenUrl });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:image:alt', content: `${nombreMarca} ${nombreModelo}` });
    this.meta.updateTag({ property: 'og:url', content: urlCompleta });
    this.meta.updateTag({ property: 'og:type', content: 'product.group' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Quinchau' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_ES' });
    
    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:site', content: '@quinchau' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: pageDesc });
    this.meta.updateTag({ name: 'twitter:image', content: imagenUrl });
    this.meta.updateTag({ name: 'twitter:image:alt', content: `${nombreMarca} ${nombreModelo}` });
    
    // Meta tags adicionales para Telegram
    this.meta.updateTag({ property: 'telegram:title', content: pageTitle });
    this.meta.updateTag({ property: 'telegram:description', content: pageDesc });
  }
}
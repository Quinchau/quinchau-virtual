import { Component, computed, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ManagerState } from '../../services/manager-state';
import { ManagerApis } from '../../services/manager-apis';

@Component({
  selector: 'app-downloaders',
  standalone: true,
  imports: [],
  templateUrl: './downloaders.html',
  styles: `
    :host { display: block; }
  `,
})
export class Downloaders implements OnInit {
  private state = inject(ManagerState);
  private api = inject(ManagerApis);
  private title = inject(Title);
  private meta = inject(Meta);

  private iconMap: Record<string, string> = {
    'repuestos': 'settings_input_component',
    'accesorios': 'Electric_Scooter',
    'llantas': 'album',
    'default': 'inventory_2'
  };

  catalogos = computed(() => {
    const categorias = this.state.homeResource.value()?.categorias || [];

    return categorias.map(cat => ({
      id: cat.idcategoria,
      nombre: cat.nombre,
      descripcion: `Technical specifications and inventory for ${cat.nombre}.`,
      icon: this.iconMap[cat.slug] || this.iconMap['default'],
      version: 'v2.4 Final',
      formato: '.xlsx'
    }));
  });

  ngOnInit(): void {
    this.setMetaTags();
  }

  private setMetaTags(): void {
    const pageTitle = 'Catálogos de Repuestos para Descargar | Quinchau';
    const pageDesc  = 'Descarga catálogos en Excel con precios y stock de repuestos, accesorios y llantas para motos. Información actualizada al instante.';
    const imagenUrl = 'https://quinchau.com/weberp/img/m/downloads-preview.jpg'; // TODO: subir esta imagen
    const urlCompleta = 'https://quinchau.com/downloads';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description',         content: pageDesc });
    this.meta.updateTag({ name: 'robots',               content: 'index, follow' });
    this.meta.updateTag({ property: 'og:title',         content: pageTitle });
    this.meta.updateTag({ property: 'og:description',   content: pageDesc });
    this.meta.updateTag({ property: 'og:image',         content: imagenUrl });
    this.meta.updateTag({ property: 'og:image:width',   content: '1200' });
    this.meta.updateTag({ property: 'og:image:height',  content: '630' });
    this.meta.updateTag({ property: 'og:image:alt',     content: 'Catálogos de descarga Quinchau' });
    this.meta.updateTag({ property: 'og:url',           content: urlCompleta });
    this.meta.updateTag({ property: 'og:type',          content: 'website' });
    this.meta.updateTag({ property: 'og:site_name',     content: 'Quinchau' });
    this.meta.updateTag({ property: 'og:locale',        content: 'es_ES' });
    this.meta.updateTag({ name: 'twitter:card',         content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',        content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description',  content: pageDesc });
    this.meta.updateTag({ name: 'twitter:image',        content: imagenUrl });
  }

  ejecutarDescarga(idCat: string, nombre: string) {
    this.api.downloadCategoryExcel(idCat).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `Catalogo_${nombre.trim().replace(/\s+/g, '_')}.xlsx`;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('Error en la descarga del catálogo:', err);
      }
    });
  }
}
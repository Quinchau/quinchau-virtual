import { Component, computed, inject } from '@angular/core';
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
export class Downloaders {
  private state = inject(ManagerState);
  private api = inject(ManagerApis);

  private iconMap: Record<string, string> = {
    'repuestos': 'settings_input_component',
    'accesorios': 'Electric_Scooter',
    'llantas': 'album',
    'default': 'inventory_2'
  };

  // Transformación de datos: Aseguramos la captura del idcategoria real
  catalogos = computed(() => {
    const categorias = this.state.homeResource.value()?.categorias || [];
    
    return categorias.map(cat => ({
      id: cat.idcategoria, // Importante: mantenemos el string original "0000"
      nombre: cat.nombre,
      descripcion: `Technical specifications and inventory for ${cat.nombre}.`,
      icon: this.iconMap[cat.slug] || this.iconMap['default'],
      version: 'v2.4 Final',
      formato: '.xlsx'
    }));
  });

  ejecutarDescarga(idCat: string, nombre: string) {
    // Si el id es "0000", la API filtrará correctamente en MySQL
    this.api.downloadCategoryExcel(idCat).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Sanitizamos el nombre del archivo para el SO
        const fileName = `Catalogo_${nombre.trim().replace(/\s+/g, '_')}.xlsx`;
        a.download = fileName;
        
        document.body.appendChild(a);
        a.click();
        
        // Limpieza de recursos del navegador
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('Error en la descarga del catálogo:', err);
        // Aquí podrías disparar un mensaje visual de error si lo deseas
      }
    });
  }
}
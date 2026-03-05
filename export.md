# Project Structure

```
public/
  icons/
    icon-72x72.png
    icon-96x96.png
    icon-128x128.png
    icon-144x144.png
    icon-152x152.png
    icon-192x192.png
    icon-384x384.png
    icon-512x512.png
  favicon.ico
  googleca0fa02352c61ccd.html
  manifest.webmanifest
src/
  app/
    app/
    components/
      header/
        header.html
        header.ts
      search-box/
        search-box.html
        search-box.ts
      success-order/
        success-order.html
        success-order.ts
      whatsapp-button/
        whatsapp-button.html
        whatsapp-button.ts
    data/
      transfer-actions.ts
    guards/
      admin.guard.ts
      auth-guard.ts
    models/
      cart-checkout.models.ts
      company_config.model.ts
      transfer.model.ts
    pages/
      category/
        category.html
        category.ts
      checkout/
        checkout.html
        checkout.ts
      dashboard/
        dashboard.html
        dashboard.ts
      exe-order/
        exe-order.html
        exe-order.ts
      home/
        home.html
        home.ts
      login/
        login.html
        login.ts
      newtransfer/
        newtransfer.html
        newtransfer.ts
      product-detail/
        product-detail.html
        product-detail.ts
      product-order/
        product-order.html
        product-order.ts
      transfer-detail/
        transfer-detail.html
        transfer-detail.ts
      transfers/
        transfers.html
        transfers.ts
    services/
      auth.interceptor.ts
      auth.ts
      LayerHistoryService.ts
      manager-apis.ts
      manager-state.ts
      search.service.ts
      ssr-identity.interceptor.ts
    app.config.server.ts
    app.config.ts
    app.css
    app.html
    app.routes.server.ts
    app.routes.ts
    app.ts
  environments/
    environment.prod.ts
    environment.ts
  index.html
  main.server.ts
  main.ts
  server.ts
  styles.css
.editorconfig
.gitignore
.nvmrc
angular.json
datos.md
endpoints.md
export.md
ngsw-config.json
package-lock.json
package.json
postcss.config.js
README.md
tailwind.config.js
tsconfig.app.json
tsconfig.json
tsconfig.spec.json
```



# Selected Files Content

## src/app/pages/category/category.html

```html
<div class="flex flex-row h-screen w-full font-sans overflow-hidden">

    <!--BLOQUE CATEGORIAS-->
  
  <aside class="w-[20%] min-w-[90px] max-w-[200px] bg-gray-200 shadow-xl flex flex-col border-r border-gray-100/50">
       
  <ul class="flex-1 overflow-y-auto py-2 no-scrollbar">
    @for (cat of categorias(); track cat; let last = $last) {
      <li class="flex flex-col">
        
        <button 
          (click)="seleccionarCategoria(cat)"
          [class.bg-white]="categoriaSeleccionada() === cat"
          [class.font-bold]="categoriaSeleccionada() === cat"
          [class.border-l-orange-500]="categoriaSeleccionada() === cat"
          [class.border-l-transparent]="categoriaSeleccionada() !== cat"
          class="w-full text-left text-black text-[11px] md:text-base px-4 py-6 md:py-8 transition-all duration-200 active:scale-95 hover:bg-gray-400/50 border-l-4">
          {{ cat }}
        </button>

        @if (!last) {
          <div class="w-full h-[1px] bg-gray-400/50"></div>
        }
        
      </li>
    }
  </ul>
</aside>

<!--BLOQUE SUB CATEGORIAS-->

  <main class="flex-1 bg-white overflow-y-auto p-2 md:p-6 no-scrollbar">
  
  <section class="grid grid-cols-3 gap-2 md:gap-4">
    @for (sub of subcategoriasActuales(); track sub) {
      <div class="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform">
        
        <div class="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/40 backdrop-blur-sm border-2 border-yellow-500/50 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-blue-900 transition-colors">
          <span class="text-[10px] text-yellow-800 font-bold uppercase">Img</span>
        </div>

        <p class="mt-2 text-[10px] md:text-sm font-extrabold text-blue-900 text-center leading-tight break-words max-w-full">
          {{ sub }}
        </p>
        
      </div>
    } @empty {
      <div class="col-span-3 flex flex-col items-center justify-center py-20 opacity-40">
        <p class="text-blue-900 text-xs font-bold italic">Sin subcategorías</p>
      </div>
    }
  </section>

</main>

</div>
```

## src/app/pages/category/category.ts

```ts
import { Component, signal, linkedSignal } from '@angular/core';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [],
  templateUrl: './category.html',
  styles: ``
})
export class Category {
  // Lista de categorías (en un escenario real vendría de un servicio)
  categorias = signal(['Electrónica', 'Hogar', 'Moda', 'Deportes']);
  
  // Signal para la categoría seleccionada
  categoriaSeleccionada = signal<string>(this.categorias()[0]);

  // LinkedSignal: Si la lista de categorías cambia, reseteamos la selección a la primera
  subcategoriasActuales = linkedSignal({
    source: this.categoriaSeleccionada,
    computation: (cat) => {
      // Lógica de ejemplo: simula obtener subcategorías basadas en la selección
      return [`Sub 1 de ${cat}`, `Sub 2 de ${cat}`, `Sub 3 de ${cat}`, `Sub 4 de ${cat}`, `Sub 5 de ${cat}`, `Sub 6 de ${cat}`, `Sub 7 de ${cat}`, `Sub 8 de ${cat}`, `Sub 9 de ${cat}`, `Sub 10 de ${cat}`, `Sub 11 de ${cat}`, `Sub 12 de ${cat}`];
    }
  });

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada.set(cat);
  }
}
```


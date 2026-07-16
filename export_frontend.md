# Project Structure

```
docs/
  banner.document.md
  datos.md
  endpoints.md
  estilos.stitch.md
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
  sw-custom.js
  sw.js
src/
  app/
    components/
      bottom-nav/
        bottom-nav.html
        bottom-nav.ts
      header/
        header.html
        header.ts
      loading-bar/
        loading-bar.html
        loading-bar.ts
      product-picker/
        product-picker.html
        product-picker.ts
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
    interceptors/
      connection-status.interceptor.ts
    models/
      cart-checkout.models.ts
      company_config.model.ts
      customer.model.ts
      faqs.models.ts
      invoice.models.ts
      on-demand-model.ts
      orders.models.ts
      register-models.ts
      terminos.model.ts
      transfer.model.ts
    pages/
      branch/
        branch.html
        branch.ts
      category/
        category.html
        category.ts
      checkout/
        checkout.html
        checkout.ts
      customer/
        customer.html
        customer.ts
      dashboard/
        dashboard.html
        dashboard.ts
      desk/
        desk.html
        desk.ts
      downloaders/
        downloaders.html
        downloaders.ts
      exe-order/
        exe-order.html
        exe-order.ts
      faqs/
        faqs.ts
        faqscomponent.html
      global-search/
        global-search.html
        global-search.ts
      home/
        home.html
        home.ts
      invoice/
        invoice.html
        invoice.ts
      login/
        login.html
        login.ts
      manual-whatsapp/
        manual-whatsapp.html
        manual-whatsapp.ts
      modelpage/
        modelpage.html
        modelpage.ts
      newtransfer/
        newtransfer.html
        newtransfer.ts
      on-demand-detail/
        on-demand-detail.html
        on-demand-detail.ts
      on-demand-list/
        on-demand-list.html
        on-demand-list.ts
      order-detail/
        order-detail.html
        order-detail.ts
      order-invoice/
        order-invoice.html
        order-invoice.ts
      order-list/
        order-list.html
        order-list.ts
      orders/
        orders.html
        orders.ts
      pick-list/
        pick-list.html
        pick-list.ts
      privacy-policy/
        privacy-policy.html
        privacy-policy.ts
      product-admin/
        product-admin.html
        product-admin.ts
      product-cart-edit/
        product-cart-edit.html
        product-cart-edit.ts
      product-create/
        product-create.html
        product-create.ts
      product-detail/
        product-detail.html
        product-detail.ts
      product-edit/
        product-edit.html
        product-edit.ts
      product-image-editor/
        product-image-editor.html
        product-image-editor.ts
      product-image-uploader/
        product-image-uploader.html
        product-image-uploader.ts
      product-order/
        product-order.html
        product-order.ts
      product-page/
        product-page.html
        product-page.ts
      register/
        register.html
        register.ts
      terminos/
        terminos.component.html
        terminos.component.ts
      transfer-detail/
        transfer-detail.html
        transfer-detail.ts
      transfer-group-detail/
        transfer-group-detail.html
        transfer-group-detail.ts
      transfers/
        transfers.html
        transfers.ts
    services/
      auth.interceptor.ts
      auth.ts
      chat-bridge.ts
      connection-status.ts
      LayerHistoryService.ts
      manager-apis.ts
      manager-state.ts
      search.service.ts
      socket-io.service.ts
      ssr-identity.interceptor.ts
      sw-update.service.ts
      terminos.service.ts
      upload-queue.service.ts
    app.config.server.ts
    app.config.ts
    app.css
    app.html
    app.routes.server.ts
    app.routes.ts
    app.ts
  assets/
    fonts/
      dm-sans-v17-latin-500.woff2
      dm-sans-v17-latin-600.woff2
      dm-sans-v17-latin-700.woff2
      dm-sans-v17-latin-regular.woff2
  environments/
    environment.prod.ts
    environment.ts
  index.html
  main.server.ts
  main.ts
  server.ts
  styles.css
.editorconfig
.env
.gitignore
.nvmrc
angular.json
DailySalesInquiry.php
Dockerfile
export.md
ngsw-config.json
package-lock.json
package.json
postcss.config.js
proxy.conf.json
README.md
tailwind.config.js
tsconfig.app.json
tsconfig.json
tsconfig.spec.json
```



# Selected Files Content

## src/app/models/faqs.models.ts

```ts
// src/app/models/faqs.models.ts

export interface FaqItem {
  id: number;
  model_id: number | string;
  question: string;
  answer: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}


export interface FaqListResponse {
  exito: boolean;
  
 data: FaqItem[];
}


export interface FaqSingleResponse {
  exito: boolean;
  
  mensaje: string;
  data: FaqItem;
}


export interface FaqDeleteResponse {
  exito: boolean;
  
  mensaje: string;
}

export interface CreateFaqDto {
  modelId: number | string;
  question: string;
  answer: string;
}


export interface UpdateFaqDto {
  question: string;
  answer: string;
}


export const FAQ_EDIT_ACCESS = [8, 10] as const;


export type FaqEditAccess = typeof FAQ_EDIT_ACCESS[number];


export function canEditFaqs(fullaccess?: number): boolean {
  if (fullaccess === undefined) return false;
  return FAQ_EDIT_ACCESS.includes(fullaccess as FaqEditAccess);
}
```

## src/app/pages/faqs/faqs.ts

```ts
// src/app/pages/faqs/faqs.ts

import {
  Component, inject, signal, computed, OnInit, OnDestroy, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';
import { ManagerApis } from '../../services/manager-apis';
import { 
  FaqItem, 
  canEditFaqs,
  CreateFaqDto,
  UpdateFaqDto
} from '../../models/faqs.models';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faqscomponent.html',
})
export class FaqsComponent implements OnInit, OnDestroy {

  // ── Dependencias ──────────────────────────────────────────────────────────
  private managerState = inject(ManagerState);
  private managerApis = inject(ManagerApis);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();
  private meta = inject(Meta);
  private titleService = inject(Title);

  // ── Estado ────────────────────────────────────────────────────────────────
  isSaving = signal(false);
  openItemId = signal<number | null>(null);
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('info');

  // ── Datos del modelo ──────────────────────────────────────────────────────
  modelName = signal<string>('');

  // ── Loading / Error desde resource ───────────────────────────────────────
  isLoading = computed(() => this.managerState.faqsResource.isLoading());
  error = computed(() => this.managerState.faqsResource.error() 
    ? 'No se pudieron cargar las preguntas frecuentes' 
    : null
  );

  // ── Acceso ────────────────────────────────────────────────────────────────
  canEdit = computed(() => {
    const fa = this.managerState.currentUser()?.fullaccess;
    return canEditFaqs(fa);
  });

  // ── FAQs: resource como base + signal local para mutaciones CRUD ──────────
  private faqsBase = computed(() => this.managerState.faqsResource.value() ?? []);
  private localFaqs = signal<FaqItem[] | null>(null);
  faqs = computed(() => this.localFaqs() ?? this.faqsBase());

  // ── Formulario ────────────────────────────────────────────────────────────
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formQuestion = '';
  formAnswer = '';

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    const currentModel = this.managerState.currentModel();

    if (currentModel?.idmodelo) {
      const marca = currentModel.marcadescrip || '';
      const modelo = currentModel.modeldescrip || '';
      this.modelName.set(`${marca} ${modelo}`.trim());
      this.setFaqMeta();
    }

    this.route.parent?.params.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const model = this.managerState.currentModel();
      if (model?.idmodelo) {
        const marca = model.marcadescrip || '';
        const modelo = model.modeldescrip || '';
        this.modelName.set(`${marca} ${modelo}`.trim());
        this.setFaqMeta();
        this.localFaqs.set(null); // ✅ resetear overrides locales al cambiar modelo
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const faqId = params['faqId'];
        if (faqId) {
          setTimeout(() => {
            this.openItemId.set(Number(faqId));
            const element = document.getElementById(`faq-${faqId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      });
    }
  }

  private setFaqMeta(): void {
    const model = this.modelName();
    const description = `Preguntas frecuentes sobre ${model}. Resolvé tus dudas antes de comprarlo.`;

    this.titleService.setTitle(`FAQ · ${model}`);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: `Preguntas frecuentes · ${model}` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  close(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  goToCatalog(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // ── Acordeón ──────────────────────────────────────────────────────────────
  toggleItem(id: number): void {
    const isOpen = this.openItemId() === id;
    this.openItemId.set(isOpen ? null : id);

    if (!isOpen) {
      this.router.navigate([id], { relativeTo: this.route });
    } else {
      this.router.navigate(['../'], { relativeTo: this.route });
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  startAdd(): void {
    this.editingId.set(null);
    this.formQuestion = '';
    this.formAnswer = '';
    this.showForm.set(true);
    this.openItemId.set(null);
  }

  startEdit(faq: FaqItem): void {
    this.editingId.set(faq.id);
    this.formQuestion = faq.question;
    this.formAnswer = faq.answer;
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formQuestion = '';
    this.formAnswer = '';
  }

  async saveItem(): Promise<void> {
    if (!this.formQuestion.trim() || !this.formAnswer.trim()) {
      this.showToast('Por favor completa todos los campos', 'error');
      return;
    }

    this.isSaving.set(true);
    const isEdit = this.editingId() !== null;

    try {
      let saved: FaqItem;
      const current = this.faqs();

      if (isEdit) {
        const updateData: UpdateFaqDto = {
          question: this.formQuestion.trim(),
          answer: this.formAnswer.trim(),
        };
        const response = await firstValueFrom(
          this.managerApis.updateFaq(this.editingId()!, updateData)
        );
        saved = response.data;
        this.localFaqs.set(current.map((f: FaqItem) => f.id === saved.id ? saved : f));
        this.showToast('Pregunta actualizada correctamente', 'success');
      } else {
        const modelId = this.managerState.currentModel()?.idmodelo;
        const createData: CreateFaqDto = {
          modelId: modelId!,
          question: this.formQuestion.trim(),
          answer: this.formAnswer.trim(),
        };
        const response = await firstValueFrom(
          this.managerApis.createFaq(createData)
        );
        saved = response.data;
        this.localFaqs.set([...current, saved]);
        this.showToast('Pregunta creada correctamente', 'success');
      }

      this.cancelForm();
    } catch (err) {
      console.error('[faqs] Error al guardar FAQ:', err);
      this.showToast('Error al guardar la pregunta', 'error');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteItem(id: number): Promise<void> {
    if (!confirm('¿Eliminar esta pregunta?')) return;

    try {
      await firstValueFrom(this.managerApis.deleteFaq(id));
      this.localFaqs.set(this.faqs().filter((f: FaqItem) => f.id !== id));
      if (this.openItemId() === id) {
        this.openItemId.set(null);
        this.router.navigate(['../'], { relativeTo: this.route });
      }
      this.showToast('Pregunta eliminada correctamente', 'success');
    } catch (err) {
      console.error('[faqs] Error al eliminar FAQ:', err);
      this.showToast('Error al eliminar la pregunta', 'error');
    }
  }

  // ── Compartir ─────────────────────────────────────────────────────────────
  copyFaqLink(faqId: number): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const faqUrl = `${window.location.origin}${this.location.path()}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(faqUrl).then(() => {
        this.showToast('Enlace copiado al portapapeles', 'success');
      }).catch(() => this.fallbackCopy(faqUrl));
    } else {
      this.fallbackCopy(faqUrl);
    }
  }

  private fallbackCopy(text: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      this.showToast('Enlace copiado al portapapeles', 'success');
    } catch {
      this.showToast(`Enlace: ${text}`, 'info');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  shareFaq(faq: FaqItem): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const faqUrl = `${window.location.origin}${this.location.path()}`;

    if (navigator.share) {
      navigator.share({
        title: `Pregunta sobre ${this.modelName()}`,
        url: faqUrl
      }).catch(() => {});
    } else {
      this.copyFaqLink(faq.id);
    }
  }

  shareFaqsPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const baseUrl = window.location.origin;
    const currentPath = this.location.path();
    const pathWithoutQuery = currentPath.split('?')[0];
    const sharePath = pathWithoutQuery.endsWith('/faq') ? pathWithoutQuery : `${pathWithoutQuery}/faq`;
    const fullUrl = `${baseUrl}${sharePath}`;

    if (navigator.share) {
      navigator.share({
        title: `Preguntas frecuentes: ${this.modelName()}`,
        url: fullUrl
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        this.showToast('Enlace copiado al portapapeles', 'success');
      }).catch(() => this.fallbackCopy(fullUrl));
    } else {
      this.fallbackCopy(fullUrl);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  retryLoad(): void {
    this.localFaqs.set(null);
    this.managerState.faqsResource.reload();
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  closeToast(): void {
    this.toastMessage.set(null);
  }
}
```

## src/app/pages/faqs/faqscomponent.html

```html
<!-- src/app/pages/faqs/faqscomponent.html -->

<!-- Backdrop -->
<div
  class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
  (click)="close()"
></div>

<!-- Bottom Sheet -->
<div
  class="fixed bottom-0 inset-x-0 z-50 flex flex-col bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl max-h-[75dvh] h-[75dvh]
         translate-y-0 transition-transform duration-300 ease-out"
  role="dialog"
  aria-modal="true"
  [attr.aria-label]="'Preguntas frecuentes: ' + modelName()"
>
  <!-- Header - dos líneas -->
<div class="flex-none px-5 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
  <div class="mx-auto w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 mb-4"></div>

  <!-- Fila 1: Título -->
  <div class="flex items-start justify-between gap-3 mb-3">
    <div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-0.5">FAQ</p>
      <h2 class="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight truncate max-w-[180px] sm:max-w-none">
        {{ modelName() || 'Este modelo' }}
      </h2>
    </div>
    <!-- Solo el botón cerrar en esta fila (opcional) -->
    <button
      (click)="close()"
      class="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
      aria-label="Cerrar"
    >
      <span class="material-symbols-outlined text-xl leading-none">close</span>
    </button>
  </div>

  <!-- Fila 2: Botones -->
  <div class="flex items-center gap-2 flex-wrap">
    <button
      (click)="shareFaqsPage()"
      class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold transition-colors"
      title="Copiar enlace de preguntas frecuentes"
    >
      <span class="material-symbols-outlined text-sm leading-none">share</span>
      Compartir
    </button>
    
    <button
      (click)="goToCatalog()"
      class="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold transition-colors"
    >
      <span class="material-symbols-outlined text-sm leading-none">arrow_back</span>
      Ir al catálogo
    </button>

    @if (canEdit()) {
      <button
        (click)="startAdd()"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors"
      >
        <span class="material-symbols-outlined text-sm leading-none">add</span>
        Nueva
      </button>
    }
  </div>
</div>


  <!-- Body scrollable -->
  <div 
    class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 pb-24"
    style="height: 0; min-height: 0;"
  >

    <!-- Loading -->
    @if (isLoading()) {
      @for (i of [1,2,3]; track i) {
        <div class="rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-16 animate-pulse"></div>
      }
    }

    <!-- Error -->
    @else if (error()) {
      <div class="rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 text-center">
        <span class="material-symbols-outlined text-3xl text-red-500">error</span>
        <p class="text-sm text-red-600 dark:text-red-400 mt-1">
          {{ error() }}
        </p>
        <button
          (click)="retryLoad()"
          class="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          Reintentar
        </button>
      </div>
    }

    <!-- Vacío -->
    @else if (faqs().length === 0 && !showForm()) {
      <div class="flex flex-col items-center justify-center py-14 text-zinc-400">
        <span class="material-symbols-outlined text-5xl mb-3">quiz</span>
        <p class="font-bold text-sm">Sin preguntas todavía</p>
        @if (canEdit()) {
          <p class="text-xs mt-1">Usá el botón <strong>Nueva</strong> para agregar una.</p>
        }
        @if (!canEdit()) {
          <p class="text-xs mt-1">No hay preguntas frecuentes disponibles.</p>
        }
      </div>
    }

    <!-- Formulario Agregar / Editar -->
    @if (showForm()) {
      <div class="rounded-2xl border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/30 p-4 space-y-3">
        <p class="text-xs font-bold uppercase tracking-widest text-orange-500">
          {{ editingId() ? 'Editar pregunta' : 'Nueva pregunta' }}
        </p>
        <textarea
          [(ngModel)]="formQuestion"
          placeholder="Pregunta…"
          rows="2"
          class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
        ></textarea>
        <textarea
          [(ngModel)]="formAnswer"
          placeholder="Respuesta…"
          rows="3"
          class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
        ></textarea>
        <div class="flex gap-2 justify-end">
          <button
            (click)="cancelForm()"
            class="px-4 py-1.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            (click)="saveItem()"
            [disabled]="isSaving()"
            class="px-4 py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-colors"
          >
            {{ isSaving() ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    }

    <!-- Lista de FAQs -->
    @for (faq of faqs(); track faq.id) {
      <div 
        class="rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 overflow-hidden"
        [id]="'faq-' + faq.id"
      >

        <!-- Pregunta (accordion toggle) -->
        <button
          class="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
          (click)="toggleItem(faq.id)"
          [attr.aria-expanded]="openItemId() === faq.id"
        >
          <span class="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex-1 leading-snug">
            {{ faq.question }}
          </span>
          <span
            class="material-symbols-outlined text-base text-zinc-400 mt-0.5 transition-transform duration-200"
            [class.rotate-180]="openItemId() === faq.id"
          >
            expand_more
          </span>
        </button>

        <!-- Respuesta expandible -->
        @if (openItemId() === faq.id) {
          <div class="px-4 pb-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-700 pt-2">
            {{ faq.answer }}

            <!-- Acciones: Editar/Eliminar/Compartir -->
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700">
              <div class="flex gap-2">
                @if (canEdit()) {
                  <button
                    (click)="startEdit(faq)"
                    class="flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-orange-500 transition-colors"
                  >
                    <span class="material-symbols-outlined text-sm leading-none">edit</span>
                    Editar
                  </button>
                  <button
                    (click)="deleteItem(faq.id)"
                    class="flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <span class="material-symbols-outlined text-sm leading-none">delete</span>
                    Eliminar
                  </button>
                }
              </div>
              
              <!-- Botón para compartir/copiar enlace -->
              <button
                (click)="shareFaq(faq)"
                class="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-orange-500 transition-colors"
                title="Compartir esta pregunta"
              >
                <span class="material-symbols-outlined text-sm leading-none">share</span>
                Compartir
              </button>
            </div>
          </div>
        }

      </div>
    }

  </div>
  <!-- Fin Body scrollable -->
   
  <!-- Safe-area bottom -->
  <div class="flex-none pb-6"></div>
</div>

<!-- Toast / Notificación -->
@if (toastMessage()) {
  <div 
    class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl shadow-xl max-w-[90vw] text-sm font-bold transition-all duration-300 bg-white border"
    [class.border-green-400]="toastType() === 'success'"
    [class.border-red-400]="toastType() === 'error'"
    [class.border-zinc-300]="toastType() === 'info'"
    [class.text-green-600]="toastType() === 'success'"
    [class.text-red-600]="toastType() === 'error'"
    [class.text-zinc-700]="toastType() === 'info'"
    role="alert"
  >
  
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-lg">
        {{ toastType() === 'success' ? 'check_circle' : toastType() === 'error' ? 'error' : 'info' }}
      </span>
      <span>{{ toastMessage() }}</span>
      <button
        (click)="closeToast()"
        class="ml-2 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar notificación"
      >
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  </div>
}
```


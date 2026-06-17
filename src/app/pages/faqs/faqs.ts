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
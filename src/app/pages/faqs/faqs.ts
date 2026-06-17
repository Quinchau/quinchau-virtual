// src/app/pages/faqs/faqs.ts

import {
  Component, inject, input, signal, computed, OnChanges, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';
import { ManagerApis } from '../../services/manager-apis';
import { 
  FaqItem, 
  canEditFaqs,
  CreateFaqDto,
  UpdateFaqDto
} from '../../models/faqs.models';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faqscomponent.html',
})
export class FaqsComponent implements OnChanges {

  // ── Inputs ────────────────────────────────────────────────────────────────
  modelId   = input.required<number | string>();
  modelName = input<string>('');
  modelSlug = input<string>(''); // Para construir URLs amigables

  // ── Dependencias ──────────────────────────────────────────────────────────
  private managerState = inject(ManagerState);
  private managerApis = inject(ManagerApis);
  private location = inject(Location);

  // ── Estado del panel ──────────────────────────────────────────────────────
  isOpen     = signal(false);
  isLoading  = signal(false);
  isSaving   = signal(false);
  openItemId = signal<number | null>(null);
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('info');

  // ── Acceso ────────────────────────────────────────────────────────────────
  canEdit = computed(() => {
    const fa = this.managerState.currentUser()?.fullaccess;
    return canEditFaqs(fa);
  });

  // ── Datos ─────────────────────────────────────────────────────────────────
  faqs = signal<FaqItem[]>([]);
  error = signal<string | null>(null);

  // ── Formulario ────────────────────────────────────────────────────────────
  showForm     = signal(false);
  editingId    = signal<number | null>(null);
  formQuestion = '';
  formAnswer   = '';

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnChanges(): void {
    this.faqs.set([]);
    this.isOpen.set(false);
    this.cancelForm();
    this.openItemId.set(null);
    this.error.set(null);
    this.toastMessage.set(null);
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  open(): void {
    this.isOpen.set(true);
    if (this.faqs().length === 0) {
      this.loadFaqs();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.cancelForm();
    this.openItemId.set(null);
    this.toastMessage.set(null);
  }

  // ── Acordeón ──────────────────────────────────────────────────────────────
  toggleItem(id: number): void {
    this.openItemId.update(cur => cur === id ? null : id);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  private async loadFaqs(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const response = await firstValueFrom(
        this.managerApis.getFaqs(this.modelId())
      );
      this.faqs.set(response.data ?? []);
    } catch (err) {
      console.error('[faqs] Error al cargar FAQs:', err);
      this.error.set('No se pudieron cargar las preguntas frecuentes');
    } finally {
      this.isLoading.set(false);
    }
  }

  startAdd(): void {
    this.editingId.set(null);
    this.formQuestion = '';
    this.formAnswer   = '';
    this.showForm.set(true);
    this.openItemId.set(null);
  }

  startEdit(faq: FaqItem): void {
    this.editingId.set(faq.id);
    this.formQuestion = faq.question;
    this.formAnswer   = faq.answer;
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formQuestion = '';
    this.formAnswer   = '';
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

      if (isEdit) {
        const updateData: UpdateFaqDto = {
          question: this.formQuestion.trim(),
          answer: this.formAnswer.trim(),
        };
        const response = await firstValueFrom(
          this.managerApis.updateFaq(this.editingId()!, updateData)
        );
        saved = response.data;
        this.faqs.update(list => list.map(f => f.id === saved.id ? saved : f));
        this.showToast('Pregunta actualizada correctamente', 'success');
      } else {
        const createData: CreateFaqDto = {
          modelId: this.modelId(),
          question: this.formQuestion.trim(),
          answer: this.formAnswer.trim(),
        };
        const response = await firstValueFrom(
          this.managerApis.createFaq(createData)
        );
        saved = response.data;
        this.faqs.update(list => [...list, saved]);
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
      this.faqs.update(list => list.filter(f => f.id !== id));
      if (this.openItemId() === id) this.openItemId.set(null);
      this.showToast('Pregunta eliminada correctamente', 'success');
    } catch (err) {
      console.error('[faqs] Error al eliminar FAQ:', err);
      this.showToast('Error al eliminar la pregunta', 'error');
    }
  }

  // ── Compartir / Copiar enlace ────────────────────────────────────────────
  
  /**
   * Copia el enlace a una FAQ específica
   */
  copyFaqLink(faqId: number): void {
    const baseUrl = window.location.origin;
    const currentPath = this.location.path();
    const faqUrl = `${baseUrl}${currentPath}?faq=${faqId}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(faqUrl).then(() => {
        this.showToast('Enlace copiado al portapapeles', 'success');
      }).catch(() => {
        this.fallbackCopy(faqUrl);
      });
    } else {
      this.fallbackCopy(faqUrl);
    }
  }

  /**
   * Fallback para copiar enlace (cuando clipboard no está disponible)
   */
  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      this.showToast('Enlace copiado al portapapeles', 'success');
    } catch (err) {
      this.showToast(`Enlace: ${text}`, 'info');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  /**
   * Compartir con Web Share API (móviles)
   */
  shareFaq(faq: FaqItem): void {
    const baseUrl = window.location.origin;
    const currentPath = this.location.path();
    const faqUrl = `${baseUrl}${currentPath}?faq=${faq.id}`;
    
    const shareData = {
      title: `Pregunta sobre ${this.modelName()}`,
      text: `${faq.question}\n\n${faq.answer}`,
      url: faqUrl
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // Si el usuario cancela, no hacer nada
      });
    } else {
      this.copyFaqLink(faq.id);
    }
  }

  /**
   * Obtiene la URL de la página de FAQs completa
   */
  getFaqsPageUrl(): string {
    const slug = this.modelSlug() || this.modelName().replace(/\s+/g, '-').toLowerCase();
    return `/faqs/${this.modelId()}/${slug}`;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  retryLoad(): void {
    this.loadFaqs();
  }

  /**
   * Muestra un toast/notificación
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  /**
   * Cierra el toast manualmente
   */
  closeToast(): void {
    this.toastMessage.set(null);
  }
}
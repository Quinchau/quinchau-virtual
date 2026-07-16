// src/app/pages/faqs-negocio/faqs-negocio.ts

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ManagerState } from '../../services/manager-state';
import { SystemFaqsService } from '../../services/system-faqs.service';
import {
  SystemFaqItem,
  canEditSystemFaqs,
  CreateSystemFaqDto,
  UpdateSystemFaqDto,
  ActivoFilter,
} from '../../models/system-faqs.models';

@Component({
  selector: 'app-faqs-negocio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faqs-negocio.html',
})
export class FaqsNegocioComponent implements OnInit {

  // ── Dependencias ──────────────────────────────────────────────────────────
  private managerState = inject(ManagerState);
  private systemFaqsApi = inject(SystemFaqsService);
  private meta = inject(Meta);
  private titleService = inject(Title);

  // ── Acceso ────────────────────────────────────────────────────────────────
  canEdit = computed(() => canEditSystemFaqs(this.managerState.currentUser()?.fullaccess));

  // ── Estado de carga ───────────────────────────────────────────────────────
  isLoading = signal(true);
  error = signal<string | null>(null);

  // ── Datos ─────────────────────────────────────────────────────────────────
  faqs = signal<SystemFaqItem[]>([]);
  categorias = signal<string[]>([]);

  // ── Filtros ───────────────────────────────────────────────────────────────
  filterCategoria = signal<string>('');
  filterActivo = signal<ActivoFilter>('all');

  // Agrupado por categoría para render (categoría sin asignar => "General")
  groupedFaqs = computed(() => {
    const groups = new Map<string, SystemFaqItem[]>();
    for (const faq of this.faqs()) {
      const key = faq.categoria?.trim() || 'General';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(faq);
    }
    return Array.from(groups.entries()).map(([categoria, items]) => ({ categoria, items }));
  });

  // ── Acordeón ──────────────────────────────────────────────────────────────
  openItemId = signal<number | null>(null);

  // ── Formulario ────────────────────────────────────────────────────────────
  showForm = signal(false);
  editingId = signal<number | null>(null);
  isSaving = signal(false);
  formQuestion = '';
  formAnswer = '';
  formCategoria = '';

  // ── Toast ─────────────────────────────────────────────────────────────────
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('info');

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.setMeta();
    this.loadFaqs();
    this.loadCategorias();
  }

  private setMeta(): void {
    const title = 'Preguntas frecuentes del negocio';
    const description = 'Métodos de pago, garantías, ubicación, envíos y mayoreo.';
    this.titleService.setTitle('FAQ · Negocio');
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  // ── Carga de datos ────────────────────────────────────────────────────────
  async loadFaqs(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const categoria = this.filterCategoria() || undefined;
      
      const request$ = this.canEdit()
        ? this.systemFaqsApi.listAll(categoria, this.filterActivo())
        : this.systemFaqsApi.listPublic();

      const response = await firstValueFrom(request$);
      // ✅ response tiene la propiedad 'data'
      let data = response.data as SystemFaqItem[];

      if (!this.canEdit() && categoria) {
        data = data.filter(f => (f.categoria || 'General') === categoria);
      }

      this.faqs.set(data);
    } catch (err) {
      console.error('[faqs-negocio] Error al cargar FAQs:', err);
      this.error.set('No se pudieron cargar las preguntas frecuentes');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadCategorias(): Promise<void> {
    try {
      if (this.canEdit()) {
        const response = await firstValueFrom(this.systemFaqsApi.listCategorias());
        // ✅ response tiene la propiedad 'data'
        this.categorias.set(response.data);
      } else {
        // Sin acceso admin: derivamos categorías de las FAQs públicas ya cargadas
        this.deriveCategoriasFromFaqs();
      }
    } catch (err) {
      console.error('[faqs-negocio] Error al cargar categorías:', err);
    }
  }

  private deriveCategoriasFromFaqs(): void {
    const categoriasSet = new Set<string>();
    this.faqs().forEach(faq => {
      if (faq.categoria?.trim()) {
        categoriasSet.add(faq.categoria.trim());
      }
    });
    
    if (categoriasSet.size === 0) {
      this.categorias.set(['General', 'Pagos', 'Envíos', 'Garantías', 'Contacto']);
    } else {
      this.categorias.set(Array.from(categoriasSet).sort());
    }
  }

  retryLoad(): void {
    this.loadFaqs();
  }

  // ── Filtros ───────────────────────────────────────────────────────────────
  onCategoriaFilterChange(categoria: string): void {
    this.filterCategoria.set(categoria);
    this.loadFaqs();
  }

  onActivoFilterChange(activo: ActivoFilter): void {
    this.filterActivo.set(activo);
    this.loadFaqs();
  }

  // ── Acordeón ──────────────────────────────────────────────────────────────
  toggleItem(id: number): void {
    this.openItemId.set(this.openItemId() === id ? null : id);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  startAdd(): void {
    this.editingId.set(null);
    this.formQuestion = '';
    this.formAnswer = '';
    this.formCategoria = this.filterCategoria() || '';
    this.showForm.set(true);
  }

  startEdit(faq: SystemFaqItem): void {
    this.editingId.set(faq.id);
    this.formQuestion = faq.question;
    this.formAnswer = faq.answer;
    this.formCategoria = faq.categoria || '';
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formQuestion = '';
    this.formAnswer = '';
    this.formCategoria = '';
  }

  async saveItem(): Promise<void> {
    if (!this.formQuestion.trim() || !this.formAnswer.trim()) {
      this.showToast('Por favor completa pregunta y respuesta', 'error');
      return;
    }

    this.isSaving.set(true);
    const isEdit = this.editingId() !== null;

    try {
      const dto: CreateSystemFaqDto | UpdateSystemFaqDto = {
        question: this.formQuestion.trim(),
        answer: this.formAnswer.trim(),
        categoria: this.formCategoria.trim() || null,
      };

      if (isEdit) {
        const response = await firstValueFrom(this.systemFaqsApi.update(this.editingId()!, dto));
        // ✅ response tiene la propiedad 'data'
        console.log('FAQ actualizada:', response.data);
        this.showToast('Pregunta actualizada correctamente', 'success');
      } else {
        const response = await firstValueFrom(this.systemFaqsApi.create(dto));
        // ✅ response tiene la propiedad 'data'
        console.log('FAQ creada:', response.data);
        this.showToast('Pregunta creada correctamente', 'success');
      }

      this.cancelForm();
      await this.loadFaqs();
      await this.loadCategorias();
    } catch (err) {
      console.error('[faqs-negocio] Error al guardar FAQ:', err);
      this.showToast('Error al guardar la pregunta', 'error');
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleActivo(faq: SystemFaqItem): Promise<void> {
    try {
      const response = await firstValueFrom(this.systemFaqsApi.toggleActivo(faq.id));
      // ✅ response tiene la propiedad 'data'
      this.faqs.set(this.faqs().map(f => f.id === faq.id ? response.data : f));
      this.showToast(
        response.data.activo ? 'Pregunta activada' : 'Pregunta desactivada',
        'success'
      );
    } catch (err) {
      console.error('[faqs-negocio] Error al cambiar estado:', err);
      this.showToast('Error al cambiar el estado', 'error');
    }
  }

  async deleteItem(id: number): Promise<void> {
    if (!confirm('¿Eliminar esta pregunta de forma permanente?')) return;

    try {
      await firstValueFrom(this.systemFaqsApi.remove(id));
      this.faqs.set(this.faqs().filter(f => f.id !== id));
      if (this.openItemId() === id) this.openItemId.set(null);
      this.showToast('Pregunta eliminada correctamente', 'success');
    } catch (err) {
      console.error('[faqs-negocio] Error al eliminar FAQ:', err);
      this.showToast('Error al eliminar la pregunta', 'error');
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  closeToast(): void {
    this.toastMessage.set(null);
  }
}
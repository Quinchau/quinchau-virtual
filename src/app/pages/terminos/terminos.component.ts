// src/app/pages/terminos/terminos.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TerminosService } from '../../services/terminos.service';
import { Termino, AliasItem, Entidad } from '../../models/terminos.model';
import { ManagerApis } from '../../services/manager-apis';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [TerminosService],
  templateUrl: './terminos.component.html'
})
export class TerminosComponent implements OnInit {
  private service = inject(TerminosService);
  private managerApis = inject(ManagerApis);

  // Estado
  terminos = signal<Termino[]>([]);
  entidades = signal<Entidad[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchTerm = signal('');
  soloActivos = signal(false);
  
  // UI State
  openAccordionId = signal<number | null>(null);
  editingTermino = signal<Termino | null>(null);
  editingAlias = signal<{ terminoId: number; alias: AliasItem } | null>(null);
  showCreateModal = signal(false);
  newTerminoName = signal('');
  newTerminoAliases = signal<string[]>([]);
  newTerminoEntidad = signal<number | null>(null);
  tempAliasInput = signal('');
  
  // Computed
  terminosFiltrados = computed(() => {
    const terminos = this.terminos();
    const search = this.searchTerm().toLowerCase().trim();
    
    if (!search) return terminos;
    
    return terminos.filter(t => 
      t.termino.toLowerCase().includes(search) ||
      t.alias.some(a => a.alias.toLowerCase().includes(search))
    );
  });

  ngOnInit(): void {
    this.loadTerminos();
    this.loadEntidades();
  }

  async loadTerminos(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const terminos = await this.service.getAll(this.soloActivos()).toPromise();
      console.log('📊 Términos recibidos:', terminos);
      console.log('🔍 Primer término:', terminos?.[0]);
      this.terminos.set(terminos || []);
    } catch (err: any) {
      this.error.set(err.message || 'Error al cargar términos');
    } finally {
      this.loading.set(false);
    }
  }

  toggleAccordion(id: number): void {
    this.openAccordionId.set(this.openAccordionId() === id ? null : id);
  }

  async toggleActivo(termino: Termino, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const updated = await this.service.toggleActivo(termino.id).toPromise();
      if (updated) {
        this.terminos.update(list =>
          list.map(t => t.id === termino.id ? updated : t)
        );
      }
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  }

  startEditTermino(termino: Termino, event: Event): void {
    event.stopPropagation();
    this.editingTermino.set({ ...termino });
  }

  async saveTerminoEdit(): Promise<void> {
    const termino = this.editingTermino();
    if (!termino) return;
    
    try {
      const updated = await this.service.update(termino.id, { termino: termino.termino, id_entidad: termino.id_entidad || undefined }).toPromise();
  console.log('📊 Término actualizado:', updated);
    console.log('🔍 entidad_nombre:', updated?.entidad_nombre);

      if (updated) {
        this.terminos.update(list =>
          list.map(t => t.id === termino.id ? updated : t)
        );
        this.highlightTermino(termino.id);
      }
      this.editingTermino.set(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar');
    }
  }

  cancelEditTermino(): void {
    this.editingTermino.set(null);
  }

  async deleteTermino(termino: Termino, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm(`¿Eliminar el término "${termino.termino}" y todos sus alias?`)) return;
    
    try {
      await this.service.delete(termino.id).toPromise();
      this.terminos.update(list => list.filter(t => t.id !== termino.id));
      if (this.openAccordionId() === termino.id) {
        this.openAccordionId.set(null);
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  }

  async addAlias(terminoId: number, inputEl: HTMLInputElement): Promise<void> {
    const alias = inputEl.value.trim();
    if (!alias) return;
    
    try {
      const newAlias = await this.service.addAlias(terminoId, alias).toPromise();
      if (newAlias) {
        this.terminos.update(list =>
          list.map(t => t.id === terminoId
            ? { ...t, alias: [...t.alias, newAlias] }
            : t
          )
        );
        inputEl.value = '';
      }
    } catch (err: any) {
      alert(err.message || 'Error al agregar alias');
    }
  }

  startEditAlias(terminoId: number, alias: AliasItem, event: Event): void {
    event.stopPropagation();
    this.editingAlias.set({ terminoId, alias: { ...alias } });
  }

  async saveAliasEdit(): Promise<void> {
    const edit = this.editingAlias();
    if (!edit) return;
    
    try {
      const updated = await this.service.updateAlias(
        edit.terminoId,
        edit.alias.id,
        edit.alias.alias
      ).toPromise();
      
      if (updated) {
        this.terminos.update(list =>
          list.map(t => t.id === edit.terminoId
            ? { ...t, alias: t.alias.map(a => a.id === edit.alias.id ? updated : a) }
            : t
          )
        );
      }
      this.editingAlias.set(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar alias');
    }
  }

  cancelEditAlias(): void {
    this.editingAlias.set(null);
  }

  async deleteAlias(termino: Termino, alias: AliasItem, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm(`¿Eliminar el alias "${alias.alias}"?`)) return;
    
    try {
      await this.service.deleteAlias(termino.id, alias.id).toPromise();
      this.terminos.update(list =>
        list.map(t => t.id === termino.id
          ? { ...t, alias: t.alias.filter(a => a.id !== alias.id) }
          : t
        )
      );
    } catch (err: any) {
      alert(err.message || 'Error al eliminar alias');
    }
  }

  async loadEntidades(): Promise<void> {
  try {
    const entidades = await this.managerApis.getEntidades().toPromise();
    this.entidades.set(entidades || []);
  } catch (err: any) {
    console.error('Error al cargar entidades:', err);
  }
}

  async createTermino(): Promise<void> {
  const name = this.newTerminoName().trim();
  if (!name) {
    alert('El nombre del término es requerido');
    return;
  }
  
  const aliases = this.newTerminoAliases().filter(a => a.trim());
  
  try {
    const res = await this.managerApis.createTermino({ termino: name, alias: aliases }).toPromise();
    const newTermino = res?.termino;
    
    if (newTermino) {
      this.terminos.update(list => [...list, newTermino]);
      this.showCreateModal.set(false);
      this.newTerminoName.set('');
      this.newTerminoAliases.set([]);
      this.newTerminoEntidad.set(null);
      
      setTimeout(() => {
        this.openAccordionId.set(newTermino.id);
        this.highlightTermino(newTermino.id);
      }, 300);
    }
  } catch (err: any) {
    alert(err.message || 'Error al crear término');
  }
}

  addTempAlias(): void {
    const alias = this.tempAliasInput().trim();
    if (alias && !this.newTerminoAliases().includes(alias)) {
      this.newTerminoAliases.update(list => [...list, alias]);
      this.tempAliasInput.set('');
    }
  }

  removeTempAlias(alias: string): void {
    this.newTerminoAliases.update(list => list.filter(a => a !== alias));
  }

  toggleFilter(): void {
    this.soloActivos.update(v => !v);
    this.loadTerminos();
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  private highlightTermino(id: number): void {
    const element = document.querySelector(`[data-termino-id="${id}"]`);
    if (element) {
      element.classList.add('ring-2', 'ring-yellow-400', 'bg-yellow-50');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-yellow-400', 'bg-yellow-50');
      }, 2000);
    }
  }

  updateEditingAliasText(value: string): void {
  const current = this.editingAlias();
  if (current) {
    this.editingAlias.set({ 
      ...current, 
      alias: { ...current.alias, alias: value } 
    });
  }
}

  getEntidadNombre(id: number | null | undefined): string {
    if (!id) return 'Sin asignar';
    const entidad = this.entidades().find(e => e.id === id);
    return entidad ? entidad.nombre : 'Desconocida';
  }

  onEditEntidadChange(event: Event): void {
  const termino = this.editingTermino();
  if (!termino) return;
  const select = event.target as HTMLSelectElement;
  const value = select.value;
  this.editingTermino.set({ 
    ...termino, 
    id_entidad: value ? parseInt(value, 10) : null 
  });
}

}
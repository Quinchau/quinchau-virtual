// src/app/pages/campanas/campanas.ts

import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ManagerApis } from '../../services/manager-apis';
import {
  Campana,
  CampanaConDetalle,
  CrearCampanaPayload,
  TransicionResult,
  EstadoCampana,
  obtenerResultadoFinal,
  getEstadoBadgeInfo,
  ResultadoFinal
} from '../../models/campanas.model';

@Component({
  selector: 'app-campanas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campanas.html',
  styleUrls: ['./campanas.css']
})
export class Campanas implements OnInit, OnDestroy {
  private apis = inject(ManagerApis);

  // --- Signals de estado ---
  readonly loadingList = signal(false);
  readonly loadingAction = signal<number | null>(null);
  readonly errorList = signal('');
  readonly updatingActivas = signal(false);
  readonly lastUpdate = signal<Date | null>(null);

  // --- Datos principales - Usamos un array simple para evitar complejidad ---
  private campanasSignal = signal<Campana[]>([]);

  // --- Computed: lista completa ordenada ---
  readonly campanas = computed(() => {
    return [...this.campanasSignal()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  // --- Computed: activas ---
  readonly activas = computed(() => {
    const all = this.campanas();
    return all
      .filter(c => c.estado === 'en_pausa' || c.estado === 'en_proceso')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  // --- Computed: historial ---
  readonly historial = computed(() => {
    const all = this.campanas();
    return all
      .filter(c => c.estado === 'terminada')
      .sort((a, b) => {
        const dateA = a.finalizada_en ? new Date(a.finalizada_en).getTime() : 0;
        const dateB = b.finalizada_en ? new Date(b.finalizada_en).getTime() : 0;
        return dateB - dateA;
      });
  });

  // --- Panel de creación ---
  readonly showCrearPanel = signal(false);
  readonly modelos = signal<{ typeid: number; typename: string }[]>([]);
  readonly modeloSeleccionado = signal<number | null>(null);
  readonly plantilla = signal('aprobacion_envio_catalogo');
  readonly testPhone = signal('');
  readonly creando = signal(false);
  readonly crearError = signal('');

  // --- Modal de detalle ---
  readonly detalleAbierto = signal<CampanaConDetalle | null>(null);
  readonly loadingDetalle = signal(false);

  // --- Polling ---
  private pollingInterval: any = null;
  private readonly POLLING_INTERVAL_MS = 8000;

  ngOnInit(): void {
    this.cargarCampanasInicial();
    this.cargarModelos();
    this.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  // ============================================
  // CARGA INICIAL
  // ============================================

  private cargarCampanasInicial(): void {
    this.loadingList.set(true);
    this.errorList.set('');
    
    this.apis.getCampanas().subscribe({
      next: (res) => {
        this.loadingList.set(false);
        if (res.success && res.data) {
          this.campanasSignal.set(res.data);
          this.lastUpdate.set(new Date());
        }
      },
      error: () => {
        this.loadingList.set(false);
        this.errorList.set('No se pudieron cargar las campañas.');
      }
    });
  }

  // ============================================
  // ACTUALIZACIÓN GRANULAR (SIN FLICKER)
  // ============================================

  /**
   * Actualiza solo las campañas que cambiaron, manteniendo las referencias
   * de las que no cambiaron para evitar re-renders innecesarios
   */
  private actualizarCampanasGranular(nuevasCampanas: Campana[]): void {
    // Crear un Map para búsqueda rápida
    const nuevasPorId = new Map(nuevasCampanas.map(c => [c.id_campana, c]));
    
    // Usar update para modificar solo lo necesario
    this.campanasSignal.update(campanasActuales => {
      // Crear un nuevo array para la actualización
      const actualizadas = [...campanasActuales];
      let huboCambios = false;

      // Actualizar campañas existentes o agregar nuevas
      for (let i = 0; i < actualizadas.length; i++) {
        const actual = actualizadas[i];
        const nueva = nuevasPorId.get(actual.id_campana);
        
        if (nueva) {
          // Si hay cambios significativos, actualizar el objeto
          if (this.hayCambiosSignificativos(actual, nueva)) {
            actualizadas[i] = { ...nueva }; // Crear nueva referencia solo si cambió
            huboCambios = true;
          }
          // Eliminar del Map para saber cuáles ya procesamos
          nuevasPorId.delete(actual.id_campana);
        }
      }

      // Agregar campañas nuevas que no existían
      if (nuevasPorId.size > 0) {
        for (const [_, nueva] of nuevasPorId) {
          actualizadas.push({ ...nueva });
        }
        huboCambios = true;
      }

      // Si hubo cambios, actualizar la señal, sino devolver la misma referencia
      if (huboCambios) {
        this.lastUpdate.set(new Date());
        return actualizadas;
      }
      
      // Sin cambios: devolver el mismo array para evitar re-render
      return campanasActuales;
    });
  }

  /**
   * Verifica si hubo cambios relevantes en la campaña
   */
  private hayCambiosSignificativos(old: Campana, nuevo: Campana): boolean {
    return old.estado !== nuevo.estado ||
           old.enviados !== nuevo.enviados ||
           old.fallidos !== nuevo.fallidos ||
           old.pendientes !== nuevo.pendientes ||
           old.total_destinatarios !== nuevo.total_destinatarios ||
           old.finalizada_en !== nuevo.finalizada_en ||
           old.updated_at !== nuevo.updated_at;
  }

  /**
   * Polling optimizado - solo actualiza campañas activas
   */
  private actualizarCampanasActivas(): void {
    const activasActuales = this.activas();
    
    if (activasActuales.length === 0) {
      return;
    }

    this.updatingActivas.set(true);

    this.apis.getCampanas().subscribe({
      next: (res) => {
        this.updatingActivas.set(false);
        if (res.success && res.data) {
          const idsActivas = new Set(activasActuales.map(c => c.id_campana));
          
          // Filtrar solo campañas relevantes
          const campanasRelevantes = res.data.filter(c => 
            c.estado === 'en_pausa' || 
            c.estado === 'en_proceso' ||
            idsActivas.has(c.id_campana)
          );

          if (campanasRelevantes.length > 0) {
            this.actualizarCampanasGranular(res.data);
          }
        }
      },
      error: () => {
        this.updatingActivas.set(false);
      }
    });
  }

  // ============================================
  // POLLING
  // ============================================

  private iniciarPolling(): void {
    this.detenerPolling();
    this.pollingInterval = setInterval(() => {
      this.actualizarCampanasActivas();
    }, this.POLLING_INTERVAL_MS);
  }

  private detenerPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // ============================================
  // CARGA DE MODELOS
  // ============================================

  private cargarModelos(): void {
    this.apis.getCatalogs().subscribe({
      next: (cat) => {
        const tipos = cat.debtorTypes ?? [];
        const excluir = ['MOTOS - DISTRIBUIDOR', 'MOTOS - DETAL', 'MOTOS - PROVEEDOR', 'MOTOS - CLUBES'];
        this.modelos.set(tipos.filter((m: any) => !excluir.includes(m.typename)));
      },
      error: () => {}
    });
  }

  // ============================================
  // CREAR CAMPAÑA
  // ============================================

  crearCampana(): void {
    const typeid = this.modeloSeleccionado();
    if (!typeid) {
      this.crearError.set('Seleccione un modelo.');
      return;
    }

    this.creando.set(true);
    this.crearError.set('');

    const payload: CrearCampanaPayload = {
      typeid,
      plantilla: this.plantilla().trim(),
      ...(this.testPhone().trim() ? { test_phone: this.testPhone().trim() } : {})
    };

    this.apis.crearCampana(payload).subscribe({
      next: (res) => {
        this.creando.set(false);
        if (!res.success) {
          this.crearError.set(res.data?.error || 'No se pudo crear la campaña.');
          return;
        }
        this.showCrearPanel.set(false);
        this.resetFormCrear();
        this.cargarCampanasInicial();
      },
      error: (err) => {
        this.creando.set(false);
        const data = err?.error?.data;
        if (err.status === 409 && data?.campana_activa) {
          this.crearError.set(
            `Ya hay una campaña activa para este modelo (#${data.campana_activa.id_campana}, ${data.campana_activa.estado}).`
          );
        } else {
          this.crearError.set(err?.error?.error || 'Error al conectar.');
        }
      }
    });
  }

  private resetFormCrear(): void {
    this.modeloSeleccionado.set(null);
    this.plantilla.set('aprobacion_envio_catalogo');
    this.testPhone.set('');
    this.crearError.set('');
  }

  // ============================================
  // TRANSICIONES
  // ============================================

  private ejecutarTransicion(
    id: number,
    llamada: (id: number) => Observable<any>,
    nuevoEstado: EstadoCampana,
    mensajeError: string
  ): void {
    this.loadingAction.set(id);
    
    llamada(id).subscribe({
      next: (res) => {
        this.loadingAction.set(null);
        if (res.success) {
          // Actualización optimista sin flicker
          this.actualizarCampanaLocal(id, (campana) => ({
            ...campana,
            estado: nuevoEstado
          }));
          
          // Recargar en segundo plano para confirmar
          setTimeout(() => {
            this.actualizarCampanasActivas();
          }, 500);
        }
      },
      error: (err) => {
        this.loadingAction.set(null);
        if (err.status === 409) {
          this.cargarCampanasInicial();
        }
        alert(err?.error?.error || mensajeError);
      }
    });
  }

  private actualizarCampanaLocal(
    id: number, 
    updater: (campana: Campana) => Campana
  ): void {
    this.campanasSignal.update(campanas => {
      const index = campanas.findIndex(c => c.id_campana === id);
      if (index === -1) return campanas;
      
      const nuevaCampana = updater(campanas[index]);
      const nuevasCampanas = [...campanas];
      nuevasCampanas[index] = nuevaCampana;
      return nuevasCampanas;
    });
  }

  onArrancar(c: Campana): void {
    this.ejecutarTransicion(
      c.id_campana,
      (id) => this.apis.arrancarCampana(id),
      'en_proceso',
      'No se pudo arrancar la campaña.'
    );
  }

  onPausar(c: Campana): void {
    this.ejecutarTransicion(
      c.id_campana,
      (id) => this.apis.pausarCampana(id),
      'en_pausa',
      'No se pudo pausar la campaña.'
    );
  }

  onCancelar(c: Campana): void {
    if (!confirm(`¿Cancelar la campaña #${c.id_campana} (${c.modelo_descrip})? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.ejecutarTransicion(
      c.id_campana,
      (id) => this.apis.cancelarCampana(id),
      'terminada',
      'No se pudo cancelar la campaña.'
    );
  }

  // ============================================
  // DETALLE
  // ============================================

  verDetalle(c: Campana): void {
    this.loadingDetalle.set(true);
    this.apis.getCampanaDetalle(c.id_campana).subscribe({
      next: (res) => {
        this.loadingDetalle.set(false);
        if (res.success) {
          this.detalleAbierto.set(res.data);
        }
      },
      error: () => {
        this.loadingDetalle.set(false);
      }
    });
  }

  cerrarDetalle(): void {
    this.detalleAbierto.set(null);
  }

  // ============================================
  // HELPERS
  // ============================================

  getEstadoBadge(c: Campana): { text: string; classes: string } {
    return getEstadoBadgeInfo(c);
  }

  obtenerResultadoFinal(c: Campana): ResultadoFinal | null {
    return obtenerResultadoFinal(c);
  }

  onCrearPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  refrescarManual(): void {
    this.cargarCampanasInicial();
  }
}
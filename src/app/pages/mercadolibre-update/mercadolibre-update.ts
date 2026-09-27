import { Component, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { ManagerApis } from '../../services/manager-apis';
import { ColumnMapping, ColumnMappingRow, MLAttribute } from '../../models/mercadolibre.model';

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

const NOMBRE_ARCHIVO_SALIDA = 'resultado-mercadolibre.csv';

@Component({
  selector: 'app-mercadolibre-update',
  standalone: true,
  imports: [],
  templateUrl: './mercadolibre-update.html',
  styles: `
    :host { display: block; }
  `,
})
export class MercadolibreUpdate {
  private api = inject(ManagerApis);

  // --- Archivo y drag & drop ---
  selectedFile = signal<File | null>(null);
  isDragging = signal<boolean>(false);
  fileError = signal<string>('');

  // --- Atributos disponibles y mapeo de columnas ---
  attributes = signal<MLAttribute[]>([]);
  loadingAttributes = signal<boolean>(true);
  columns = signal<ColumnMappingRow[]>([]);

  // --- Ajuste de precio (solo aplica si se mapea "precio") ---
  porcentaje = signal<number>(15);
  precioMinimo = signal<number>(0);

  // --- Estado de envío ---
  status = signal<UploadStatus>('idle');
  errorMessage = signal<string>('');

  precioMapeado = computed(() => this.columns().some(c => c.campo === 'precio'));
  skuMapeado = computed(() => this.columns().some(c => c.campo === 'sku'));
  columnasMapeadas = computed(() => this.columns().filter(c => c.campo).length);

  // Extrae los SKUs de un mensaje de error tipo: "Error: stockids 999-999, 888-777 no existen"
  missingCodes = computed<string[]>(() => {
    const msg = this.errorMessage();
    const match = msg.match(/^Error:\s*stockids?\s+(.+?)\s+no\s+existen?$/i);
    if (!match) return [];
    return match[1].split(',').map(c => c.trim()).filter(Boolean);
  });

  // Validador computado: archivo con columnas mapeadas, "sku" presente y, si corresponde, precio válido
  isFormValid = computed(() => {
    const file = this.selectedFile();
    if (!file || this.columns().length === 0 || !this.skuMapeado()) return false;

    if (this.precioMapeado()) {
      const pct = this.porcentaje();
      const min = this.precioMinimo();
      if (pct === null || isNaN(pct) || pct < 0 || pct >= 99.99) return false;
      if (min === null || isNaN(min) || min < 0) return false;
    }

    return this.status() !== 'loading';
  });

  constructor() {
    this.cargarAtributos();
  }

  private cargarAtributos(): void {
    this.loadingAttributes.set(true);
    this.api.getMLAttributes().subscribe({
      next: (attrs) => {
        this.attributes.set(attrs);
        this.loadingAttributes.set(false);
      },
      error: () => {
        this.fileError.set('No se pudieron cargar los atributos disponibles. Reintentá más tarde.');
        this.loadingAttributes.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.handleFile(file);
    input.value = ''; // Permite volver a seleccionar el mismo archivo
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.handleFile(file);
  }

  private handleFile(file: File | null): void {
    if (!file) return;

    const nombre = file.name.toLowerCase();
    if (!nombre.endsWith('.xls') && !nombre.endsWith('.xlsx')) {
      this.fileError.set('El archivo debe ser un .xls o .xlsx');
      return;
    }

    this.fileError.set('');
    this.status.set('idle');
    this.errorMessage.set('');
    this.selectedFile.set(file);
    this.leerColumnas(file);
  }

  /** Lee el header (fila 1) del Excel en el navegador para armar la grilla de mapeo */
  private leerColumnas(file: File): void {
    this.columns.set([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
        const headerRow = rows[0] ?? [];

        const headers = headerRow.map(h => String(h).trim()).filter(h => h.length > 0);

        if (headers.length === 0) {
          this.fileError.set('El archivo no tiene columnas en la primera fila.');
          return;
        }

        this.columns.set(headers.map(columna => ({ columna, campo: this.sugerirCampo(columna) })));
      } catch {
        this.fileError.set('No se pudo leer el archivo. Verificá que sea un .xls o .xlsx válido.');
      }
    };
    reader.onerror = () => this.fileError.set('No se pudo leer el archivo seleccionado.');
    reader.readAsArrayBuffer(file);
  }

  /** Preselecciona el campo cuando el nombre de la columna coincide con un atributo conocido */
  private sugerirCampo(columna: string): string {
    const normalizado = columna.trim().toLowerCase();
    const match = this.attributes().find(a => a.label.toLowerCase() === normalizado);
    return match ? match.campo : '';
  }

  /** Atributos disponibles para una fila: excluye los ya usados en otras filas */
  opcionesPara(campoActual: string): MLAttribute[] {
    const usadosEnOtrasFilas = new Set(
      this.columns().filter(c => c.campo && c.campo !== campoActual).map(c => c.campo)
    );
    return this.attributes().filter(a => !usadosEnOtrasFilas.has(a.campo));
  }

  actualizarCampo(index: number, campo: string): void {
    this.columns.update(cols => {
      const copia = [...cols];
      copia[index] = { ...copia[index], campo };
      return copia;
    });
  }

  actualizarPorcentaje(valor: string): void {
    this.porcentaje.set(Number(valor));
  }

  actualizarPrecioMinimo(valor: string): void {
    this.precioMinimo.set(Number(valor));
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.columns.set([]);
    this.fileError.set('');
    this.status.set('idle');
    this.errorMessage.set('');
  }

  procesar(): void {
    const file = this.selectedFile();
    if (!file || !this.isFormValid()) return;

    const mapping: ColumnMapping[] = this.columns()
      .filter(c => c.campo)
      .map(({ columna, campo }) => ({ columna, campo }));

    this.status.set('loading');
    this.errorMessage.set('');

    const porcentaje = this.precioMapeado() ? this.porcentaje() : undefined;
    const precioMinimo = this.precioMapeado() ? this.precioMinimo() : undefined;

    this.api.syncMLProducts(file, mapping, porcentaje, precioMinimo).subscribe({
      next: (blob) => {
        this.descargarCsv(blob);
        this.status.set('success');
      },
      error: async (err: HttpErrorResponse) => {
        const message = await this.parseErrorBlob(err);
        this.errorMessage.set(message);
        this.status.set('error');
      }
    });
  }

  private descargarCsv(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = NOMBRE_ARCHIVO_SALIDA;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  private async parseErrorBlob(err: HttpErrorResponse): Promise<string> {
    if (err.error instanceof Blob) {
      try {
        const text = await err.error.text();
        const json = JSON.parse(text);
        return json.error || 'Ocurrió un error al procesar el archivo';
      } catch {
        return 'Ocurrió un error al procesar el archivo';
      }
    }
    return err.error?.error || 'No se pudo conectar con el servidor';
  }
}
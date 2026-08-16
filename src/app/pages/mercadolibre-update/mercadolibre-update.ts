import { Component, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ManagerApis } from '../../services/manager-apis';

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-mercadolibre-update',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mercadolibre-update.html',
  styles: `
    :host { display: block; }
  `,
})
export class MercadolibreUpdate {
  private api = inject(ManagerApis);

  selectedFile = signal<File | null>(null);
  porcentaje = signal<number>(0);
  precioMinimo = signal<number>(0);

  status = signal<UploadStatus>('idle');
  errorMessage = signal<string>('');
  isDragging = signal<boolean>(false);

  missingCodes = computed<string[]>(() => {
    const msg = this.errorMessage();
    const match = msg.match(/^Error:\s*(.+?)\s*no encontrados?$/i);
    if (!match) return [];
    return match[1].split(',').map(c => c.trim()).filter(Boolean);
  });

  // Validador computado para asegurar que los campos numéricos sean válidos antes de procesar
  isFormValid = computed(() => {
    const file = this.selectedFile();
    const pct = this.porcentaje();
    const minPrice = this.precioMinimo();

    return (
      file !== null &&
      pct !== null &&
      !isNaN(pct) &&
      minPrice !== null &&
      !isNaN(minPrice) &&
      minPrice >= 0
    );
  });

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

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.status.set('error');
      this.errorMessage.set('El archivo debe ser un .csv');
      return;
    }

    this.selectedFile.set(file);
    this.status.set('idle');
    this.errorMessage.set('');
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.status.set('idle');
    this.errorMessage.set('');
  }

  procesar(): void {
    const file = this.selectedFile();
    if (!file || !this.isFormValid()) return;

    this.status.set('loading');
    this.errorMessage.set('');

    this.api.updateMercadolibreStock(file, this.porcentaje(), this.precioMinimo()).subscribe({
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
    a.download = 'actualizacion-mercadolibre.csv';
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
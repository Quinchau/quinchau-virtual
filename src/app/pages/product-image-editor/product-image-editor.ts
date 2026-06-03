import {
  Component, Input, OnInit, OnDestroy, ViewChild, ElementRef,
  Output, EventEmitter, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerApis } from '../../services/manager-apis';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

interface Point { x: number; y: number; }
interface Dimension { pointA: Point; pointB: Point; text: string; }
type EditorMode = 'idle' | 'remove_bg' | 'dimensions' | 'label' | 'processing' | 'preview';

@Component({
  selector: 'app-product-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './product-image-editor.html',
  styles: [`
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProductImageEditor implements OnInit, OnDestroy {
  @Input() stockId!: string;
  @Input() imageId!: number;
  @Input() imageUrl!: string;
  @Input() isCover: boolean = false;
  @Input() totalImages: number = 1;

  @Output() close = new EventEmitter<void>();
  @Output() imageSaved = new EventEmitter<{ imageUrl: string; imageId: number }>();
  @Output() imageDeleted = new EventEmitter<number>();
  @Output() coverSet = new EventEmitter<number>();

  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  

  private ctx!: CanvasRenderingContext2D;
  private image = new Image();
  private imageWidth = 0;
  private imageHeight = 0;
  private animationFrame: any;
  private initialPinchDistance = 0;
  private initialPinchScale = 1;
  dimensionColor = '#1C1C1C';

  // UI State
  activeTab: 'cotas' | 'removebg' | 'etiqueta' | 'recorte' = 'cotas';
  isPanelOpen = true;
  mode: EditorMode = 'idle';
  statusMessage = 'Toca "Marcar A" para comenzar';
  statusColor = '#AAA';
  errorMessage = '';
  currentImageBase64 = '';

  // Points & Dimensions
  currentPointA: Point | null = null;
  currentPointB: Point | null = null;
  dimensionState: 'waiting_a' | 'waiting_b' | 'completed' | null = null;
  pendingPoint: 'A' | 'B' | null = null;
  dimensions: Dimension[] = [];
  measureText = '';

  // Crop
  cropMode      = false;
  croppedBase64 = '';
  cropLoaded    = false;


  // Label
  labelText = '';

  // Transform (pan/zoom)
  private transform = { scale: 1, offsetX: 0, offsetY: 0 };
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private initialTransform = { scale: 1, offsetX: 0, offsetY: 0 };

  constructor(private managerApis: ManagerApis, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadImage();
  }

  ngOnDestroy() {
  if (typeof window === 'undefined') return;
  window.removeEventListener('mousemove', this.onMouseMove.bind(this));
  window.removeEventListener('mouseup',   this.onMouseUp.bind(this));
  if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
}

setDimensionColor(color: string) {
  this.dimensionColor = color;
  this.drawImage();
}

  private setupEventListeners() {
    if (typeof window === 'undefined') return;
  const canvas = this.canvasRef.nativeElement;
  canvas.addEventListener('touchstart',  this.onTouchStart.bind(this), { passive: false });
  canvas.addEventListener('touchmove',   this.onTouchMove.bind(this),  { passive: false });
  canvas.addEventListener('touchend',    this.onTouchEnd.bind(this));
  canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
  canvas.addEventListener('mousedown',   this.onMouseDown.bind(this));
  window.addEventListener('mousemove',   this.onMouseMove.bind(this));
  window.addEventListener('mouseup',     this.onMouseUp.bind(this));
}

private onTouchStart(event: TouchEvent) {
  event.preventDefault();
  if (this.pendingPoint && event.touches.length === 1) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (event.touches[0].clientY - rect.top)  * (canvas.height / rect.height);
    this.registerPoint(canvasX, canvasY);
    return;
  }
  if (event.touches.length === 1) {
    this.isDragging = true;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.dragStart = {
      x: (event.touches[0].clientX - rect.left) * (canvas.width / rect.width),
      y: (event.touches[0].clientY - rect.top)  * (canvas.height / rect.height)
    };
    this.initialTransform = { ...this.transform };
  } else if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    this.initialPinchDistance = Math.hypot(dx, dy);
    this.initialPinchScale    = this.transform.scale;
  }
}

private onTouchMove(event: TouchEvent) {
  event.preventDefault();
  if (event.touches.length === 1 && this.isDragging) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.touches[0].clientY - rect.top)  * (canvas.height / rect.height);
    this.transform.offsetX = this.initialTransform.offsetX + (x - this.dragStart.x);
    this.transform.offsetY = this.initialTransform.offsetY + (y - this.dragStart.y);
    this.drawImage();
  } else if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const scale = Math.hypot(dx, dy) / this.initialPinchDistance;
    this.transform.scale = Math.min(5, Math.max(0.5, this.initialPinchScale * scale));
    this.drawImage();
  }
}

private onTouchEnd(event: TouchEvent) {
  this.isDragging = false;
}

private onMouseDown(event: MouseEvent) {
  if (this.pendingPoint) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (event.clientY - rect.top)  * (canvas.height / rect.height);
    this.registerPoint(canvasX, canvasY);
    return;
  }
  this.isDragging = true;
  const canvas = this.canvasRef.nativeElement;
  const rect = canvas.getBoundingClientRect();
  this.dragStart = {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top)  * (canvas.height / rect.height)
  };
  this.initialTransform = { ...this.transform };
}

private onMouseMove(event: MouseEvent) {
  if (!this.isDragging) return;
  const canvas = this.canvasRef.nativeElement;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top)  * (canvas.height / rect.height);
  this.transform.offsetX = this.initialTransform.offsetX + (x - this.dragStart.x);
  this.transform.offsetY = this.initialTransform.offsetY + (y - this.dragStart.y);
  this.drawImage();
}

private onMouseUp() { this.isDragging = false; }

private registerPoint(canvasX: number, canvasY: number) {
  const imgX = (canvasX - this.transform.offsetX) / this.transform.scale / this.imageWidth;
  const imgY = (canvasY - this.transform.offsetY) / this.transform.scale / this.imageHeight;
  const point = { x: Math.max(0, Math.min(1, imgX)), y: Math.max(0, Math.min(1, imgY)) };

  if (this.pendingPoint === 'A') {
    this.currentPointA = point;
    this.dimensionState = 'waiting_b';
    this.statusMessage = '✅ Punto A marcado. Activá Punto B';
    this.statusColor = '#4CAF50';
  } else if (this.pendingPoint === 'B') {
    this.currentPointB = point;
    this.dimensionState = 'completed';
    this.statusMessage = '✅ Ambos puntos marcados. Ingresá la medida';
    this.statusColor = '#4CAF50';
  }
  this.pendingPoint = null;
  this.drawImage();
  this.cdr.detectChanges();
}

  private loadImage() {
    if (typeof window === 'undefined') return;
    this.image.crossOrigin = 'anonymous';
    this.image.onload = () => {
      this.imageWidth = this.image.width;
      this.imageHeight = this.image.height;
      this.initCanvas();
      this.drawImage();
      this.cdr.detectChanges();
    };
    this.image.src = this.imageUrl;
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement?.parentElement;
    this.setupEventListeners();
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    this.ctx = canvas.getContext('2d')!;

    // Initial transform to fit image
    const scaleX = canvas.width / this.imageWidth;
    const scaleY = canvas.height / this.imageHeight;
    this.transform.scale = Math.min(scaleX, scaleY) * 0.9;
    this.transform.offsetX = (canvas.width - this.imageWidth * this.transform.scale) / 2;
    this.transform.offsetY = (canvas.height - this.imageHeight * this.transform.scale) / 2;
  }

  private drawImage() {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);
    this.ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
    this.ctx.restore();

    // Draw points
    if (this.currentPointA) {
      this.drawPoint(this.currentPointA, '#E87A2D');
    }
    if (this.currentPointB) {
      this.drawPoint(this.currentPointB, '#4CAF50');
    }

    // Draw dimensions
    for (const dim of this.dimensions) {
      this.drawDimensionLine(dim);
    }
  }

  private drawPoint(point: Point, color: string) {
    const x = this.transform.offsetX + point.x * this.imageWidth * this.transform.scale;
    const y = this.transform.offsetY + point.y * this.imageHeight * this.transform.scale;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawDimensionLine(dim: Dimension) {
    const x1 = this.transform.offsetX + dim.pointA.x * this.imageWidth * this.transform.scale;
    const y1 = this.transform.offsetY + dim.pointA.y * this.imageHeight * this.transform.scale;
    const x2 = this.transform.offsetX + dim.pointB.x * this.imageWidth * this.transform.scale;
    const y2 = this.transform.offsetY + dim.pointB.y * this.imageHeight * this.transform.scale;

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = this.dimensionColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 10;
    this.ctx.fillStyle = this.dimensionColor;
    this.ctx.font = 'bold 12px "DM Sans", sans-serif';
    this.ctx.fillText(dim.text, midX, midY);
  }

  onCanvasClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.pendingPoint) {
      const point = this.getNormalizedCoordinates(event);
      
      if (this.pendingPoint === 'A') {
        this.currentPointA = point;
        this.dimensionState = 'waiting_b';
        this.statusMessage = '✅ Punto A marcado. Activá Punto B';
        this.statusColor = '#4CAF50';
      } else if (this.pendingPoint === 'B') {
        this.currentPointB = point;
        this.dimensionState = 'completed';
        this.statusMessage = '✅ Ambos puntos marcados. Ingresá la medida';
        this.statusColor = '#4CAF50';
      }
      
      this.pendingPoint = null;
      this.drawImage();
    } else {
      // Handle pan/zoom with mouse drag
      if (!this.isDragging) {
        this.isDragging = true;
        this.dragStart = { x: event.offsetX, y: event.offsetY };
        this.initialTransform = { ...this.transform };
      }
    }
  }

  private getNormalizedCoordinates(event: MouseEvent): Point {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (event.clientY - rect.top) * (canvas.height / rect.height);
    
    const imgX = (canvasX - this.transform.offsetX) / this.transform.scale / this.imageWidth;
    const imgY = (canvasY - this.transform.offsetY) / this.transform.scale / this.imageHeight;
    
    return { 
      x: Math.max(0, Math.min(1, imgX)), 
      y: Math.max(0, Math.min(1, imgY)) 
    };
  }

  startPointSelection(point: 'A' | 'B') {
    console.log('startPointSelection llamado', point);
    if (point === 'A') {
      this.pendingPoint = 'A';
      this.dimensionState = 'waiting_a';
      this.statusMessage = '🔴 Tocá la imagen para marcar PUNTO A';
      this.statusColor = '#E87A2D';
    } else if (point === 'B' && this.currentPointA) {
      this.pendingPoint = 'B';
      this.dimensionState = 'waiting_b';
      this.statusMessage = '🟢 Tocá la imagen para marcar PUNTO B';
      this.statusColor = '#4CAF50';
    }
  }

  nudgePoint(point: 'A' | 'B', direction: string) {
    const targetPoint = point === 'A' ? this.currentPointA : this.currentPointB;
    if (!targetPoint) return;

    const step = 0.005; // 0.5% step
    switch (direction) {
      case 'up': targetPoint.y = Math.max(0, targetPoint.y - step); break;
      case 'down': targetPoint.y = Math.min(1, targetPoint.y + step); break;
      case 'left': targetPoint.x = Math.max(0, targetPoint.x - step); break;
      case 'right': targetPoint.x = Math.min(1, targetPoint.x + step); break;
    }

    this.drawImage();
  }

  addDimension() {
    if (this.currentPointA && this.currentPointB && this.measureText.trim()) {
      this.dimensions.push({
        pointA: { ...this.currentPointA },
        pointB: { ...this.currentPointB },
        text: this.measureText
      });

      // Reset for next dimension
      this.currentPointA = null;
      this.currentPointB = null;
      this.dimensionState = null;
      this.pendingPoint = null;
      this.measureText = '';
      this.statusMessage = '📍 Cota añadida. Podés agregar otra';
      this.statusColor = '#1C1C1C';

      this.drawImage();
    }
  }

  removeDimension(index: number) {
    this.dimensions.splice(index, 1);
    this.drawImage();
  }

  applyDimensions() {
    if (this.dimensions.length === 0) {
      this.statusMessage = '⚠️ Agregue al menos una cota';
      return;
    }

    this.mode = 'processing';
    this.statusMessage = '🔄 Aplicando cotas...';
    this.cdr.detectChanges();

    const payload = this.dimensions.map(d => ({
      x1: d.pointA.x,
      y1: d.pointA.y,
      x2: d.pointB.x,
      y2: d.pointB.y,
      text: d.text,
      color: this.dimensionColor
    }));

    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation: 'dimensions',
      dimensions: payload
    }).subscribe({
        next: (res) => {
        this.currentImageBase64 = res.image_base64;
        this.currentPointA = null;
        this.currentPointB = null;
        this.dimensions = [];
        this.statusMessage = '✅ Cotas aplicadas. Presioná GUARDAR para finalizar.';
        this.mode = 'preview';
        this.image.onload = () => {
          this.imageWidth = this.image.width;
          this.imageHeight = this.image.height;
          this.drawImage();
          this.cdr.detectChanges();
        };
        this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
      },
      error: (err) => {
        this.statusMessage = '❌ Error al aplicar cotas';
        this.mode = 'dimensions';
        this.cdr.detectChanges();
      }
    });
  }

  startRemoveBg() {
  this.mode = 'processing';
  this.statusMessage = '🔄 Eliminando fondo...';
  this.cdr.detectChanges();

  this.managerApis.editProductImage(this.stockId, this.imageId, {
    operation: 'remove_bg'
  }).subscribe({
    next: (res) => {
      this.currentImageBase64 = res.image_base64;
      this.statusMessage = '✅ Fondo eliminado. Presioná GUARDAR para finalizar.';
      this.mode = 'preview';
      this.image.onload = () => {
        this.imageWidth = this.image.width;
        this.imageHeight = this.image.height;
        this.drawImage();
        this.cdr.detectChanges();
      };
      this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
    },
    error: (err) => {
      this.statusMessage = '❌ Error al eliminar fondo';
      this.mode = 'idle';
      this.cdr.detectChanges();
    }
  });
}

  applyLabel() {
    if (!this.labelText.trim()) {
      this.statusMessage = '⚠️ Ingrese un texto para la etiqueta';
      return;
    }

    this.mode = 'processing';
    this.statusMessage = '🔄 Aplicando etiqueta...';
    this.cdr.detectChanges();

    // Draw label on canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.image, 0, 0);

    const fontSize = Math.round(this.imageHeight * 0.05);
    const padding = Math.round(fontSize * 0.8);
    const margin = Math.round(fontSize * 0.5);

    ctx.font = `bold ${fontSize}px "DM Sans", sans-serif`;
    const textWidth = ctx.measureText(this.labelText).width;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding;
    const x = this.imageWidth - boxWidth - margin;
    const y = margin;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(this.labelText, x + padding, y + fontSize);

    const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];

    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation: 'replace',
      image_base64: base64
    }).subscribe({
      next: () => {
        this.currentImageBase64 = base64;
        this.statusMessage = '✅ Etiqueta aplicada';
        this.mode = 'preview';
        this.reloadImage();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.statusMessage = '❌ Error al aplicar etiqueta';
        this.mode = 'idle';
        this.cdr.detectChanges();
      }
    });
  }

  get cropImageBase64(): string {
  return `data:image/jpeg;base64,${this.currentImageBase64}`;
}

startCrop() {
  const canvas = document.createElement('canvas');
  canvas.width = this.imageWidth;
  canvas.height = this.imageHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(this.image, 0, 0);
  this.currentImageBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  this.cropMode   = true;
  this.cropLoaded = false;
  this.croppedBase64 = '';
  this.cdr.detectChanges();
}

onImageCropped(event: ImageCroppedEvent) {
  const b64 = event.base64 ?? '';
  this.croppedBase64 = b64.includes(',') ? b64.split(',')[1] : b64;
}

applyCrop() {
  if (!this.croppedBase64) return;
  this.currentImageBase64 = this.croppedBase64;
  this.cropMode = false;
  this.cropLoaded = false;
  this.cdr.detectChanges();
  this.saveImage();
}

cancelCrop() {
  this.cropMode      = false;
  this.croppedBase64 = '';
}

  private reloadImage() {
  const newImage = new Image();
  newImage.crossOrigin = 'anonymous';
  newImage.onload = () => {
    this.image = newImage;
    this.imageWidth = newImage.width;
    this.imageHeight = newImage.height;
    this.drawImage();
    this.cdr.detectChanges();
  };
  // Limpiar cualquier ?t= existente antes de agregar el nuevo
  const baseUrl = this.imageUrl.split('?')[0];
  newImage.src = `${baseUrl}?t=${Date.now()}`;
}

  saveImage() {
  this.mode = 'processing';
  this.statusMessage = '💾 Guardando imagen...';
  this.cdr.detectChanges();

  this.managerApis.editProductImage(this.stockId, this.imageId, {
    operation: 'replace',
    image_base64: this.currentImageBase64
  }).subscribe({
    next: () => {
      this.statusMessage = '✅ Imagen guardada exitosamente';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.imageSaved.emit({ imageUrl: this.imageUrl, imageId: this.imageId });
        this.closeModal();
      }, 1000);
    },
    error: (err) => {
      this.statusMessage = '❌ Error al guardar imagen';
      this.mode = 'preview';
      this.cdr.detectChanges();
    }
  });
}

  undoChanges() {
    this.currentPointA = null;
    this.currentPointB = null;
    this.dimensions = [];
    this.dimensionState = null;
    this.pendingPoint = null;
    this.measureText = '';
    this.labelText = '';
    this.loadImage();
    this.statusMessage = '🔄 Cambios deshechos';
    this.statusColor = '#AAA';
  }

  setActiveTab(tab: 'cotas' | 'removebg' | 'etiqueta' | 'recorte') {
    this.activeTab = tab;
  }

  requestDelete() {
  if (this.totalImages <= 1) return;
  if (!confirm('¿Eliminar esta imagen?')) return;
  this.managerApis.deleteProductImage(this.stockId, this.imageId).subscribe({
    next: () => this.imageDeleted.emit(this.imageId),
    error: (err) => {
      this.statusMessage = '❌ Error al eliminar imagen';
      this.cdr.detectChanges();
    }
  });
}

  closeModal() {
    this.close.emit();
  }
}
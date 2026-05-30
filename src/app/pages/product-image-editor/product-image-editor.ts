import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerApis } from '../../services/manager-apis';

interface Point {
  x: number;      // coordenada normalizada (0-1)
  y: number;      // coordenada normalizada (0-1)
  px?: number;    // coordenada en píxeles (para dibujo)
  py?: number;
}

interface Dimension {
  pointA: Point;
  pointB: Point;
  text: string;
}

interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

type EditorMode = 'idle' | 'remove_bg' | 'dimensions' | 'label' | 'processing' | 'preview';

@Component({
  selector: 'app-product-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-image-editor.html',
  styles: [`
    .modal-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      z-index: 10000;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      background: #2d2d2d;
      padding: 12px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      border-bottom: 1px solid #444;
    }
    .toolbar button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .toolbar .btn-primary { background: #007bff; color: white; }
    .toolbar .btn-success { background: #28a745; color: white; }
    .toolbar .btn-warning { background: #ffc107; color: #333; }
    .toolbar .btn-danger { background: #dc3545; color: white; }
    .toolbar .btn-secondary { background: #6c757d; color: white; }
    .canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #333;
      touch-action: none;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      cursor: crosshair;
    }
    .panel-config {
      background: #2d2d2d;
      padding: 16px;
      border-top: 1px solid #444;
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .panel-config input {
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #555;
      background: #3d3d3d;
      color: white;
    }
    .dimensions-list {
      background: #2d2d2d;
      padding: 12px;
      border-top: 1px solid #444;
      max-height: 150px;
      overflow-y: auto;
    }
    .dimension-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      margin: 4px 0;
      background: #3d3d3d;
      border-radius: 4px;
    }
    .spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 24px;
      background: rgba(0,0,0,0.7);
      padding: 20px;
      border-radius: 8px;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 20px;
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      z-index: 100;
    }
    .footer {
      background: #2d2d2d;
      padding: 12px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid #444;
    }
  `]
})
export class ProductImageEditor implements OnInit, OnDestroy {
  @Input() stockId!: string;
  @Input() imageId!: number;
  @Input() imageUrl!: string;
  @Output() close = new EventEmitter<void>();
  @Output() imageSaved = new EventEmitter<{ imageUrl: string; imageId: number }>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private image = new Image();
  private imageWidth = 0;
  private imageHeight = 0;
  
  // Estado del canvas
  transform: CanvasTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private initialTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private initialPinchDistance = 0;
  private initialPinchScale = 1;
  
  // Estado de la aplicación
  mode: EditorMode = 'idle';
  originalImageBase64: string = '';
  currentImageBase64: string = '';
  
  // Modo dimensiones
  pendingPoint: 'A' | 'B' | null = null;
  currentPointA: Point | null = null;
  currentPointB: Point | null = null;
  dimensions: Dimension[] = [];
  measureText: string = '';
  
  // Modo etiqueta
  labelText: string = '';
  
  mensaje: string = '';
  mensajeError: string = '';
  
  constructor(private managerApis: ManagerApis,  private cdr: ChangeDetectorRef) {}
  
  ngOnInit() {
    this.loadImage();
  }
  
  ngOnDestroy() {
    // Limpiar
  }
  
  private loadImage() {
    this.image.onload = () => {
      this.imageWidth = this.image.width;
      this.imageHeight = this.image.height;
      this.initCanvas();
      this.drawImage();
      setTimeout(() => {
        this.mode = 'preview';
        this.mensaje = 'Fondo eliminado. ¿Desea guardar?';
        this.cdr.detectChanges();
      });
    };this.image.onload = () => {
      this.imageWidth = this.image.width;
      this.imageHeight = this.image.height;
      this.initCanvas();
      this.drawImage();
    };
    this.image.src = this.imageUrl;
  }
  
  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    this.ctx = canvas.getContext('2d')!;
    
    // Centrar imagen inicialmente
    const scaleX = canvas.width / this.imageWidth;
    const scaleY = canvas.height / this.imageHeight;
    this.transform.scale = Math.min(scaleX, scaleY) * 0.9;
    this.transform.offsetX = (canvas.width - this.imageWidth * this.transform.scale) / 2;
    this.transform.offsetY = (canvas.height - this.imageHeight * this.transform.scale) / 2;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    const canvas = this.canvasRef.nativeElement;
    
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
  }
  
  private drawImage() {
    if (!this.ctx) return;
    
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    
    // Dibujar imagen
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);
    this.ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
    this.ctx.restore();
    
    // Dibujar puntos de dimensiones
    if (this.mode === 'dimensions') {
      if (this.currentPointA) {
        this.drawPoint(this.currentPointA, 'red');
      }
      if (this.currentPointB) {
        this.drawPoint(this.currentPointB, 'blue');
      }
    }
    
    // Dibujar todas las dimensiones guardadas
    for (const dim of this.dimensions) {
      this.drawDimensionLine(dim);
    }
  }
  
  private drawPoint(point: Point, color: string) {
    const x = this.transform.offsetX + (point.x * this.imageWidth) * this.transform.scale;
    const y = this.transform.offsetY + (point.y * this.imageHeight) * this.transform.scale;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  private drawDimensionLine(dim: Dimension) {
    const x1 = this.transform.offsetX + (dim.pointA.x * this.imageWidth) * this.transform.scale;
    const y1 = this.transform.offsetY + (dim.pointA.y * this.imageHeight) * this.transform.scale;
    const x2 = this.transform.offsetX + (dim.pointB.x * this.imageWidth) * this.transform.scale;
    const y2 = this.transform.offsetY + (dim.pointB.y * this.imageHeight) * this.transform.scale;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Texto en el medio
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(dim.text, midX, midY - 10);
  }
  
  private getCanvasCoordinates(event: TouchEvent | MouseEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (canvas.height / rect.height);
    
    return { x: canvasX, y: canvasY };
  }
  
  private getNormalizedCoordinates(canvasX: number, canvasY: number): Point {
    const imageX = (canvasX - this.transform.offsetX) / this.transform.scale;
    const imageY = (canvasY - this.transform.offsetY) / this.transform.scale;
    
    return {
      x: Math.max(0, Math.min(1, imageX / this.imageWidth)),
      y: Math.max(0, Math.min(1, imageY / this.imageHeight))
    };
  }
  
  // Touch events para zoom/pan
  private onTouchStart(event: TouchEvent) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Pan
      this.isDragging = true;
      const coords = this.getCanvasCoordinates(event);
      this.dragStart = { x: coords.x, y: coords.y };
      this.initialTransform = { ...this.transform };
    } else if (event.touches.length === 2) {
      // Pinch zoom
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.initialPinchDistance = Math.hypot(dx, dy);
      this.initialPinchScale = this.transform.scale;
    }
  }
  
  private onTouchMove(event: TouchEvent) {
    event.preventDefault();
    
    if (event.touches.length === 1 && this.isDragging) {
      const coords = this.getCanvasCoordinates(event);
      const dx = coords.x - this.dragStart.x;
      const dy = coords.y - this.dragStart.y;
      this.transform.offsetX = this.initialTransform.offsetX + dx;
      this.transform.offsetY = this.initialTransform.offsetY + dy;
      this.drawImage();
    } else if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const scaleFactor = distance / this.initialPinchDistance;
      this.transform.scale = Math.min(5, Math.max(0.5, this.initialPinchScale * scaleFactor));
      this.drawImage();
    }
  }
  
  private onTouchEnd(event: TouchEvent) {
  if (event.touches.length === 0) {
    this.isDragging = false;
    
    if (this.mode === 'dimensions') {
      const coords = this.getCanvasCoordinates(event.changedTouches[0] as any);
      const point = this.getNormalizedCoordinates(coords.x, coords.y);
      
      setTimeout(() => {
        if (this.pendingPoint === 'A') {
          this.currentPointA = point;
          this.pendingPoint = 'B';
          this.mensaje = 'Toque el segundo extremo';
        } else if (this.pendingPoint === 'B') {
          this.currentPointB = point;
          this.pendingPoint = null;
          this.mensaje = 'Ingrese la medida en mm';
        }
        this.drawImage();
        this.cdr.detectChanges();
      });
    }
  }
}
  
  private onMouseDown(event: MouseEvent) {
    if (this.mode === 'dimensions') {
      const point = this.getNormalizedCoordinates(event.offsetX, event.offsetY);
      
      if (this.pendingPoint === 'A') {
        this.currentPointA = point;
        this.pendingPoint = 'B';
        this.mensaje = 'Toque el segundo extremo';
      } else if (this.pendingPoint === 'B') {
        this.currentPointB = point;
        this.pendingPoint = null;
        this.mensaje = 'Ingrese la medida en mm';
      }
      this.drawImage();
    } else {
      this.isDragging = true;
      this.dragStart = { x: event.offsetX, y: event.offsetY };
      this.initialTransform = { ...this.transform };
    }
  }
  
  private onMouseMove(event: MouseEvent) {
    if (this.isDragging && this.mode !== 'dimensions') {
      const dx = event.offsetX - this.dragStart.x;
      const dy = event.offsetY - this.dragStart.y;
      this.transform.offsetX = this.initialTransform.offsetX + dx;
      this.transform.offsetY = this.initialTransform.offsetY + dy;
      this.drawImage();
    }
  }
  
  private onMouseUp() {
    this.isDragging = false;
  }
  
 startRemoveBg() {
  this.mode = 'processing';
  this.mensaje = 'Eliminando fondo...';
  
  this.managerApis.editProductImage(this.stockId, this.imageId, {
    operation: 'remove_bg'
  }).subscribe({
    next: (res) => {
  this.currentImageBase64 = res.image_base64;
  this.image.onload = () => {
    this.imageWidth = this.image.width;
    this.imageHeight = this.image.height;
    this.initCanvas();
    this.drawImage();
    this.mode = 'preview';  // ← mover aquí
    this.mensaje = 'Fondo eliminado. ¿Desea guardar?';
    this.cdr.detectChanges();  // ← forzar detección de cambios
  };
  this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
},
    error: (err) => {
      this.mensajeError = err.error?.error || 'Error al eliminar fondo';
      this.mode = 'idle';
    }
  });
}
  
  startDimensions() {
    this.mode = 'dimensions';
    this.pendingPoint = 'A';
    this.currentPointA = null;
    this.currentPointB = null;
    this.mensaje = 'Toque el primer extremo de la cota';
  }
  
  addDimension() {
  if (this.currentPointA && this.currentPointB && this.measureText) {
    this.dimensions.push({
      pointA: this.currentPointA,
      pointB: this.currentPointB,
      text: this.measureText
    });
    setTimeout(() => {
      this.currentPointA = null;
      this.currentPointB = null;
      this.measureText = '';
      this.pendingPoint = 'A';
      this.mensaje = 'Toque el primer extremo de la siguiente cota';
      this.drawImage();
      this.cdr.detectChanges();
    });
  }
}
  
  removeDimension(index: number) {
    this.dimensions.splice(index, 1);
    this.drawImage();
  }
  
  applyDimensions() {
    if (this.dimensions.length === 0) {
      this.mensajeError = 'Agregue al menos una cota';
      return;
    }
    
    this.mode = 'processing';
    this.mensaje = 'Aplicando cotas...';
    
    const dimensionsPayload = this.dimensions.map(d => ({
      x1: d.pointA.x,
      y1: d.pointA.y,
      x2: d.pointB.x,
      y2: d.pointB.y,
      text: d.text
    }));
    
    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation: 'dimensions',
      dimensions: dimensionsPayload
    }).subscribe({
      next: (res) => {
        this.currentImageBase64 = res.image_base64;
        this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
        this.mode = 'preview';
        this.mensaje = 'Cotas aplicadas. ¿Desea guardar?';
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al aplicar cotas';
        this.mode = 'dimensions';
      }
    });
  }
  
  startLabel() {
    this.mode = 'label';
    this.labelText = '';
  }
  
  applyLabel() {
    if (!this.labelText) {
      this.mensajeError = 'Ingrese un texto para la etiqueta';
      return;
    }
    
    // Renderizar etiqueta localmente
    this.drawLabelOnCanvas(this.labelText);
    this.mode = 'preview';
    this.mensaje = 'Etiqueta aplicada. ¿Desea guardar?';
  }
  
  private drawLabelOnCanvas(text: string) {
    if (!this.ctx) return;
    
    // Guardar la imagen actual con la etiqueta
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    
    // Dibujar imagen actual
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    
    // Dibujar etiqueta en esquina superior derecha
    const boxWidth = 180;
    const boxHeight = 40;
    const x = canvas.width - boxWidth - 10;
    const y = 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(text, x + 10, y + 25);
    
    // Guardar como base64
    this.currentImageBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  }
  
  saveImage() {
    this.mode = 'processing';
    this.mensaje = 'Guardando imagen...';
    
    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation: 'replace',
      image_base64: this.currentImageBase64
    }).subscribe({
      next: () => {
        this.mensaje = 'Imagen guardada exitosamente';
        setTimeout(() => {
          this.imageSaved.emit({ imageUrl: this.imageUrl, imageId: this.imageId });
          this.closeModal();
        }, 1500);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al guardar imagen';
        this.mode = 'preview';
      }
    });
  }
  
  undo() {
    this.loadImage();
    this.mode = 'idle';
    this.dimensions = [];
    this.currentPointA = null;
    this.currentPointB = null;
    this.labelText = '';
    this.mensaje = '';
  }
  
  closeModal() {
    this.close.emit();
  }
}
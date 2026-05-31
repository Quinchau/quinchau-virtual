import {
  Component, Input, OnInit, OnDestroy, ViewChild, ElementRef,
  Output, EventEmitter, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { ManagerApis } from '../../services/manager-apis';

interface Point { x: number; y: number; px?: number; py?: number; }
interface Dimension { pointA: Point; pointB: Point; text: string; }
interface CanvasTransform { scale: number; offsetX: number; offsetY: number; }
type EditorMode = 'idle' | 'remove_bg' | 'dimensions' | 'label' | 'processing' | 'preview';

@Component({
  selector: 'app-product-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './product-image-editor.html',
  styles: [`
  .modal-fullscreen {
    position: fixed; top: 79px; left: 0;
    width: 100%; bottom: 90px;
    background: #1a1a1a;
    z-index: 10000;
    display: flex;
    flex-direction: column;
  }
  .toolbar {
    background: #2d2d2d; padding: 12px;
    display: flex; gap: 12px; flex-wrap: wrap;
    border-bottom: 1px solid #444;
  }
  .toolbar button {
    padding: 8px 16px; border: none; border-radius: 6px;
    cursor: pointer; font-weight: 500;
  }
  .btn-primary   { background: #007bff; color: white; }
  .btn-success   { background: #28a745; color: white; }
  .btn-warning   { background: #ffc107; color: #333; }
  .btn-danger    { background: #dc3545; color: white; }
  .btn-secondary { background: #6c757d; color: white; }
  .btn-cover     { background: #f59e0b; color: white; border: none;
                   padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
  .cover-badge   { background: #f59e0b; color: white; padding: 8px 14px;
                   border-radius: 6px; font-size: 14px; font-weight: 500; }
  .canvas-container {
    flex: 1; position: relative; overflow: hidden;
    background: #333; touch-action: none;
  }
  canvas { 
    position: absolute; top: 0; left: 0; 
    cursor: grab;
  }
  canvas:active {
    cursor: grabbing;
  }
  .cropper-wrapper {
    flex: 1; display: flex; flex-direction: column;
    background: #1a1a1a; overflow: hidden; min-height: 0;
  }
  .cropper-wrapper image-cropper { flex: 1; min-height: 0; }
  .crop-actions {
    background: #2d2d2d; padding: 12px;
    display: flex; justify-content: center; gap: 12px;
    border-top: 1px solid #444;
  }
  .crop-actions button {
    padding: 10px 24px; border: none; border-radius: 6px;
    cursor: pointer; font-weight: 600; font-size: 15px;
  }
  .panel-config {
    background: #2d2d2d; padding: 16px; border-top: 1px solid #444;
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  }
  .panel-config span { color: #ccc; }
  .panel-config input {
    padding: 8px 12px; border-radius: 4px;
    border: 1px solid #555; background: #3d3d3d; color: white;
  }
  .dimensions-list {
    background: #2d2d2d; padding: 12px; border-top: 1px solid #444;
    max-height: 150px; overflow-y: auto;
  }
  .dimension-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 12px; margin: 4px 0;
    background: #3d3d3d; border-radius: 4px; color: white;
  }
  .spinner {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: white; font-size: 24px;
    background: rgba(0,0,0,0.7); padding: 20px; border-radius: 8px;
  }
  .close-btn {
    position: absolute; top: 10px; right: 20px;
    background: none; border: none; color: white;
    font-size: 28px; cursor: pointer; z-index: 100;
  }
  .footer {
    background: #2d2d2d; padding: 12px;
    display: flex; justify-content: flex-end; gap: 12px;
    border-top: 1px solid #444; flex-wrap: wrap;
  }
  .footer-idle { justify-content: space-between; align-items: center; }
  .footer button {
    padding: 8px 16px; border: none; border-radius: 6px;
    cursor: pointer; font-weight: 500;
  }
  .footer button:disabled { opacity: 0.4; cursor: not-allowed; }
  .floating-crop-icon {
    position: absolute; bottom: 20px; right: 20px;
    width: 48px; height: 48px;
    background: rgba(0,123,255,0.9); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; cursor: pointer; z-index: 15;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3); transition: transform 0.2s;
  }
  .floating-crop-icon:hover { transform: scale(1.1); }
  
  /* Floating dimension blocker button */
  .dimension-blocker {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    border-radius: 40px;
    padding: 12px 20px;
    z-index: 20;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-weight: bold;
    font-size: 16px;
    text-align: center;
    min-width: 140px;
  }
  .dimension-blocker:hover {
    transform: scale(1.02);
    background: rgba(0, 0, 0, 0.95);
    border-color: rgba(255, 255, 255, 0.5);
  }
  .dimension-blocker.waiting-a {
    background: rgba(220, 53, 69, 0.9);
    border-color: #ff6b6b;
    animation: pulse 1.5s infinite;
  }
  .dimension-blocker.waiting-b {
    background: rgba(40, 167, 69, 0.9);
    border-color: #6bff6b;
    animation: pulse 1.5s infinite;
  }
  .dimension-blocker.disabled {
    background: rgba(100, 100, 100, 0.7);
    cursor: not-allowed;
    opacity: 0.5;
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .dimension-blocker .status-icon {
    font-size: 18px;
    margin-right: 8px;
  }
  .dimension-blocker .status-text {
    letter-spacing: 0.5px;
  }
  .point-selection-active {
    cursor: crosshair !important;
  }
  `]
})
export class ProductImageEditor implements OnInit, OnDestroy {
  @Input() stockId!: string;
  @Input() imageId!: number;
  @Input() imageUrl!: string;
  @Input() isCover: boolean = false;
  @Input() totalImages: number = 1;

  @Output() close        = new EventEmitter<void>();
  @Output() imageSaved   = new EventEmitter<{ imageUrl: string; imageId: number }>();
  @Output() imageDeleted = new EventEmitter<number>();
  @Output() coverSet     = new EventEmitter<number>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private image = new Image();
  private imageWidth  = 0;
  private imageHeight = 0;

  transform: CanvasTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private isDragging = false;
  private dragStart  = { x: 0, y: 0 };
  private initialTransform  = { scale: 1, offsetX: 0, offsetY: 0 };
  private initialPinchDistance = 0;
  private initialPinchScale    = 1;

  mode: EditorMode = 'idle';
  currentImageBase64 = '';

  // ── Crop ──────────────────────────────────────────────
  cropMode      = false;
  croppedBase64 = '';
  cropLoaded = false;

  // ── Dimensiones ───────────────────────────────────────
  dimensionState: 'waiting_a' | 'waiting_b' | 'completed' | null = null;
  isPointSelectionActive: boolean = false; // NEW: Controls if canvas clicks should register points
  currentPointA: Point | null = null;
  currentPointB: Point | null = null;
  dimensions: Dimension[] = [];
  measureText = '';

  // ── Etiqueta ──────────────────────────────────────────
  labelText = '';

  mensaje      = '';
  mensajeError = '';

  constructor(private managerApis: ManagerApis, private cdr: ChangeDetectorRef) {}

  ngOnInit()    { this.loadImage(); }
  ngOnDestroy() {}

  // ── Carga ─────────────────────────────────────────────
  private loadImage() {
    this.image.crossOrigin = 'anonymous';
    this.image.onload = () => {
      this.imageWidth  = this.image.width;
      this.imageHeight = this.image.height;
      this.initCanvas();
      this.drawImage();
      this.cdr.detectChanges();
    };
    this.image.src = this.imageUrl;
  }

  private initCanvas() {
    const canvas    = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    this.ctx = canvas.getContext('2d')!;
    const scaleX = canvas.width  / this.imageWidth;
    const scaleY = canvas.height / this.imageHeight;
    this.transform.scale   = Math.min(scaleX, scaleY) * 0.9;
    this.transform.offsetX = (canvas.width  - this.imageWidth  * this.transform.scale) / 2;
    this.transform.offsetY = (canvas.height - this.imageHeight * this.transform.scale) / 2;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('touchstart',  this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove',   this.onTouchMove.bind(this),  { passive: false });
    canvas.addEventListener('touchend',    this.onTouchEnd.bind(this));
    canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    canvas.addEventListener('mousedown',   this.onMouseDown.bind(this));
    window.addEventListener('mousemove',   this.onMouseMove.bind(this));
    window.addEventListener('mouseup',     this.onMouseUp.bind(this));
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
    if (this.mode === 'dimensions') {
      if (this.currentPointA) this.drawPoint(this.currentPointA, 'red');
      if (this.currentPointB) this.drawPoint(this.currentPointB, 'blue');
    }
    for (const dim of this.dimensions) this.drawDimensionLine(dim);
  }

  private drawPoint(point: Point, color: string) {
    const x = this.transform.offsetX + (point.x * this.imageWidth)  * this.transform.scale;
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
    const x1 = this.transform.offsetX + (dim.pointA.x * this.imageWidth)  * this.transform.scale;
    const y1 = this.transform.offsetY + (dim.pointA.y * this.imageHeight) * this.transform.scale;
    const x2 = this.transform.offsetX + (dim.pointB.x * this.imageWidth)  * this.transform.scale;
    const y2 = this.transform.offsetY + (dim.pointB.y * this.imageHeight) * this.transform.scale;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = '#00ff00'; this.ctx.lineWidth = 2; this.ctx.stroke();
    this.ctx.fillStyle = '#00ff00'; this.ctx.font = '14px Arial';
    this.ctx.fillText(dim.text, (x1 + x2) / 2, (y1 + y2) / 2 - 10);
  }

  private getCanvasCoordinates(event: TouchEvent | MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX; clientY = event.touches[0].clientY;
    } else { clientX = event.clientX; clientY = event.clientY; }
    return {
      x: (clientX - rect.left) * (canvas.width  / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height)
    };
  }

  private getNormalizedCoordinates(canvasX: number, canvasY: number): Point {
    return {
      x: Math.max(0, Math.min(1, (canvasX - this.transform.offsetX) / this.transform.scale / this.imageWidth)),
      y: Math.max(0, Math.min(1, (canvasY - this.transform.offsetY) / this.transform.scale / this.imageHeight))
    };
  }

  // ── Touch events (always pan/zoom, point selection only when active) ──
  private onTouchStart(event: TouchEvent) {
    event.preventDefault();
    
    // If point selection is active, handle point marking instead of panning
    if (this.mode === 'dimensions' && this.isPointSelectionActive && event.touches.length === 1) {
      this.markPoint(event);
      return;
    }
    
    // Otherwise handle pan/zoom
    if (event.touches.length === 1) {
      this.isDragging = true;
      const coords = this.getCanvasCoordinates(event);
      this.dragStart = { x: coords.x, y: coords.y };
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
      const coords = this.getCanvasCoordinates(event);
      this.transform.offsetX = this.initialTransform.offsetX + (coords.x - this.dragStart.x);
      this.transform.offsetY = this.initialTransform.offsetY + (coords.y - this.dragStart.y);
      this.drawImage();
    } else if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const scaleFactor = Math.hypot(dx, dy) / this.initialPinchDistance;
      this.transform.scale = Math.min(5, Math.max(0.5, this.initialPinchScale * scaleFactor));
      this.drawImage();
    }
  }

  private onTouchEnd(event: TouchEvent) {
    this.isDragging = false;
  }

  // ── Mouse events (always pan/zoom, point selection only when active) ──
  private onMouseDown(event: MouseEvent) {
    // If point selection is active, handle point marking
    if (this.mode === 'dimensions' && this.isPointSelectionActive) {
      this.markPoint(event);
      return;
    }
    
    // Otherwise handle panning
    this.isDragging = true;
    this.dragStart  = { x: event.offsetX, y: event.offsetY };
    this.initialTransform = { ...this.transform };
  }

  private onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.transform.offsetX = this.initialTransform.offsetX + (event.offsetX - this.dragStart.x);
      this.transform.offsetY = this.initialTransform.offsetY + (event.offsetY - this.dragStart.y);
      this.drawImage();
    }
  }

  private onMouseUp() { this.isDragging = false; }

  // ── Mark point on canvas (only called when point selection is active) ──
  private markPoint(event: MouseEvent | TouchEvent) {
    let clientX: number, clientY: number;
    
    if (event instanceof TouchEvent) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (canvas.height / rect.height);
    const point = this.getNormalizedCoordinates(canvasX, canvasY);
    
    if (this.dimensionState === 'waiting_a') {
      this.currentPointA = point;
      this.dimensionState = 'waiting_b';
      this.isPointSelectionActive = false; // Deactivate after marking
      this.mensaje = '✅ Punto A marcado. Click en el bloqueador para activar Punto B';
      this.drawImage();
      this.cdr.detectChanges();
    } else if (this.dimensionState === 'waiting_b') {
      this.currentPointB = point;
      this.dimensionState = 'completed';
      this.isPointSelectionActive = false; // Deactivate after marking
      this.mensaje = '✅ Punto B marcado. Ingrese la medida en el campo inferior';
      this.drawImage();
      this.cdr.detectChanges();
    }
  }

  // ── Click on blocker button to activate point selection ──
  onBlockerClick() {
    if (this.mode !== 'dimensions') return;
    
    if (this.dimensionState === 'waiting_a') {
      this.isPointSelectionActive = true;
      this.mensaje = '🔴 Modo punto A activado. Toque la imagen para marcar el PUNTO A';
      this.cdr.detectChanges();
    } else if (this.dimensionState === 'waiting_b') {
      this.isPointSelectionActive = true;
      this.mensaje = '🟢 Modo punto B activado. Toque la imagen para marcar el PUNTO B';
      this.cdr.detectChanges();
    }
  }

  addDimension() {
    if (this.currentPointA && this.currentPointB && this.measureText) {
      this.dimensions.push({ pointA: this.currentPointA, pointB: this.currentPointB, text: this.measureText });
      // Reset for next dimension
      this.currentPointA = null;
      this.currentPointB = null;
      this.measureText = '';
      this.dimensionState = 'waiting_a';
      this.isPointSelectionActive = false;
      this.mensaje = '📍 Click en el bloqueador para activar PUNTO A';
      this.drawImage();
      this.cdr.detectChanges();
    } else {
      if (!this.measureText) {
        this.mensajeError = 'Ingrese la medida en mm';
      } else {
        this.mensajeError = 'Debe marcar ambos puntos antes de agregar';
      }
    }
  }

  removeDimension(index: number) { this.dimensions.splice(index, 1); this.drawImage(); }

  applyDimensions() {
    if (this.dimensions.length === 0) { this.mensajeError = 'Agregue al menos una cota'; return; }
    this.mode = 'processing'; this.mensaje = 'Aplicando cotas...'; this.cdr.detectChanges();
    const payload = this.dimensions.map(d => ({
      x1: d.pointA.x, y1: d.pointA.y, x2: d.pointB.x, y2: d.pointB.y, text: d.text
    }));
    this.managerApis.editProductImage(this.stockId, this.imageId, { operation: 'dimensions', dimensions: payload }).subscribe({
      next: (res) => {
        this.currentImageBase64 = res.image_base64;
        this.image.onload = () => {
          this.imageWidth = this.image.width; this.imageHeight = this.image.height;
          this.initCanvas(); this.drawImage();
          this.mode = 'preview'; this.mensaje = 'Cotas aplicadas. ¿Desea guardar?';
          this.cdr.detectChanges();
        };
        this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
      },
      error: (err) => setTimeout(() => {
        this.mensajeError = err.error?.error || 'Error al aplicar cotas';
        this.mode = 'dimensions'; this.cdr.detectChanges();
      })
    });
  }

  startCropOnly() {
     if (!this.currentImageBase64) {
       const canvas = document.createElement('canvas');
       canvas.width = this.imageWidth;
       canvas.height = this.imageHeight;
       const ctx = canvas.getContext('2d')!;
       ctx.drawImage(this.image, 0, 0);
       this.currentImageBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
     }
     this.cropMode      = true;
     this.cropLoaded    = false;
     this.croppedBase64 = '';
     this.cdr.detectChanges();
   }

  get cropImageBase64(): string {
    return `data:image/jpeg;base64,${this.currentImageBase64}`;
  }

  onImageCropped(event: ImageCroppedEvent) {
    const b64 = event.base64 ?? '';
    this.croppedBase64 = b64.includes(',') ? b64.split(',')[1] : b64;
  }

  applyCrop() {
     const base64 = this.croppedBase64 || this.currentImageBase64;
     if (!base64) return;
 
     this.currentImageBase64 = base64;
     this.cropMode   = false;
     this.cropLoaded = false;
     this.cdr.detectChanges();
 
     // Guardar inmediatamente sin pasar por el canvas
     this.saveImage();
   }

  cancelCrop() {
    this.cropMode     = false;
    this.croppedBase64 = '';
  }

  // ── Remove BG ─────────────────────────────────────────
  startRemoveBg() {
    this.mode    = 'processing';
    this.mensaje = 'Eliminando fondo...';
    this.cdr.detectChanges();
    this.managerApis.editProductImage(this.stockId, this.imageId, { operation: 'remove_bg' }).subscribe({
      next: (res) => {
        this.currentImageBase64 = res.image_base64;
        this.image.onload = () => {
          this.imageWidth = this.image.width; this.imageHeight = this.image.height;
          this.initCanvas(); this.drawImage();
          this.mode = 'preview'; this.mensaje = 'Fondo eliminado. ¿Desea guardar?';
          this.cdr.detectChanges();
        };
        this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
      },
      error: (err) => setTimeout(() => {
        this.mensajeError = err.error?.error || 'Error al eliminar fondo';
        this.mode = 'idle'; this.cdr.detectChanges();
      })
    });
  }

  // ── Dimensiones (start) ───────────────────────────────────────
  startDimensions() {
    this.mode = 'dimensions';
    this.dimensionState = 'waiting_a';
    this.isPointSelectionActive = false;
    this.currentPointA = null;
    this.currentPointB = null;
    this.dimensions = [];
    this.measureText = '';
    this.mensaje = '📍 Click en el bloqueador flotante para activar la marca del PUNTO A';
  }

  // ── Etiqueta ──────────────────────────────────────────
  startLabel() { this.mode = 'label'; this.labelText = ''; }

  applyLabel() {
    if (!this.labelText) { this.mensajeError = 'Ingrese un texto para la etiqueta'; return; }
    this.drawLabelOnCanvas(this.labelText);
    this.mode = 'preview'; this.mensaje = 'Etiqueta aplicada. ¿Desea guardar?';
  }

  private drawLabelOnCanvas(text: string) {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    const bw = 180, bh = 40, x = canvas.width - bw - 10, y = 10;
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)'; this.ctx.fillRect(x, y, bw, bh);
    this.ctx.fillStyle = 'white'; this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(text, x + 10, y + 25);
    this.currentImageBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  }

  // ── Guardar ───────────────────────────────────────────
  saveImage() {
    this.mode = 'processing'; this.mensaje = 'Guardando imagen...'; this.cdr.detectChanges();
    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation: 'replace', image_base64: this.currentImageBase64
    }).subscribe({
      next: () => setTimeout(() => {
        this.mensaje = 'Imagen guardada exitosamente';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.imageSaved.emit({ imageUrl: this.imageUrl, imageId: this.imageId });
          this.closeModal();
        }, 1500);
      }),
      error: (err) => setTimeout(() => {
        this.mensajeError = err.error?.error || 'Error al guardar imagen';
        this.mode = 'preview'; this.cdr.detectChanges();
      })
    });
  }

  undo() {
    this.loadImage(); this.mode = 'idle';
    this.dimensions = []; this.currentPointA = null;
    this.currentPointB = null; this.labelText = ''; this.mensaje = '';
    this.dimensionState = null;
    this.isPointSelectionActive = false;
  }

  // ── Eliminar y portada (delegados al uploader) ────────
  requestDelete() {
    if (this.totalImages <= 1) return;
    if (!confirm('¿Eliminar esta imagen?')) return;
    this.managerApis.deleteProductImage(this.stockId, this.imageId).subscribe({
      next: () => this.imageDeleted.emit(this.imageId),
      error: (err) => setTimeout(() => {
        this.mensajeError = err.error?.error || 'Error al eliminar imagen';
        this.cdr.detectChanges();
      })
    });
  }

  requestSetCover() {
    this.managerApis.setPrimaryImage(this.stockId, this.imageId).subscribe({
      next: () => this.coverSet.emit(this.imageId),
      error: (err) => setTimeout(() => {
        this.mensajeError = err.error?.error || 'Error al establecer portada';
        this.cdr.detectChanges();
      })
    });
  }

  closeModal() { this.close.emit(); }
}
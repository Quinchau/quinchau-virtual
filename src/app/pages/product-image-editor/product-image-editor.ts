import {
  Component, Input, OnInit, OnDestroy, ViewChild, ElementRef,
  Output, EventEmitter, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerApis } from '../../services/manager-apis';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

interface Point { x: number; y: number; }

// The single active dimension
interface ActiveDimension {
  ptA: Point;   // normalized 0–1
  ptB: Point;
  text: string;
}

type EditorMode = 'idle' | 'processing' | 'preview';
type DragTarget = 'A' | 'B' | null;

@Component({
  selector: 'app-product-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './product-image-editor.html',
  styles: [`@keyframes spin { to { transform: rotate(360deg); } }`]
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
  @Output() imageDuplicated = new EventEmitter<number>();

  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private image      = new Image();
  private imageWidth  = 0;
  private imageHeight = 0;

  // ── UI state ─────────────────────────────────────────
  activeTab: 'cotas' | 'removebg' | 'etiqueta' | 'recorte' = 'cotas';
  mode: EditorMode = 'idle';
  statusMessage = '';
  statusColor   = '#AAA';
  currentImageBase64 = '';

  // ── Dimension ─────────────────────────────────────────
  dimension: ActiveDimension | null = null;
  dimensionColor = '#1C1C1C';
  measureText    = '';

  // ── Drag logic ────────────────────────────────────────
  private dragTarget: DragTarget = null;
  private HIT_RADIUS = 22; // px in screen space

  // ── Pan / zoom ────────────────────────────────────────
  private transform        = { scale: 1, offsetX: 0, offsetY: 0 };
  private isPanning        = false;
  private panStart         = { x: 0, y: 0 };
  private panStartTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private initialPinchDistance = 0;
  private initialPinchScale    = 1;

  // ── Crop ──────────────────────────────────────────────
  cropMode       = false;
  croppedBase64  = '';
  cropLoaded     = false;

  // ── Label ─────────────────────────────────────────────
  labelText = '';

  activePrecisionPoint: 'A' | 'B' | null = null;


  constructor(private managerApis: ManagerApis, private cdr: ChangeDetectorRef) {}

  // ═══════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════
  ngOnInit()    { this.loadImage(); }
  ngOnDestroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup',   this.boundMouseUp);
  }

  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp   = this.onMouseUp.bind(this);

  // ═══════════════════════════════════════════════════════
  // Image loading
  // ═══════════════════════════════════════════════════════
  private loadImage() {
    if (typeof window === 'undefined') return;
    this.image.crossOrigin = 'anonymous';
    this.image.onload = () => {
      this.imageWidth  = this.image.width;
      this.imageHeight = this.image.height;
      this.initCanvas();
      this.drawAll();
      this.cdr.detectChanges();
    };
    this.image.src = this.imageUrl;
  }

  private initCanvas() {
    const canvas    = this.canvasRef.nativeElement;
    const container = canvas.parentElement?.parentElement;
    if (!container) return;

    const rect      = container.getBoundingClientRect();
    canvas.width    = rect.width;
    canvas.height   = rect.height;
    this.ctx        = canvas.getContext('2d')!;

    const scaleX = canvas.width  / this.imageWidth;
    const scaleY = canvas.height / this.imageHeight;
    this.transform.scale   = Math.min(scaleX, scaleY) * 0.9;
    this.transform.offsetX = (canvas.width  - this.imageWidth  * this.transform.scale) / 2;
    this.transform.offsetY = (canvas.height - this.imageHeight * this.transform.scale) / 2;

    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('touchstart',  this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove',   this.onTouchMove.bind(this),  { passive: false });
    canvas.addEventListener('touchend',    this.onTouchEnd.bind(this));
    canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    canvas.addEventListener('mousedown',   this.onMouseDown.bind(this));
    window.addEventListener('mousemove',   this.boundMouseMove);
    window.addEventListener('mouseup',     this.boundMouseUp);
  }

  // ═══════════════════════════════════════════════════════
  // Draw
  // ═══════════════════════════════════════════════════════
  private drawAll() {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Image
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);
    this.ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
    this.ctx.restore();

    // Dimension overlay
    if (this.dimension) this.drawDimension(this.dimension);
  }

  private toScreen(p: Point): { x: number; y: number } {
    return {
      x: this.transform.offsetX + p.x * this.imageWidth  * this.transform.scale,
      y: this.transform.offsetY + p.y * this.imageHeight * this.transform.scale
    };
  }

  private drawDimension(dim: ActiveDimension) {
    const a = this.toScreen(dim.ptA);
    const b = this.toScreen(dim.ptB);
    const color = this.dimensionColor;

    // Line
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = 2;
    this.ctx.stroke();

    this.drawArrowHead(a, b, color);
    this.drawArrowHead(b, a, color);

    this.drawHandle(a, '#E87A2D', b);
    this.drawHandle(b, '#4CAF50', a);

    // Tick perpendiculars at each end
    this.drawTick(a, b, color);
    this.drawTick(b, a, color);

    // Label
    if (dim.text) {
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      this.ctx.save();
      this.ctx.translate(midX, midY);
      // keep text readable regardless of line direction
      let rot = angle;
      if (rot > Math.PI / 2 || rot < -Math.PI / 2) rot += Math.PI;
      this.ctx.rotate(rot);
      this.ctx.font         = 'bold 13px "DM Sans", sans-serif';
      const tw = this.ctx.measureText(dim.text).width;
      this.ctx.fillStyle    = 'rgba(255,255,255,0.85)';
      this.ctx.fillRect(-tw / 2 - 5, -16, tw + 10, 18);
      this.ctx.fillStyle    = color;
      this.ctx.textAlign    = 'center';
      this.ctx.fillText(dim.text, 0, -2);
      this.ctx.restore();
    }

    // Drag handles
    this.drawHandle(a, '#E87A2D', b);
    this.drawHandle(b, '#4CAF50', a);
  }

  private drawArrow(from: {x:number,y:number}, to: {x:number,y:number}, color: string) {
    const angle  = Math.atan2(to.y - from.y, to.x - from.x);
    const size   = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(
      from.x + size * Math.cos(angle - 0.4),
      from.y + size * Math.sin(angle - 0.4)
    );
    this.ctx.lineTo(
      from.x + size * Math.cos(angle + 0.4),
      from.y + size * Math.sin(angle + 0.4)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  private drawTick(at: {x:number,y:number}, other: {x:number,y:number}, color: string) {
    const angle = Math.atan2(other.y - at.y, other.x - at.x) + Math.PI / 2;
    const len   = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(at.x - len * Math.cos(angle), at.y - len * Math.sin(angle));
    this.ctx.lineTo(at.x + len * Math.cos(angle), at.y + len * Math.sin(angle));
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = 2;
    this.ctx.stroke();
}

  private drawArrowHead(at: {x:number,y:number}, other: {x:number,y:number}, color: string) {
    // Apunta hacia adentro (desde el extremo hacia el centro)
    const angle = Math.atan2(other.y - at.y, other.x - at.x);
    const size  = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(at.x, at.y);
    this.ctx.lineTo(at.x + size * Math.cos(angle - 0.35), at.y + size * Math.sin(angle - 0.35));
    this.ctx.lineTo(at.x + size * Math.cos(angle + 0.35), at.y + size * Math.sin(angle + 0.35));
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
}

  private drawHandle(pos: {x:number,y:number}, color: string, other: {x:number,y:number}) {
    // Desplazar el handle FUERA del extremo (alejado de la línea)
    const angle   = Math.atan2(pos.y - other.y, pos.x - other.x);
    const offset  = 22; // distancia desde el extremo hacia afuera
    const cx      = pos.x + offset * Math.cos(angle);
    const cy      = pos.y + offset * Math.sin(angle);
    const size    = 10;

    // X como handle (dos líneas cruzadas)
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth   = 2.5;
    this.ctx.lineCap     = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(cx - size, cy - size);
    this.ctx.lineTo(cx + size, cy + size);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(cx + size, cy - size);
    this.ctx.lineTo(cx - size, cy + size);
    this.ctx.stroke();
}

  // ═══════════════════════════════════════════════════════
  // Hit test
  // ═══════════════════════════════════════════════════════
  private hitTest(canvasX: number, canvasY: number): DragTarget {
    if (!this.dimension) return null;
    const a = this.toScreen(this.dimension.ptA);
    const b = this.toScreen(this.dimension.ptB);

    const angleA = Math.atan2(a.y - b.y, a.x - b.x);
    const angleB = Math.atan2(b.y - a.y, b.x - a.x);
    const offset = 22;

    const hA = { x: a.x + offset * Math.cos(angleA), y: a.y + offset * Math.sin(angleA) };
    const hB = { x: b.x + offset * Math.cos(angleB), y: b.y + offset * Math.sin(angleB) };

    if (Math.hypot(canvasX - hA.x, canvasY - hA.y) <= this.HIT_RADIUS) return 'A';
    if (Math.hypot(canvasX - hB.x, canvasY - hB.y) <= this.HIT_RADIUS) return 'B';
    return null;
}

  private canvasXY(clientX: number, clientY: number): { cx: number; cy: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect   = canvas.getBoundingClientRect();
    return {
      cx: (clientX - rect.left) * (canvas.width  / rect.width),
      cy: (clientY - rect.top)  * (canvas.height / rect.height)
    };
  }

  private toNorm(cx: number, cy: number): Point {
    return {
      x: Math.max(0, Math.min(1, (cx - this.transform.offsetX) / this.transform.scale / this.imageWidth)),
      y: Math.max(0, Math.min(1, (cy - this.transform.offsetY) / this.transform.scale / this.imageHeight))
    };
  }

  // ═══════════════════════════════════════════════════════
  // Mouse events
  // ═══════════════════════════════════════════════════════
  onMouseDown(event: MouseEvent) {
    const { cx, cy } = this.canvasXY(event.clientX, event.clientY);
    const hit = this.hitTest(cx, cy);
    if (hit) {
      this.dragTarget = hit;
      return;
    }
    // Pan
    this.isPanning        = true;
    this.panStart         = { x: cx, y: cy };
    this.panStartTransform = { ...this.transform };
  }

  private onMouseMove(event: MouseEvent) {
    const { cx, cy } = this.canvasXY(event.clientX, event.clientY);
    if (this.dragTarget && this.dimension) {
      const norm = this.toNorm(cx, cy);
      if (this.dragTarget === 'A') this.dimension.ptA = norm;
      else                         this.dimension.ptB = norm;
      this.drawAll();
      return;
    }
    if (this.isPanning) {
      this.transform.offsetX = this.panStartTransform.offsetX + (cx - this.panStart.x);
      this.transform.offsetY = this.panStartTransform.offsetY + (cy - this.panStart.y);
      this.drawAll();
    }
  }

  private onMouseUp() {
    this.dragTarget = null;
    this.isPanning  = false;
  }

  // ═══════════════════════════════════════════════════════
  // Touch events
  // ═══════════════════════════════════════════════════════
  private onTouchStart(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const { cx, cy } = this.canvasXY(event.touches[0].clientX, event.touches[0].clientY);
      const hit = this.hitTest(cx, cy);
      if (hit) {
        this.dragTarget = hit;
        return;
      }
      this.isPanning        = true;
      this.panStart         = { x: cx, y: cy };
      this.panStartTransform = { ...this.transform };
    } else if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this.initialPinchDistance = Math.hypot(dx, dy);
      this.initialPinchScale    = this.transform.scale;
    }
  }

  private onTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const { cx, cy } = this.canvasXY(event.touches[0].clientX, event.touches[0].clientY);
      if (this.dragTarget && this.dimension) {
        const norm = this.toNorm(cx, cy);
        if (this.dragTarget === 'A') this.dimension.ptA = norm;
        else                         this.dimension.ptB = norm;
        this.drawAll();
        return;
      }
      if (this.isPanning) {
        this.transform.offsetX = this.panStartTransform.offsetX + (cx - this.panStart.x);
        this.transform.offsetY = this.panStartTransform.offsetY + (cy - this.panStart.y);
        this.drawAll();
      }
    } else if (event.touches.length === 2) {
      const dx    = event.touches[0].clientX - event.touches[1].clientX;
      const dy    = event.touches[0].clientY - event.touches[1].clientY;
      const ratio = Math.hypot(dx, dy) / this.initialPinchDistance;
      this.transform.scale = Math.min(5, Math.max(0.5, this.initialPinchScale * ratio));
      this.drawAll();
    }
  }

  private onTouchEnd(_event: TouchEvent) {
    this.dragTarget = null;
    this.isPanning  = false;
  }

  // ═══════════════════════════════════════════════════════
  // Dimension actions (called from template)
  // ═══════════════════════════════════════════════════════
  addDimension() {
    // Place a horizontal line across the centre third of the image
    this.dimension = {
      ptA:  { x: 0.2, y: 0.5 },
      ptB:  { x: 0.8, y: 0.5 },
      text: this.measureText || ''
    };
    this.measureText = '';
    this.drawAll();
    this.cdr.detectChanges();
  }

  removeDimension() {
    this.dimension   = null;
    this.measureText = '';
    this.drawAll();
    this.cdr.detectChanges();
  }

  /** Live-update label as user types */
  onMeasureInput() {
    if (this.dimension) {
      this.dimension.text = this.measureText;
      this.drawAll();
    }
  }

  applyDimensions() {
    if (!this.dimension || !this.dimension.text.trim()) {
      this.statusMessage = '⚠️ Ingresá la medida antes de aplicar';
      this.statusColor   = '#E87A2D';
      this.cdr.detectChanges();
      return;
    }

    this.mode          = 'processing';
    this.statusMessage = '🔄 Aplicando cota...';
    this.cdr.detectChanges();

    const payload = [{
      x1:    this.dimension.ptA.x,
      y1:    this.dimension.ptA.y,
      x2:    this.dimension.ptB.x,
      y2:    this.dimension.ptB.y,
      text:  this.dimension.text,
      color: this.dimensionColor
    }];

    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation:  'dimensions',
      dimensions: payload
    }).subscribe({
      next: (res) => {
        this.currentImageBase64 = res.image_base64;
        this.imageUrl = `data:image/jpeg;base64,${res.image_base64}`;
        this.dimension          = null;
        this.measureText        = '';
        this.statusMessage      = '✅ Cota aplicada. Presioná GUARDAR para finalizar.';
        this.statusColor        = '#4CAF50';
        this.mode               = 'preview';
        this.image.onload = () => {
          this.imageWidth  = this.image.width;
          this.imageHeight = this.image.height;
          this.drawAll();
          this.cdr.detectChanges();
        };
        this.image.src = this.imageUrl;
      },
      error: () => {
        this.statusMessage = '❌ Error al aplicar cota';
        this.statusColor   = '#F44336';
        this.mode          = 'idle';
        this.cdr.detectChanges();
      }
    });
  }

  setDimensionColor(color: string) {
    this.dimensionColor = color;
    this.drawAll();
  }

  // ═══════════════════════════════════════════════════════
  // Remove BG
  // ═══════════════════════════════════════════════════════
  startRemoveBg() {
    this.mode          = 'processing';
    this.statusMessage = '🔄 Eliminando fondo...';
    this.cdr.detectChanges();

    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation: 'remove_bg'
    }).subscribe({
      next: (res) => {
        this.currentImageBase64 = res.image_base64;
        this.imageUrl = `data:image/jpeg;base64,${res.image_base64}`;
        this.statusMessage      = '✅ Fondo eliminado. Presioná GUARDAR para finalizar.';
        this.statusColor        = '#4CAF50';
        this.mode               = 'preview';
        this.image.onload = () => {
          this.imageWidth  = this.image.width;
          this.imageHeight = this.image.height;
          this.drawAll();
          this.cdr.detectChanges();
        };
        this.image.src = `data:image/jpeg;base64,${res.image_base64}`;
      },
      error: () => {
        this.statusMessage = '❌ Error al eliminar fondo';
        this.statusColor   = '#F44336';
        this.mode          = 'idle';
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Label
  // ═══════════════════════════════════════════════════════
  applyLabel() {
    if (!this.labelText.trim()) {
      this.statusMessage = '⚠️ Ingresá un texto para la etiqueta';
      this.cdr.detectChanges();
      return;
    }

    this.mode          = 'processing';
    this.statusMessage = '🔄 Aplicando etiqueta...';
    this.cdr.detectChanges();

    const canvas   = document.createElement('canvas');
    canvas.width   = this.imageWidth;
    canvas.height  = this.imageHeight;
    const ctx      = canvas.getContext('2d')!;
    if (this.currentImageBase64) {
      const src = new Image();
      src.src = `data:image/jpeg;base64,${this.currentImageBase64}`;
      ctx.drawImage(src, 0, 0);
    } else {
      ctx.drawImage(this.image, 0, 0);
    }

    const fontSize  = Math.round(this.imageHeight * 0.05);
    const padding   = Math.round(fontSize * 0.8);
    const margin    = Math.round(fontSize * 0.5);
    ctx.font        = `bold ${fontSize}px "DM Sans", sans-serif`;
    const textWidth = ctx.measureText(this.labelText).width;
    const boxWidth  = textWidth + padding * 2;
    const boxHeight = fontSize  + padding;
    const x         = this.imageWidth - boxWidth - margin;
    const y         = margin;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(this.labelText, x + padding, y + fontSize);

    const base64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];

    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation:    'replace',
      image_base64: base64
    }).subscribe({
      next: () => {
        this.currentImageBase64 = base64;
        this.imageUrl = `data:image/jpeg;base64,${base64}`;
        this.statusMessage      = '✅ Etiqueta aplicada';
        this.statusColor        = '#4CAF50';
        this.mode               = 'preview';
        const img = new Image();
          img.onload = () => {
            this.image       = img;
            this.imageWidth  = img.width;
            this.imageHeight = img.height;
            this.drawAll();
            this.cdr.detectChanges();
          };
          img.src = `data:image/jpeg;base64,${base64}`;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statusMessage = '❌ Error al aplicar etiqueta';
        this.statusColor   = '#F44336';
        this.mode          = 'idle';
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Crop
  // ═══════════════════════════════════════════════════════
  get cropImageBase64(): string {
    return `data:image/jpeg;base64,${this.currentImageBase64}`;
  }

  startCrop() {
    const canvas  = document.createElement('canvas');
    canvas.width  = this.imageWidth;
    canvas.height = this.imageHeight;
    canvas.getContext('2d')!.drawImage(this.image, 0, 0);
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
    this.cropMode  = false;
    this.cropLoaded = false;
    this.cdr.detectChanges();
    this.saveImage();
  }

  cancelCrop() {
    this.cropMode      = false;
    this.croppedBase64 = '';
  }

  // ═══════════════════════════════════════════════════════
  // Save / Delete / Cover
  // ═══════════════════════════════════════════════════════
  saveImage() {
    this.mode          = 'processing';
    this.statusMessage = '💾 Guardando imagen...';
    this.cdr.detectChanges();

    this.managerApis.editProductImage(this.stockId, this.imageId, {
      operation:    'replace',
      image_base64: this.currentImageBase64
    }).subscribe({
      next: () => {
        this.statusMessage = '✅ Imagen guardada';
        this.statusColor   = '#4CAF50';
          if (this.currentImageBase64) {
          this.imageUrl = `data:image/jpeg;base64,${this.currentImageBase64}`;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          this.imageSaved.emit({ imageUrl: this.imageUrl, imageId: this.imageId });
          this.closeModal();
        }, 800);
      },
      error: () => {
        this.statusMessage = '❌ Error al guardar';
        this.statusColor   = '#F44336';
        this.mode          = 'preview';
        this.cdr.detectChanges();
      }
    });
  }

  requestDelete() {
    if (this.totalImages <= 1) return;
    if (!confirm('¿Eliminar esta imagen?')) return;
    this.managerApis.deleteProductImage(this.stockId, this.imageId).subscribe({
      next:  () => this.imageDeleted.emit(this.imageId),
      error: () => {
        this.statusMessage = '❌ Error al eliminar';
        this.cdr.detectChanges();
      }
    });
  }

  setCover() { this.coverSet.emit(this.imageId); }

  undoChanges() {
    this.dimension   = null;
    this.measureText = '';
    this.labelText   = '';
    this.statusMessage = '';
    this.mode          = 'idle';
    this.loadImage();
  }

  setActiveTab(tab: 'cotas' | 'removebg' | 'etiqueta' | 'recorte') {
    this.activeTab = tab;
  }

  duplicateImage() {
    this.imageDuplicated.emit(this.imageId);
    this.closeModal();
  }

  nudgePoint(point: 'A' | 'B', direction: 'up' | 'down' | 'left' | 'right') {
    if (!this.dimension) return;
    const step = 0.005;
    const pt = point === 'A' ? this.dimension.ptA : this.dimension.ptB;
    if (direction === 'up')    pt.y = Math.max(0, pt.y - step);
    if (direction === 'down')  pt.y = Math.min(1, pt.y + step);
    if (direction === 'left')  pt.x = Math.max(0, pt.x - step);
    if (direction === 'right') pt.x = Math.min(1, pt.x + step);
    this.drawAll();
  }

  closeModal() { this.close.emit(); }
}
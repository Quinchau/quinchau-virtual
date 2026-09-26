import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  templateUrl: './image-carousel.component.html',
})
export class ImageCarouselComponent {
  readonly images = input.required<string[]>();
  readonly initialIndex = input<number>(0);
  readonly close = output<void>();

  readonly currentIndex = signal<number>(0);
  readonly scale = signal<number>(1);
  
  // Posiciones de desplazamiento (Pan)
  readonly translateX = signal<number>(0);
  readonly translateY = signal<number>(0);

  // Auxiliares para el cálculo del gesto Pinch y Drag
  private initialPinchDistance = 0;
  private initialScale = 1;
  
  private startX = 0;
  private startY = 0;
  private initialTranslateX = 0;
  private initialTranslateY = 0;

  ngOnInit() {
    this.currentIndex.set(this.initialIndex());
  }

  onClose() {
    this.close.emit();
  }

  selectIndex(index: number) {
    this.currentIndex.set(index);
    this.resetZoom();
  }

  zoomIn() {
    this.scale.update(s => Math.min(s + 0.5, 3));
  }

  zoomOut() {
    const newScale = Math.max(this.scale() - 0.5, 1);
    this.scale.set(newScale);
    if (newScale === 1) this.resetZoom();
  }

  resetZoom() {
    this.scale.set(1);
    this.translateX.set(0);
    this.translateY.set(0);
  }

  // --- MANEJO DE GESTOS TÁCTILES ---

  onTouchStart(event: TouchEvent) {
    // Gestos con 2 dedos (Pinch to Zoom)
    if (event.touches.length === 2) {
      this.initialPinchDistance = this.getDistance(event.touches[0], event.touches[1]);
      this.initialScale = this.scale();
    } 
    // Gesto con 1 dedo (Arrastrar / Pan) cuando hay zoom activo
    else if (event.touches.length === 1 && this.scale() > 1) {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.initialTranslateX = this.translateX();
      this.initialTranslateY = this.translateY();
    }
  }

  onTouchMove(event: TouchEvent) {
    // Movimiento con 2 dedos
    if (event.touches.length === 2) {
      event.preventDefault();
      const currentDistance = this.getDistance(event.touches[0], event.touches[1]);
      if (this.initialPinchDistance > 0) {
        const zoomFactor = currentDistance / this.initialPinchDistance;
        const newScale = Math.min(Math.max(this.initialScale * zoomFactor, 1), 3);
        this.scale.set(newScale);
        if (newScale === 1) {
          this.translateX.set(0);
          this.translateY.set(0);
        }
      }
    } 
    // Arrastre con 1 dedo cuando hay zoom activo
    else if (event.touches.length === 1 && this.scale() > 1) {
      event.preventDefault();
      const deltaX = event.touches[0].clientX - this.startX;
      const deltaY = event.touches[0].clientY - this.startY;

      // Aplicar desplazamiento
      this.translateX.set(this.initialTranslateX + deltaX);
      this.translateY.set(this.initialTranslateY + deltaY);
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (event.touches.length < 2) {
      this.initialPinchDistance = 0;
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.hypot(dx, dy);
  }
}
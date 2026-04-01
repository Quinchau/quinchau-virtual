// src/app/components/bottom-nav/bottom-nav.ts

import { Component, computed, inject, signal, afterNextRender, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
})
export class BottomNav implements OnDestroy {

  private state = inject(ManagerState);

  readonly cartCount = computed(() => this.state.cartCount());
  
  readonly canSeeDashboard = computed(() => {
    const user = this.state.currentUser();
    const ALLOWED_LEVELS = [8, 10];
    return user ? ALLOWED_LEVELS.includes(user.fullaccess ?? 0) : false;
  });

  // Animación del badge
  pulso = signal(0);
  private cartBadge = viewChild<ElementRef<HTMLSpanElement>>('cartBadge');

  private intervalId: any = null;

  constructor() {
    afterNextRender(() => {
      this.iniciarAnimacionPeriodica();
    });
  }

  private iniciarAnimacionPeriodica() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.cartCount() > 0) {
        this.pulso.update(v => v + 1);

        // Forzar reinicio de la animación
        const badgeEl = this.cartBadge()?.nativeElement;
        if (badgeEl) {
          badgeEl.style.animation = 'none';
          // Trigger reflow
          void badgeEl.offsetWidth;
          badgeEl.style.animation = '';
        }
      }
    }, 5000); // Cada 5 segundos
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
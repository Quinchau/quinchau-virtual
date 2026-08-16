// src/app/components/header/header.ts
import { Component, computed, inject, signal, viewChild, ElementRef, OnDestroy, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { AuthService } from '../../services/auth';
import { SearchService } from '../../services/search.service';
import { ChatBridgeService } from '../../services/chat-bridge';
import { LoadingBar } from '../loading-bar/loading-bar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, LoadingBar],
  templateUrl: './header.html',
})
export class Header implements OnDestroy {
  chatBridge = inject(ChatBridgeService);
  public state = inject(ManagerState);
  private authService = inject(AuthService);
  public searchService = inject(SearchService); // <-- Inyectamos

  // Estado de la UI
  readonly isMenuOpen = signal(false);
  
  // Signals computadas
  readonly cartCount = computed(() => this.state.cartCount());
  readonly isLogged = computed(() => !!this.state.currentUser());
  readonly canSeeDashboard = computed(() => {
    const user = this.state.currentUser();
    return user ? [8, 10].includes(user.fullaccess ?? 0) : false;
  });

  readonly canSeeCustomer = computed(() => {
    const user = this.state.currentUser();
    return user ? [8, 10].includes(user.fullaccess ?? 0) : false;
  });

  readonly canSeeInvoice = computed(() => {
    const user = this.state.currentUser();
    return user ? [8, 10].includes(user.fullaccess ?? 0) : false;
  });

  readonly canSeeFaqs = computed(() => {
    const user = this.state.currentUser();
    return user ? [8, 10].includes(user.fullaccess ?? 0) : false;
  });

  readonly canSeeCampanas = computed(() => {
    const user = this.state.currentUser();
    return user ? [8, 10].includes(user.fullaccess ?? 0) : false;
  });

  // Animación del badge del carrito
  public pulso = signal(0);
  private cartBadge = viewChild<ElementRef<HTMLSpanElement>>('cartBadge');
  private intervalId: any = null;

  constructor() {
    afterNextRender(() => {
      this.iniciarAnimacionPeriodica();
    });
  }

  private iniciarAnimacionPeriodica(): void {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.cartCount() > 0) {
        this.pulso.update(v => v + 1);

        const badgeEl = this.cartBadge()?.nativeElement;
        if (badgeEl) {
          badgeEl.style.animation = 'none';
          void badgeEl.offsetWidth; 
          badgeEl.style.animation = '';
        }
      }
    }, 5000);
  }

  public toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }

  public onLogoutClick(): void {
    this.isMenuOpen.set(false);
    this.authService.logout();
  }

  // <-- Nuevo método para abrir búsqueda global
  public openGlobalSearch(): void {
    this.searchService.openSearch();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
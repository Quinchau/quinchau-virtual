import { Component, computed, inject, signal, viewChild, ElementRef, OnDestroy, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ManagerState } from '../../services/manager-state';
import { AuthService } from '../../services/auth';
import { SearchBox } from '../search-box/search-box';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, SearchBox],
  templateUrl: './header.html',
})
export class Header implements OnDestroy {
  // Inyección de dependencias
  public state = inject(ManagerState);
  private authService = inject(AuthService);

  // Estado de la UI
  readonly isMenuOpen = signal(false);
  
  // Signals computadas para una vista reactiva y eficiente
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

  

  // Animación del badge del carrito
  public pulso = signal(0);
  private cartBadge = viewChild<ElementRef<HTMLSpanElement>>('cartBadge');
  private intervalId: any = null;

  constructor() {
    // afterNextRender asegura que el código solo se ejecute en el navegador (SSR friendly)
    afterNextRender(() => {
      this.iniciarAnimacionPeriodica();
    });
  }

  /**
   * Ejecuta una pequeña animación visual en el carrito cada 5 segundos
   * si hay productos agregados, para incentivar el checkout (UX).
   */
  private iniciarAnimacionPeriodica(): void {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.cartCount() > 0) {
        this.pulso.update(v => v + 1);

        const badgeEl = this.cartBadge()?.nativeElement;
        if (badgeEl) {
          // Truco técnico: Forzar reflujo para reiniciar la animación CSS
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

  /**
   * Nota de Tutor: Hemos eliminado 'onSearchInput' porque el componente 
   * <app-search-box /> ya se encarga de gestionar la búsqueda de forma autónoma.
   */

  ngOnDestroy(): void {
    // Limpieza de recursos para evitar fugas de memoria
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
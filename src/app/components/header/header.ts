import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ManagerState } from '../../services/manager-state';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  public isCatalogOpen = signal(false);
  public state = inject(ManagerState);
  private authService = inject(AuthService);
  private readonly ALLOWED_LEVELS = [8, 10];
  public isMenuOpen = signal(false);
  public isLogged = computed(() => !!this.state.currentUser());
  readonly categoriasData = computed(() => this.state.homeResource.value()?.categorias ?? []);
  public canSeeDashboard = computed(() => {
    const user = this.state.currentUser();
    return user ? this.ALLOWED_LEVELS.includes(user.fullaccess) : false;
  });

  public categoriaActiva = linkedSignal({
  source: () => this.isCatalogOpen(),
  computation: (isOpen, previous) => isOpen ? (previous?.value ?? null) : null
});

public marcaActiva = linkedSignal({
  source: () => this.categoriaActiva(),
  computation: () => null
});
  
  public userLevelDisplay = computed(() => 
    this.state.currentUser()?.fullaccess ?? 'Invitado'
  );

  toggleCatalog(): void {
    this.isCatalogOpen.update(v => !v);
  }

  onLogoutClick(): void {
    this.isMenuOpen.set(false);
    this.authService.logout();
  }

  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
  }
}
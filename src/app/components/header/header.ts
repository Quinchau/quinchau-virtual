import { afterNextRender, Component, computed, effect, ElementRef, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ManagerState } from '../../services/manager-state';
import { CategoriaNavegacion, MarcaConModelos, Modelo } from '../../models/transfer.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './header.html',
})
export class Header {
  public state = inject(ManagerState);
  private authService = inject(AuthService);

  private readonly ALLOWED_LEVELS = [8, 10];

  public isMenuOpen = signal(false);
  public isCatalogOpen = signal(false);

  readonly categoriasData = computed(() => this.state.homeResource.value()?.categorias ?? []);

  public isLogged = computed(() => !!this.state.currentUser());
  public userLevelDisplay = computed(() => this.state.currentUser()?.fullaccess ?? 'Invitado');
  public canSeeDashboard = computed(() => {
    const user = this.state.currentUser();
    return user ? this.ALLOWED_LEVELS.includes(user.fullaccess) : false;
  });


  // --- LÓGICA REACTIVA EN CASCADA ---

  // Categoría activa debe ser un signal normal
  public categoriaActiva = signal<CategoriaNavegacion | null>(null);

  public marcaActiva = linkedSignal<CategoriaNavegacion | null, MarcaConModelos | null>({
  source: () => this.categoriaActiva(),
  computation: (categoria, previous) => {
    if (!categoria) return null;

    const marcaPrev = previous?.value;
    if (marcaPrev && !categoria.marcas.some(m => m.nombre === marcaPrev.nombre)) {
      return null;
    }

    return marcaPrev ?? null;
  }
});

  pulso = signal(0);

  private cartBadge = viewChild<ElementRef<HTMLSpanElement>>('cartBadge');

  private intervalId: any = null;


  constructor() {
    afterNextRender(() => {
      console.log('🚀 Header animación del carrito iniciada');

      this.iniciarAnimacionPeriodica();
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private iniciarAnimacionPeriodica() {
    // Limpiamos cualquier intervalo anterior
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      const count = this.state.cartCount();

      if (count > 0) {
        // Incrementamos el pulso → alterna entre bounce y shake
        this.pulso.update(v => v + 1);

        // Forzamos reinicio de la animación CSS
        const badgeEl = this.cartBadge()?.nativeElement;
        if (badgeEl) {
          badgeEl.style.animation = 'none';
          void badgeEl.offsetWidth;        // ← clave para reiniciar
          badgeEl.style.animation = '';
        }
      }
    }, 5000); // cada 5 segundos
  }

  // Modelo activo depende de la marca
  public modeloActivo = linkedSignal<MarcaConModelos | null, Modelo | null>({
    source: () => this.marcaActiva(),
    computation: (marca, previous) => marca ? previous?.value ?? null : null
  });

  // Lista derivada para el tercer nivel del menú
  public modelosDisponibles = computed(() => this.marcaActiva()?.modelos ?? []);

  // --- HANDLERS ---

  toggleMenu() { this.isMenuOpen.update(v => !v); }

  toggleCatalog() { this.isCatalogOpen.update(v => !v); }

  seleccionarCategoria(cat: CategoriaNavegacion) {
    console.log('👉 CLICK categoria:', cat.nombre);
    this.categoriaActiva.update(actual =>
      actual?.nombre === cat.nombre ? null : cat
    );
  }

  seleccionarMarca(marca: MarcaConModelos) {
    console.log('👉 CLICK marca:', marca.nombre);
    this.marcaActiva.update(actual =>
      actual?.nombre === marca.nombre ? null : marca
    );
  }

  onLogoutClick() {
    this.isMenuOpen.set(false);
    this.authService.logout();
  }
}

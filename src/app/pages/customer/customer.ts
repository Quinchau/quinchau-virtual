import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { ManagerState } from '../../services/manager-state';
import { Currency, SalesType, DebtorType } from '../../models/company_config.model';
import { 
    CustomerSummary, 
    CustomerDetailResult,
    CustomerSearchResult,
    Branch
} from '../../models/customer.model';

type Fase = 'busqueda' | 'registro' | 'detalle';

@Component({
  selector: 'app-customer',
  imports: [FormsModule],
  templateUrl: './customer.html',
  styles: '',
})
export class Customer implements OnInit {

  private apis   = inject(ManagerApis);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private state  = inject(ManagerState);

  // ── Fase activa ──────────────────────────────────────────
  fase = signal<Fase>('busqueda');

  // ── Búsqueda ─────────────────────────────────────────────
  queryBusqueda      = '';
  buscando           = signal(false);
  resultados         = signal<CustomerSummary[]>([]);
  sinResultados      = signal(false);

  // ── Catálogos (registro + detalle) ───────────────────────
  currencies      = signal<Currency[]>([]);
  salesTypes      = signal<SalesType[]>([]);
  debtorTypes     = signal<DebtorType[]>([]);
  loadingCatalogs = signal(false);

  // ── Formulario cliente ───────────────────────────────────
  form = {
    debtorNo:     '',
    name:         '',
    currcode:     '',
    salestype:    '',
    typeid:       0, // Cambiar de 1 a 0 (valor inválido)
    discount:     0,
    creditlimit:  0,
    paymentterms: '20',
    holdreason:   0,
    taxref:       '',
    zona:         '',
  };

  // ── Validaciones ─────────────────────────────────────────
  tipoClienteInvalido(): boolean {
  if (this.fase() !== 'registro') return false;
  
  const typeid = this.form.typeid;
  console.log('Validando tipoClienteInvalido:', { typeid, typeidType: typeof typeid });
  
  return !typeid || typeid === 0;
}

  // ── Detalle ──────────────────────────────────────────────
  debtorNoActual  = signal<string | null>(null);
  branches        = signal<Branch[]>([]);
  loadingDetalle  = signal(false);

  // ── Identidad del usuario (desde ManagerState) ───────────
  userLoccode = this.state.userLocation;

  // ── Estado de envío ──────────────────────────────────────
  saving = signal(false);
  error  = signal<string | null>(null);

  // ─────────────────────────────────────────────────────────

  ngOnInit() {
    const debtorNo = this.route.snapshot.paramMap.get('debtorNo');
    if (debtorNo) {
      this.cargarDetalle(debtorNo);
      return;
    }
  }

  // ── FASE 1: BÚSQUEDA ─────────────────────────────────────

  buscar() {
    const q = this.queryBusqueda.trim();
    if (q.length < 3) return;

    this.buscando.set(true);
    this.sinResultados.set(false);
    this.resultados.set([]);
    this.error.set(null);

    this.apis.searchCustomers(q).subscribe({
      next: (res: CustomerSearchResult) => {
        this.buscando.set(false);
        if (res.data.length === 0) {
          this.sinResultados.set(true);
        } else if (res.data.length === 1) {
          this.cargarDetalle(res.data[0].debtorno);
        } else {
          this.resultados.set(res.data);
        }
      },
      error: () => {
        this.buscando.set(false);
        this.error.set('Error al buscar clientes');
      },
    });
  }

  irARegistro() {
    this.form.debtorNo = this.queryBusqueda.trim().toUpperCase();
    this.sinResultados.set(false);
    this.cargarCatalogos();
    this.fase.set('registro');
  }

  seleccionarResultado(debtorNo: string) {
    this.resultados.set([]);
    this.cargarDetalle(debtorNo);
  }

  // ── FASE 2: REGISTRO ─────────────────────────────────────

  private cargarCatalogos() {
    if (this.currencies().length > 0) return;
    
    this.loadingCatalogs.set(true);
    this.apis.getCatalogs().subscribe({
      next: (data) => {
        this.currencies.set(data.currencies);
        this.salesTypes.set(data.salesTypes);
        this.debtorTypes.set(data.debtorTypes);
        
        // Buscar USD primero
        const usdCurrency = data.currencies.find(c => c.currabrev === 'USD');
        const defaultCurrency = usdCurrency?.currabrev ?? data.currencies[0]?.currabrev ?? '';
        
        this.form.currcode  = defaultCurrency;
        this.form.salestype = data.salesTypes[0]?.typeabbrev ?? '';
        this.form.typeid    = 0; // Sin selección inicial
        
        this.loadingCatalogs.set(false);
      },
      error: () => this.loadingCatalogs.set(false),
    });
  }

  onDebtorNoInput(event: Event) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    this.form.debtorNo = input.value;
  }

  setHoldReason(value: 0 | 1) {
    this.form.holdreason = value;
  }

  guardar() {
    console.log('=== GUARDAR CLIENTE ===');
  console.log('Fase:', this.fase());
  console.log('form.typeid:', this.form.typeid, 'tipo:', typeof this.form.typeid);
  console.log('tipoClienteInvalido:', this.tipoClienteInvalido());
  // Validar tipo de cliente antes de guardar
  if (this.tipoClienteInvalido()) {
    console.log('VALIDACIÓN FALLÓ - tipo inválido');
    this.error.set('Debe seleccionar un tipo de cliente');
    return;
  }
  console.log('VALIDACIÓN PASÓ - enviando a API...');
  this.error.set(null);
  this.saving.set(true);

  const esNuevo = this.fase() === 'registro';
  
  const op$ = esNuevo
    ? this.apis.createCustomer(this.form)
    : this.apis.updateCustomer(this.debtorNoActual()!, this.form);

  op$.subscribe({
    next: (res: any) => {
      this.saving.set(false);
      if (esNuevo) {
        const debtorNo = res?.data?.debtorNo ?? this.form.debtorNo;
        this.cargarDetalle(debtorNo);
      }
    },
    error: (err: any) => {
      this.error.set(err?.error?.mensaje ?? 'Error al guardar el cliente');
      this.saving.set(false);
    },
  });
}

  // ── FASE 3: DETALLE ──────────────────────────────────────

  cargarDetalle(debtorNo: string) {
    this.loadingDetalle.set(true);
    this.error.set(null);
    this.fase.set('detalle');
    this.debtorNoActual.set(debtorNo);

    this.cargarCatalogos();

    this.apis.getCustomer(debtorNo).subscribe({
      next: (res: CustomerDetailResult) => {
        const customerData = res.data.customer;
        const branchesData = res.data.branches;

        this.form = {
          debtorNo:     customerData.debtorno,
          name:         customerData.name,
          currcode:     customerData.currcode,
          salestype:    customerData.salestype,
          typeid:       customerData.typeid,
          discount:     customerData.discount * 100,
          creditlimit:  customerData.creditlimit,
          paymentterms: customerData.paymentterms,
          holdreason:   customerData.holdreason,
          taxref:       customerData.taxref,
          zona:         customerData.zona,
        };

        this.branches.set(branchesData);
        this.loadingDetalle.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el cliente');
        this.loadingDetalle.set(false);
      },
    });
  }

  volverBusqueda() {
    this.fase.set('busqueda');
    this.resultados.set([]);
    this.sinResultados.set(false);
    this.debtorNoActual.set(null);
    this.branches.set([]);
    this.error.set(null);
  }

  // ── PERMISOS DE BRANCH ───────────────────────────────────

  puedeEditarBranch(branch: Branch): boolean {
    return branch.defaultlocation === this.userLoccode();
  }

  puedeEliminarBranch(branch: Branch): boolean {
    return branch.defaultlocation === this.userLoccode() && branch.transactionCount === 0;
  }

  puedeAgregarBranch(): boolean {
    return !this.branches().some(b => b.defaultlocation === this.userLoccode());
  }

  // ── NAVEGACIÓN A BRANCH ──────────────────────────────────

  irANuevoBranch() {
    this.router.navigate(['/customers', this.debtorNoActual(), 'branches', 'new']);
  }

  irAEditarBranch(branchCode: string) {
    this.router.navigate(['/customers', this.debtorNoActual(), 'branches', branchCode, 'edit']);
  }

  eliminarBranch(branchCode: string) {
    if (!confirm('¿Eliminar esta delegación?')) return;
    this.apis.deleteBranch(this.debtorNoActual()!, branchCode).subscribe({
      next: () => {
        this.branches.update(bs => bs.filter(b => b.branchcode !== branchCode));
      },
      error: (err: any) => {
        this.error.set(err?.error?.mensaje ?? 'Error al eliminar la delegación');
      },
    });
  }
}
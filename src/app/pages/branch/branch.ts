import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { Area, CustomerDetailResult, Salesman } from '../../models/customer.model';
import { ManagerState } from '../../services/manager-state';

type Modo = 'new' | 'edit';

interface BranchForm {
  branchCode:      string;
  brname:          string;
  area:            string;
  salesman:        string;
  phoneno:         string;
  email:           string;
  contactname:     string;
  defaultlocation: string;
  phoneCode:       string;   // UI only
  phoneNumber:     string;   // UI only
}

@Component({
  selector: 'app-branch',
  imports: [FormsModule],
  templateUrl: './branch.html',
  styles: '',
})
export class Branch implements OnInit {

  private apis   = inject(ManagerApis);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private state  = inject(ManagerState);

  // ── Modo y contexto ──────────────────────────────────────
  modo        = signal<Modo>('new');
  debtorNo    = signal('');
  branchCode  = signal('');     // solo en modo edit

  // ── Catálogos ────────────────────────────────────────────
  areas           = signal<Area[]>([]);
  salesman        = signal<Salesman[]>([]);
  loadingCatalogs = signal(true);

  // ── Datos del usuario y cliente ──────────────────────────
  userLoccode  = this.state.userLocation;
  customerName = signal('');

  // ── Formulario con tipado explícito ───────────────────────
  form: BranchForm = {
    branchCode:      '',
    brname:          '',
    area:            '',
    salesman:        '',
    phoneno:         '',
    email:           '',
    contactname:     '',
    defaultlocation: '',
    phoneCode:       '412',
    phoneNumber:     '',
  };

  // ── Estado ───────────────────────────────────────────────
  saving       = signal(false);
  loadingData  = signal(false);
  error        = signal<string | null>(null);

  // ─────────────────────────────────────────────────────────

  ngOnInit() {
    const debtorNo   = this.route.snapshot.paramMap.get('debtorNo')   ?? '';
    const branchCode = this.route.snapshot.paramMap.get('branchCode') ?? '';

    this.debtorNo.set(debtorNo);

    if (branchCode && branchCode !== 'new') {
      this.modo.set('edit');
      this.branchCode.set(branchCode);
    }

    // Cargar datos del cliente
    this.cargarCliente();
    
    // Cargar catálogos (áreas, vendedores)
    this.apis.getBranchCatalogs().subscribe({
      next: (data) => {
        this.areas.set(data.areas);
        this.salesman.set(data.salesman);
        this.form.area     = data.areas[0]?.areacode    ?? '';
        this.form.salesman = data.salesman[0]?.salesmancode ?? '';
        this.loadingCatalogs.set(false);

        if (this.modo() === 'edit') {
          this.cargarBranch();
        }
      },
      error: () => this.loadingCatalogs.set(false),
    });
  }

  private cargarCliente() {
    this.apis.getCustomer(this.debtorNo()).subscribe({
      next: (res: CustomerDetailResult) => {
        const customerName = res.data.customer.name;
        this.customerName.set(customerName);
        
        // Si es nueva delegación, auto-asignar el nombre
        if (this.modo() === 'new') {
          this.form.brname = customerName;
        }
      },
      error: () => {
        console.error('Error al cargar cliente');
      }
    });
  }

  private cargarBranch() {
    this.loadingData.set(true);
    this.apis.getBranches(this.debtorNo()).subscribe({
      next: (res: any) => {
        const branches = res?.data ?? res ?? [];
        const b = branches.find((x: any) => x.branchcode === this.branchCode());
        if (b) {
          // Extraer código y número del teléfono (ej: 04121234567 -> código=412, número=1234567)
          const phone = b.phoneno || '';
          let phoneCode = '412';
          let phoneNumber = '';
          
          if (phone.length >= 10 && phone.startsWith('0')) {
            phoneCode = phone.substring(1, 4);   // 412, 414, etc
            phoneNumber = phone.substring(4);    // últimos 7 dígitos
          }
          
          this.form = {
            branchCode:      b.branchcode,
            brname:          b.brname,
            area:            b.area,
            salesman:        b.salesman,
            phoneno:         b.phoneno,
            email:           b.email,
            contactname:     b.contactname,
            defaultlocation: b.defaultlocation,
            phoneCode:       phoneCode,
            phoneNumber:     phoneNumber,
          };
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la delegación');
        this.loadingData.set(false);
      },
    });
  }

  guardar() {
    this.error.set(null);
    
    // Validar teléfono
    if (this.phoneNumberInvalid()) {
      this.error.set('El número de teléfono debe tener 7 dígitos');
      return;
    }
    
    this.saving.set(true);

    const payload: any = { ...this.form };

    // Construir teléfono completo y eliminar campos auxiliares
    payload.phoneno = this.getFullPhoneNumber();
    delete payload.phoneCode;
    delete payload.phoneNumber;

    // Asignar la ubicación del usuario logueado
    payload.defaultlocation = this.userLoccode();

    // Generar branchCode automáticamente para nueva delegación
    if (this.modo() === 'new') {
      payload.branchCode = `${this.userLoccode()}${this.debtorNo()}`;
      payload.brname = this.customerName();  // nombre del cliente
    }

    const op$ = this.modo() === 'new'
      ? this.apis.addBranch(this.debtorNo(), payload)
      : this.apis.updateBranch(this.debtorNo(), this.branchCode(), payload);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/customers', this.debtorNo()]);
      },
      error: (err: any) => {
        this.error.set(err?.error?.mensaje ?? 'Error al guardar la delegación');
        this.saving.set(false);
      },
    });
  }

  cancelar() {
    this.router.navigate(['/customers', this.debtorNo()]);
  }

  getFullPhoneNumber(): string {
    if (!this.form.phoneNumber) return '';
    return `0${this.form.phoneCode}${this.form.phoneNumber}`;
  }

  phoneNumberInvalid(): boolean {
    const phone = this.form.phoneNumber;
    return !phone || phone.length !== 7 || !/^\d+$/.test(phone);
  }
}
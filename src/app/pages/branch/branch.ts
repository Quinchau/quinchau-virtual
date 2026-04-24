import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ManagerApis } from '../../services/manager-apis';
import { Area, Salesman } from '../../models/customer.model';

type Modo = 'new' | 'edit';

@Component({
  selector: 'app-branch',
  imports: [FormsModule],
  templateUrl: './branch.html',
  styles: '',
})
export class Branch implements OnInit {

  private apis  = inject(ManagerApis);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // ── Modo y contexto ──────────────────────────────────────
  modo        = signal<Modo>('new');
  debtorNo    = signal('');
  branchCode  = signal('');     // solo en modo edit

  // ── Catálogos ────────────────────────────────────────────
  areas           = signal<Area[]>([]);
  salesman        = signal<Salesman[]>([]);
  loadingCatalogs = signal(true);

  // ── Formulario ───────────────────────────────────────────
  form = {
    branchCode:      '',
    brname:          '',
    area:            '',
    salesman:        '',
    phoneno:         '',
    email:           '',
    contactname:     '',
    defaultlocation: '',   // se asigna desde el backend vía req.identity
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

    // Cargar catálogos siempre
    this.apis.getBranchCatalogs().subscribe({
      next: (data) => {
        this.areas.set(data.areas);
        this.salesman.set(data.salesman);
        this.form.area    = data.areas[0]?.areacode    ?? '';
        this.form.salesman = data.salesman[0]?.salesmancode ?? '';
        this.loadingCatalogs.set(false);

        // Si es edit, cargar datos del branch después de tener catálogos
        if (this.modo() === 'edit') {
          this.cargarBranch();
        }
      },
      error: () => this.loadingCatalogs.set(false),
    });
  }

  private cargarBranch() {
    this.loadingData.set(true);
    this.apis.getBranches(this.debtorNo()).subscribe({
      next: (res: any) => {
        const branches = res?.data ?? res ?? [];
        const b = branches.find((x: any) => x.branchcode === this.branchCode());
        if (b) {
          this.form = {
            branchCode:      b.branchcode,
            brname:          b.brname,
            area:            b.area,
            salesman:        b.salesman,
            phoneno:         b.phoneno,
            email:           b.email,
            contactname:     b.contactname,
            defaultlocation: b.defaultlocation,
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
  this.saving.set(true);

  const payload: any = { ...this.form };

  if (!payload.defaultlocation) {
    delete payload.defaultlocation;
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
}
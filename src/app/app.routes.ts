import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Home } from './pages/home/home';
import { TransferDetailComponent } from './pages/transfer-detail/transfer-detail';
import { authGuard } from './guards/auth-guard';
import { NewTransferComponent } from './pages/newtransfer/newtransfer';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Transfers } from './pages/transfers/transfers';
import { adminGuard } from './guards/admin.guard';
import { CartComponent } from './pages/checkout/checkout';
import { Downloaders } from './pages/downloaders/downloaders';
import { ManualWhatsapp } from './pages/manual-whatsapp/manual-whatsapp';
import { Customer } from './pages/customer/customer';
import { Invoice } from './pages/invoice/invoice';

export const routes: Routes = [
  // === RUTAS PÚBLICAS ===
  { path: 'login', component: LoginComponent },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register').then(m => m.Register) 
  },
  { path: 'home', component: Home },
  { path: 'checkout', component: CartComponent },
  { path: 'downloader', component: Downloaders },

  // === RUTAS CON PARÁMETROS FIJOS ===
  {
    path: 'success/:id',
    loadComponent: () =>
      import('./components/success-order/success-order').then(m => m.SuccessOrder)
  },

  // === RUTAS PROTEGIDAS POR ROLES (ESPECÍFICAS PRIMERO) ===
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [adminGuard]
  },
  {
    path: 'customer',
    component: Customer,
    canActivate: [adminGuard]
  },
  {
    path: 'invoice',
    component: Invoice,
    canActivate: [adminGuard]
  },
  {
    path: 'whatsapp-manual',
    component: ManualWhatsapp,
    canActivate: [adminGuard]
  },

  // === RUTAS PROTEGIDAS POR AUTENTICACIÓN ===
  {
    path: 'new-transfer',
    component: NewTransferComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'product/:id',
        component: ProductDetail,
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: 'transfers',
    component: Transfers,
    canActivate: [authGuard],
    children: [
      {
        path: 'detail/:id',
        component: TransferDetailComponent,
        canActivate: [authGuard]
      }
    ]
  },

  // === RUTAS DE CATEGORÍAS (ESTRUCTURA JERÁRQUICA) ===
  {
    path: 'category',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/category/category').then(m => m.Category)
      },
      {
        path: ':categoria',
        loadComponent: () =>
          import('./pages/category/category').then(m => m.Category)
      },
      {
        path: ':categoria/:marca',
        loadComponent: () =>
          import('./pages/category/category').then(m => m.Category)
      }
    ]
  },

  // === RUTAS DINÁMICAS (DEBEN IR AL FINAL) ===
  { path: ':categoria', component: Home },
  { path: ':categoria/:marca', component: Home },
  { path: ':categoria/:marca/:modelo', component: Home },

  // === REDIRECCIÓN POR DEFECTO ===
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

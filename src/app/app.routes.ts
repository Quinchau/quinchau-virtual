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
import { Branch } from './pages/branch/branch';
import { Orders } from './pages/orders/orders';
import { OrderInvoice } from './pages/order-invoice/order-invoice';

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
  { 
    path: 'privacy-policy', 
    loadComponent: () => import('./pages/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy) 
  },

  {
  path: 'desk',
  loadComponent: () => import('./pages/desk/desk').then(m => m.Desk),
  canActivate: [adminGuard]
  },
   {
    path: 'product-admin',
    loadComponent: () => import('./pages/product-admin/product-admin').then(m => m.ProductAdminPage),
    canActivate: [adminGuard]
  },
  {
    path: 'product-create',
    loadComponent: () => import('./pages/product-create/product-create').then(m => m.ProductCreatePage),
    canActivate: [adminGuard]
  },
  {
    path: 'product-edit/:stockId',
    loadComponent: () => import('./pages/product-edit/product-edit').then(m => m.ProductEditPage),
    canActivate: [adminGuard]
  },

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
    path: 'on-demand',
    loadComponent: () =>
      import('./pages/on-demand-list/on-demand-list').then(m => m.OnDemandList),
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
  {
  path: 'customers',
  component: Customer,
  },
  {
    path: 'customers/:debtorNo',
    component: Customer,
  },
  {
    path: 'customers/:debtorNo/branches/new',
    component: Branch,
  },
  {
    path: 'customers/:debtorNo/branches/:branchCode/edit',
    component: Branch,
  },

  {
    path: 'orders',
    component: Orders,
    canActivate: [adminGuard]
  },

  {
    path: 'order-list',
    loadComponent: () =>
        import('./pages/order-list/order-list').then(m => m.OrderList),
    canActivate: [adminGuard]
},
{
    path: 'order-list/:orderno',
    loadComponent: () =>
        import('./pages/order-detail/order-detail').then(m => m.OrderDetail),
    canActivate: [adminGuard]
},

{
    path: 'pick-list/:orderno',
    loadComponent: () =>
      import('./pages/pick-list/pick-list').then(m => m.PickList),
    canActivate: [adminGuard]
  },

  {
    path: 'order/:orderno/invoice',
    component: OrderInvoice,
    canActivate: [adminGuard]
},

  // === RUTAS PROTEGIDAS POR AUTENTICACIÓN ===
  {
  path: 'transfer-group/:groupId',
  loadComponent: () =>
    import('./pages/transfer-group-detail/transfer-group-detail').then(m => m.TransferGroupDetailComponent)
},
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
  {path: ':categoria/:marca/:modelo',
    loadComponent: () =>
      import('./pages/modelpage/modelpage').then(m => m.Modelpage)
  },

  // === REDIRECCIÓN POR DEFECTO ===
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
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
import { ProductOrder } from './pages/product-order/product-order';
import { CartComponent } from './pages/checkout/checkout';

export const routes: Routes = [

  // 🔐 Autenticación
  { path: 'login', component: LoginComponent },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register').then(m => m.Register) 
  },

  // 🏠 Home (landing)
  { path: 'home', component: Home },

  // 🛒 Checkout
  { path: 'checkout', component: CartComponent },

  // 🎉 Orden exitosa
  {
    path: 'success/:id',
    loadComponent: () =>
      import('./components/success-order/success-order').then(m => m.SuccessOrder)
  },

  // 📦 Dashboard (admin)
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [adminGuard]
  },

  // 🔄 Transferencias
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
{ path: ':categoria', component: Home },
{ path: ':categoria/:marca', component: Home },
{ path: ':categoria/:marca/:modelo', component: Home },


  // 🔄 Redirección por defecto
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];

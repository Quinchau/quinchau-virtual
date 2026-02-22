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

export const routes: Routes = [
{ path: 'producto/:slugId', component: ProductOrder },
{ path: 'login', component: LoginComponent },
{ path: 'home', component: Home },
{ path: 'dashboard',
  component: Dashboard,canActivate: [adminGuard] },
{ path: 'new-transfer', component: NewTransferComponent, canActivate: [authGuard],
  children: [
      {
        path: 'product/:id',
        component: ProductDetail, canActivate: [authGuard]
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
        component: TransferDetailComponent, canActivate: [authGuard]
      }
  
    ]
  },
  { path: '', redirectTo: '/home', pathMatch: 'full'},

];

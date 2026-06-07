import { RenderMode, ServerRoute } from '@angular/ssr';
import { Transfers } from './pages/transfers/transfers';

export const serverRoutes: ServerRoute[] = [
  { path: 'dashboard', renderMode: RenderMode.Server },
  { path: 'whatsapp-manual', renderMode: RenderMode.Server },
  { path: 'home', renderMode: RenderMode.Server },
  { path: 'transfers', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Server },
  { path: '', renderMode: RenderMode.Server },

  { path: 'transfers/detail/:id', renderMode: RenderMode.Server },
  { path: 'new-transfer/product/:id', renderMode: RenderMode.Server },
  { path: ':categoria', renderMode: RenderMode.Server },
  { path: ':categoria/:marca', renderMode: RenderMode.Server },
  { path: ':categoria/:marca/:modelo', renderMode: RenderMode.Server },
  { path: 'success/:id', renderMode: RenderMode.Server },
  { path: 'producto/:stockid/:slug', renderMode: RenderMode.Server },
  { path: 'producto/:stockid', renderMode: RenderMode.Server },
  { path: 'terminos', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
   {
    path: 'customers/:debtorNo/branches/new',
    renderMode: RenderMode.Client
  },
  {
    path: 'customers/:debtorNo/branches/:branchCode/edit',
    renderMode: RenderMode.Client
  },
  {
    path: 'customers/:debtorNo',
    renderMode: RenderMode.Client
  }
];
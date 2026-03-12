import { RenderMode, ServerRoute } from '@angular/ssr';
import { Transfers } from './pages/transfers/transfers';

export const serverRoutes: ServerRoute[] = [
  { path: 'dashboard', renderMode: RenderMode.Server },
  { path: 'home', renderMode: RenderMode.Server },
  { path: 'transfers', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Server },
  { path: '', renderMode: RenderMode.Server },

  { path: 'transfers/detail/:id', renderMode: RenderMode.Server },
  { path: 'new-transfer/product/:id', renderMode: RenderMode.Server },

  // 🟩 RUTAS SEO-FRIENDLY (coinciden con el Router)
  { path: ':categoria', renderMode: RenderMode.Server },
  { path: ':categoria/:marca', renderMode: RenderMode.Server },
  { path: ':categoria/:marca/:modelo', renderMode: RenderMode.Server },

  // 🛒 success
  { path: 'success/:id', renderMode: RenderMode.Server },

  // fallback
  { path: '**', renderMode: RenderMode.Prerender }
];
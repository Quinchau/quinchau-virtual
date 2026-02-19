// src/app/interceptors/auth.interceptor.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { REQUEST } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ManagerState } from './manager-state';

interface ServerRequest {
  headers: { get: (name: string) => string | null };
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const state = inject(ManagerState);
  
  const isServer = isPlatformServer(platformId);
  const tag = isServer ? '🚀 [SSR-INT]' : '🌐 [BROWSER-INT]';
  
  let cookieString = '';

  // =============================================
  // 1. OBTENER COOKIES SEGÚN PLATAFORMA
  // =============================================
  if (isServer) {
    const serverRequest = inject(REQUEST, { optional: true }) as ServerRequest | null;
    cookieString = serverRequest?.headers?.get('cookie') || '';
  } else {
    cookieString = document.cookie;
  }

  // =============================================
  // 2. EXTRAER TOKEN (SOLO LO NECESARIO)
  // =============================================
  const token = extractFromCookie(cookieString, 'auth_token');
  
  console.log(`${tag} 🔍 Analizando: ${req.url}`);
  console.log(`${tag}   🍪 Token: ${token ? 'presente' : 'ausente'}`);

  // =============================================
  // 3. CONSTRUIR HEADERS (SOLO TOKEN)
  // =============================================
  let headers: { [name: string]: string } = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`${tag} 📤 Enviando token`);
  }

  // NOTA: NO enviamos x-guest-id porque la cookie NO es httpOnly
  // El navegador la enviará automáticamente con cada petición
  // y ManagerState la leerá directamente desde document.cookie

  // =============================================
  // 4. CLONAR PETICIÓN
  // =============================================
  const cloned = req.clone({ 
    setHeaders: headers,
    // Importante para cookies cross-origin si es necesario
    withCredentials: true 
  });

  // =============================================
  // 5. MANEJO DE ERRORES (SOLO 401)
  // =============================================
  return next(cloned).pipe(
    catchError((error) => {
      // Solo manejar errores en el navegador
      if (!isServer && error.status === 401) {
        const currentUrl = router.url;
        
        // Rutas públicas que no deben redirigir
        const publicRoutes = ['/home', '/', '/login', '/register', '/productos'];
        const isPublicRoute = publicRoutes.some(route => currentUrl.includes(route));
        
        if (isPublicRoute) {
          console.log(`${tag} ℹ️ Error 401 ignorado en ruta pública: ${currentUrl}`);
          return throwError(() => error);
        }
        
        console.log(`${tag} 🔐 Error 401 - Redirigiendo a login`);
        
        // Limpiar token (la cookie no httpOnly se puede eliminar)
        document.cookie = 'auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        
        router.navigate(['/login'], { 
          queryParams: { returnUrl: currentUrl } 
        });
      }
      
      return throwError(() => error);
    })
  );
};

/**
 * FUNCIÓN AUXILIAR PARA EXTRAER COOKIES
 */
function extractFromCookie(cookieString: string, key: string): string | null {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(?:^|;)\\s*${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}
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
  const tag = isServer ? '' : '';
  let cookieString = '';

  if (isServer) {
    const serverRequest = inject(REQUEST, { optional: true }) as ServerRequest | null;
    cookieString = serverRequest?.headers?.get('cookie') || '';
  } else {
    cookieString = document.cookie;
  }

  const allCookies = cookieString.split(';').map(c => c.trim()).filter(c => c);

  const userToken = extractFromCookie(cookieString, 'auth_token');
  const guestToken = extractFromCookie(cookieString, 'auth');

  // Priorizar token de usuario sobre visitante
  const token = userToken || guestToken;
  const tokenType = userToken ? 'usuario' : (guestToken ? 'visitante' : 'ninguno');
  
  if (userToken && guestToken) {
  }

  let headers: { [name: string]: string } = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    
  } else {
    console.log(`${tag} ⚠️ No se envía token en header Authorization`);
  }

  

  const cloned = req.clone({ 
    setHeaders: headers,
    withCredentials: true // Importante para enviar/recibir cookies
  });

  return next(cloned).pipe(
    catchError((error) => {
      if (!isServer && error.status === 401) {
        const currentUrl = router.url;
        
        const publicRoutes = ['/home', '/', '/login', '/register', '/productos'];
        const isPublicRoute = publicRoutes.some(route => currentUrl.includes(route));
        
        if (isPublicRoute) {
          console.log(`${tag} ℹ️ Error 401 ignorado en ruta pública: ${currentUrl}`);
          return throwError(() => error);
        }
        document.cookie = 'auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';

        router.navigate(['/login'], { 
          queryParams: { returnUrl: currentUrl } 
        });
      }
      
      return throwError(() => error);
    })
  );
};

function extractFromCookie(cookieString: string, key: string): string | null {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(?:^|;)\\s*${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}
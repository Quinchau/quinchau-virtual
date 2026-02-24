import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { REQUEST } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, tap } from 'rxjs';
import { ManagerState } from './manager-state';
import { AuthService } from '../services/auth'; // Asegura la ruta correcta

interface ServerRequest {
  headers: { get: (name: string) => string | null };
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const state = inject(ManagerState);
  const authService = inject(AuthService); // Inyectamos para poder reportar la identidad encontrada
  
  const isServer = isPlatformServer(platformId);
  const tag = isServer ? '[Server]' : '[Browser]';
  let cookieString = '';

  if (isServer) {
    const serverRequest = inject(REQUEST, { optional: true }) as ServerRequest | null;
    cookieString = serverRequest?.headers?.get('cookie') || '';
  } else {
    cookieString = document.cookie;
  }

  const userToken = extractFromCookie(cookieString, 'auth_token');
  const guestToken = extractFromCookie(cookieString, 'auth');
  const token = userToken || guestToken;

  let headers: { [name: string]: string } = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({ 
    setHeaders: headers,
    withCredentials: true 
  });

  return next(cloned).pipe(
    tap(event => {
      if (event instanceof HttpResponse && !isServer) {
        const body = event.body as any;
        if (body && body.identidad && body.identidad.token) {
          authService.handleIdentityResponse(body);
        }
      }
    }),
    catchError((error) => {
      if (!isServer && error.status === 401) {
        const currentUrl = router.url;
        const publicRoutes = ['/home', '/', '/login', '/register', '/productos'];
        const isPublicRoute = publicRoutes.some(route => currentUrl.includes(route));
        
        if (isPublicRoute) return throwError(() => error);

        // Limpieza de tokens caducados
        document.cookie = 'auth_token=; Path=/; Max-Age=0;';
        document.cookie = 'auth=; Path=/; Max-Age=0;';

        router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
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
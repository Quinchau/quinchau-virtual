import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { REQUEST } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

interface ServerRequest {
  headers: {
    get: (name: string) => string | null;
  };
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  let token: string | null = null;

  if (isPlatformServer(platformId)) {
    const serverRequest = inject(REQUEST, { optional: true }) as ServerRequest | null;
    const cookieHeader = serverRequest?.headers?.get('cookie') || '';
    token = extractTokenFromCookie(cookieHeader);
  }

  if (isPlatformBrowser(platformId)) {
    token = extractTokenFromCookie(document.cookie);
  }

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
  catchError((error) => {
    if (isPlatformBrowser(platformId) && error.status === 401) {
      
      const currentUrl = router.url;

      if (currentUrl.includes('/home') || currentUrl === '/') {
        console.warn('⚠️ Sesión invitada en Home. Manteniendo usuario en página pública.');
        return throwError(() => error);
      }

      // 3. Si no es home, entonces sí protegemos y redirigimos
      console.warn('🔐 Acceso denegado en ruta protegida. Redirigiendo...');
      document.cookie = 'auth_token=; Path=/; Max-Age=0;';
      router.navigate(['/login']);
    }
    return throwError(() => error);
  })
);
};

function extractTokenFromCookie(cookieString: string): string | null {
  const match = cookieString.match(/(?:^|;)\s*auth_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
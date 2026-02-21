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

  if (isServer) {
    const serverRequest = inject(REQUEST, { optional: true }) as ServerRequest | null;
    cookieString = serverRequest?.headers?.get('cookie') || '';
  } else {
    cookieString = document.cookie;
  }

  // ============================================
  // DEBUG: VER TODAS LAS COOKIES CRUDAS
  // ============================================
  console.log(`${tag} 📦 COOKIES CRUDAS ENVIADAS:`, cookieString);
  console.log(`${tag} 📦 ¿Contiene auth=?`, cookieString.includes('auth='));
  console.log(`${tag} 📦 ¿Contiene auth_token=?`, cookieString.includes('auth_token='));
  
  // Listar todas las cookies individualmente
  const allCookies = cookieString.split(';').map(c => c.trim()).filter(c => c);
  console.log(`${tag} 📦 Lista de cookies:`, allCookies);

  // ============================================
  // BUSCAR PRIMERO TOKEN DE USUARIO, LUEGO DE VISITANTE
  // ============================================
  const userToken = extractFromCookie(cookieString, 'auth_token');
  const guestToken = extractFromCookie(cookieString, 'auth');
  
  // DEBUG: Mostrar valores exactos encontrados
  console.log(`${tag} 🔍 Valor auth_token encontrado:`, userToken ? userToken.substring(0, 15) + '...' : 'null');
  console.log(`${tag} 🔍 Valor auth encontrado:`, guestToken ? guestToken.substring(0, 15) + '...' : 'null');
  
  // Priorizar token de usuario sobre visitante
  const token = userToken || guestToken;
  const tokenType = userToken ? 'usuario' : (guestToken ? 'visitante' : 'ninguno');
  
  console.log(`${tag} 🔍 Analizando: ${req.url}`);
  console.log(`${tag}   🍪 Cookies presentes:`, {
    auth_token: userToken ? '✓' : '✗',
    auth: guestToken ? '✓' : '✗'
  });
  console.log(`${tag}   🍪 Token usado: ${tokenType}${token ? ' (' + token.substring(0, 15) + '...)' : ''}`);

  // ============================================
  // VERIFICAR COINCIDENCIA DE TOKENS
  // ============================================
  if (userToken && guestToken) {
    console.log(`${tag} ⚠️ AMBAS COOKIES PRESENTES - Priorizando auth_token`);
  }

  let headers: { [name: string]: string } = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`${tag} 📤 Enviando token de ${tokenType} en header Authorization`);
  } else {
    console.log(`${tag} ⚠️ No se envía token en header Authorization`);
  }

  // ============================================
  // DEBUG: MOSTRAR HEADERS FINALES
  // ============================================
  console.log(`${tag} 📤 Headers finales:`, {
    Authorization: headers['Authorization'] ? 'Bearer ' + headers['Authorization'].substring(0, 20) + '...' : 'ninguno',
    withCredentials: true
  });

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
        
        console.log(`${tag} 🔐 Error 401 - Redirigiendo a login`);
        
        // DEBUG: Mostrar qué cookies se limpian
        console.log(`${tag} 🧹 Limpiando cookies por error 401`);
        
        // Limpiar ambas cookies en caso de error 401
        document.cookie = 'auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'auth=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        
        // Verificar que se limpiaron
        console.log(`${tag} 🍪 Cookies después de limpiar:`, document.cookie);
        
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
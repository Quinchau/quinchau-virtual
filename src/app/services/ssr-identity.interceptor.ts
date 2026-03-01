// src/app/interceptors/ssr-identity.interceptor.ts
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { map, tap } from 'rxjs';

export const ssrIdentityInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);


  return next(req).pipe(  // ← Usar req original, NO transformado
    map(event => {
      // ✅ Solo transformar la RESPUESTA para el cliente
      if (isServer && event instanceof HttpResponse) {
        if (event.url?.includes('quinchau-php-1')) {
          // Transformar URL en la respuesta (para el ng-state)
          const publicUrl = event.url.replace(
            'http://quinchau-php-1', 
            'https://quinchau.com'
          );
          return event.clone({ url: publicUrl });
        }
      }
      return event;
    })
  );
};
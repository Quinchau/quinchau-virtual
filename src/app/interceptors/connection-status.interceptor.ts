// src/app/interceptors/connection-status.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, finalize, throwError } from 'rxjs';
import { ConnectionStatus } from '../services/connection-status';

const EXCLUDED_PATTERNS = [
  '/api/stock/images',
  '/voucher',
  '/shipping-doc',
  '/extra-images',
];

export const connectionStatusInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return next(req);

  const isExcluded = EXCLUDED_PATTERNS.some(p => req.url.includes(p));
  if (isExcluded) return next(req);

  const conn = inject(ConnectionStatus);
  let noNetwork = false;
  conn.startRequest();

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // status 0 = la request ni llegó a salir / no hubo respuesta del servidor (típico de sin red)
      if (err.status === 0) noNetwork = true;
      return throwError(() => err);
    }),
    finalize(() => conn.endRequest(noNetwork))
  );
};
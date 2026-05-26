import { 
  ApplicationConfig, 
  provideBrowserGlobalErrorListeners, 
  provideZonelessChangeDetection, 
  importProvidersFrom, 
  isDevMode
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { 
  provideClientHydration, 
  withEventReplay, 
  withHttpTransferCacheOptions 
} from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor 
      ]) 
    ),

    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includeRequestsWithAuthHeaders: true,
        includeHeaders: ['X-Cart-Count']
      })
    ),

    provideRouter(
      routes,
      withComponentInputBinding()
    ),

    importProvidersFrom(ReactiveFormsModule),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ]
};
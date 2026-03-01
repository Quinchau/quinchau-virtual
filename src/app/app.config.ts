import { 
  ApplicationConfig, 
  provideBrowserGlobalErrorListeners, 
  provideZonelessChangeDetection, 
  importProvidersFrom 
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
        includeRequestsWithAuthHeaders: true
      })
    ),

    provideRouter(
      routes,
      withComponentInputBinding()
    ),

    importProvidersFrom(ReactiveFormsModule)
  ]
};
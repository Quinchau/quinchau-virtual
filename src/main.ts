import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

if (environment.production) {
  console.log('🚀 CONFIGURACIÓN: [PRODUCCIÓN] detectada en el Server Bundle');
  console.log('📡 API URL SERVER:', environment.apiUrlServer);
} else {
  console.log('⚠️ CONFIGURACIÓN: [DESARROLLO] detectada en el Server Bundle');
  console.log('📡 API URL SERVER:', environment.apiUrlServer);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

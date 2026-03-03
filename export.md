# Project Structure

```
public/
  icons/
    icon-72x72.png
    icon-96x96.png
    icon-128x128.png
    icon-144x144.png
    icon-152x152.png
    icon-192x192.png
    icon-384x384.png
    icon-512x512.png
  favicon.ico
  googleca0fa02352c61ccd.html
  manifest.webmanifest
src/
  app/
    app/
    components/
      header/
        header.html
        header.ts
      search-box/
        search-box.html
        search-box.ts
      success-order/
        success-order.html
        success-order.ts
    data/
      transfer-actions.ts
    guards/
      admin.guard.ts
      auth-guard.ts
    models/
      cart-checkout.models.ts
      transfer.model.ts
    pages/
      category/
        category.html
        category.ts
      checkout/
        checkout.html
        checkout.ts
      dashboard/
        dashboard.html
        dashboard.ts
      exe-order/
        exe-order.html
        exe-order.ts
      home/
        home.html
        home.ts
      login/
        login.html
        login.ts
      newtransfer/
        newtransfer.html
        newtransfer.ts
      product-detail/
        product-detail.html
        product-detail.ts
      product-order/
        product-order.html
        product-order.ts
      transfer-detail/
        transfer-detail.html
        transfer-detail.ts
      transfers/
        transfers.html
        transfers.ts
    services/
      auth.interceptor.ts
      auth.ts
      LayerHistoryService.ts
      manager-apis.ts
      manager-state.ts
      search.service.ts
      ssr-identity.interceptor.ts
    app.config.server.ts
    app.config.ts
    app.css
    app.html
    app.routes.server.ts
    app.routes.ts
    app.ts
  environments/
    environment.prod.ts
    environment.ts
  index.html
  main.server.ts
  main.ts
  server.ts
  styles.css
.editorconfig
.gitignore
.nvmrc
angular.json
datos.md
deploy_2026FEB27.tar.gz
deploy_2026FEB27A.tar.gz
deploy_2026MAR02.tar.gz
deploy_2026MAR02A.tar.gz
endpoints.md
export.md
ngsw-config.json
package-lock.json
package.json
postcss.config.js
README.md
tailwind.config.js
tsconfig.app.json
tsconfig.json
tsconfig.spec.json
```



# Selected Files Content

## src/app/app.config.server.ts

```ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

## src/app/app.config.ts

```ts
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
```

## src/app/app.css

```css

```

## src/app/app.html

```html
<app-header />
<router-outlet />
```

## src/app/app.routes.server.ts

```ts
import { RenderMode, ServerRoute } from '@angular/ssr';
import { Transfers } from './pages/transfers/transfers';

export const serverRoutes: ServerRoute[] = [
  {
  path: 'dashboard',
  renderMode: RenderMode.Server
  },
  {
  path: 'home',
  renderMode: RenderMode.Server
  },
  {
  path: 'transfers',
  renderMode: RenderMode.Server
  },
  {
    path: 'login',
    renderMode: RenderMode.Server
  },
  {
    path: '',
    renderMode: RenderMode.Server
  },
  {
    path: 'transfers/detail/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'new-transfer/product/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'producto/:slugId',
    renderMode: RenderMode.Server
  },
  {
  path: 'success/:id',
  renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
```

## src/app/app.routes.ts

```ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Home } from './pages/home/home';
import { TransferDetailComponent } from './pages/transfer-detail/transfer-detail';
import { authGuard } from './guards/auth-guard';
import { NewTransferComponent } from './pages/newtransfer/newtransfer';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Transfers } from './pages/transfers/transfers';
import { adminGuard } from './guards/admin.guard';
import { ProductOrder } from './pages/product-order/product-order';
import { CartComponent } from './pages/checkout/checkout';

export const routes: Routes = [
{ path: 'producto/:slugId', component: ProductOrder },
{ path: 'login', component: LoginComponent },
{ path: 'home', component: Home },
{ path: 'category', 
    loadComponent: () => import('./pages/category/category').then(m => m.Category) 
  },
{ path: 'checkout', component: CartComponent },
{
  path: 'success/:id',
  loadComponent: () =>
    import('./components/success-order/success-order').then(m => m.SuccessOrder)
},

{ path: 'dashboard',
  component: Dashboard,canActivate: [adminGuard] },
{ path: 'new-transfer', component: NewTransferComponent, canActivate: [authGuard],
  children: [
      {
        path: 'product/:id',
        component: ProductDetail, canActivate: [authGuard]
      }
  
    ]
 },
{
    path: 'transfers',
    component: Transfers,
    canActivate: [authGuard],
    children: [
      {
        path: 'detail/:id',
        component: TransferDetailComponent, canActivate: [authGuard]
      }
  
    ]
  },
  { path: '', redirectTo: '/home', pathMatch: 'full'},

];
```

## src/app/app.ts

```ts
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('quinchau-virtual');
}
```

## angular.json

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "quinchau_virtual": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:class": {
          "skipTests": true
        },
        "@schematics/angular:component": {
          "skipTests": true
        },
        "@schematics/angular:directive": {
          "skipTests": true
        },
        "@schematics/angular:guard": {
          "skipTests": true
        },
        "@schematics/angular:interceptor": {
          "skipTests": true
        },
        "@schematics/angular:pipe": {
          "skipTests": true
        },
        "@schematics/angular:resolver": {
          "skipTests": true
        },
        "@schematics/angular:service": {
          "skipTests": true
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/main.ts",
            "polyfills": [
              ],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "src/styles.css"
            ],
            "server": "src/main.server.ts",
            "outputMode": "server",
            "ssr": {
              "entry": "src/server.ts"
            }
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                }
              ],
              "outputHashing": "all",
              "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ]
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "quinchau_virtual:build:production"
            },
            "development": {
              "buildTarget": "quinchau_virtual:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "extract-i18n": {
          "builder": "@angular/build:extract-i18n"
        },
        "test": {
          "builder": "@angular/build:karma",
          "options": {
            "polyfills": [
              
            ],
            "tsConfig": "tsconfig.spec.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "src/styles.css"
            ]
          }
        }
      }
    }
  },
  "cli": {
    "analytics": false
  }
}
```

## package.json

```json
{
  "name": "quinchau-virtual",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 0.0.0.0 --port 4200",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "serve:ssr": "node dist/quinchau_virtual/server/server.mjs"
  },
  "prettier": {
    "printWidth": 100,
    "singleQuote": true,
    "overrides": [
      {
        "files": "*.html",
        "options": {
          "parser": "angular"
        }
      }
    ]
  },
  "private": true,
  "dependencies": {
    "@angular/common": "^21.1.4",
    "@angular/compiler": "^21.1.4",
    "@angular/core": "^21.1.4",
    "@angular/forms": "^21.1.4",
    "@angular/platform-browser": "^21.1.4",
    "@angular/platform-server": "^21.1.4",
    "@angular/router": "^21.1.4",
    "@angular/ssr": "^21.1.4",
    "baseline-browser-mapping": "^2.9.19",
    "cookie-parser": "^1.4.7",
    "express": "^5.1.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "uuid": "^13.0.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular/build": "^21.1.4",
    "@angular/cli": "^21.1.4",
    "@angular/compiler-cli": "^21.1.4",
    "@types/cookie-parser": "^1.4.10",
    "@types/express": "^5.0.1",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^20.17.19",
    "@types/uuid": "^10.0.0",
    "autoprefixer": "^10.4.20",
    "jasmine-core": "~5.9.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "~5.9.2"
  }
}
```


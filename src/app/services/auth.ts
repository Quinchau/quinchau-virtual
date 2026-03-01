import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ManagerState } from './manager-state';
import { Router } from '@angular/router';
import { User } from '../models/transfer.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrlBrowser}/login.php`;
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private managerState = inject(ManagerState);
  private router = inject(Router);

  /**
   * Procesa la identidad del backend. Actualiza cookies, contador y datos de usuario.
   * La lógica garantiza que el contador se actualice siempre, haya token o no.
   */
  handleIdentityResponse(response: any): void {
    console.log('[Auth] Procesando identidad...');
    if (!isPlatformBrowser(this.platformId) || !response?.identidad) return;

    const { token, tipo, nombre, cantidad_referencias, payload } = response.identidad;

    // 1. Gestión de Cookie: Solo si recibimos un token nuevo
    if (token) {
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      this.document.cookie = `auth_token=${token}; Path=/; Max-Age=${thirtyDaysInSeconds}; SameSite=Lax`;
    }

 
    if (tipo === 'usuario' && response.datos_usuario) {
      const userData: User = {
        realname: response.datos_usuario.username || nombre,
        defaultlocation: response.datos_usuario.defaultlocation,
        fullaccess: Number(response.datos_usuario.fullaccess || 0)
      };
      this.managerState.setUserData(userData);
    } else if (tipo === 'visitante' || tipo === 'visitante_nuevo') {
      this.managerState.setUserData(null);
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
      tap(response => this.handleIdentityResponse(response))
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.cookie = `auth_token=; Path=/; Max-Age=0`;
      localStorage.removeItem('user_data');
      this.managerState.setUserData(null);
      this.router.navigate(['/home']);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCookie('auth_token');
  }

  private getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const match = this.document.cookie.match(new RegExp(`(?:^|;)\\s*${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
}
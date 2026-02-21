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
    private apiUrl = `${environment.apiUrl}/login.php`; 
    private platformId = inject(PLATFORM_ID);
    private document = inject(DOCUMENT);
    private managerState = inject(ManagerState);
    private router = inject(Router);

    private getCookie(name: string): string | null {
        if (!isPlatformBrowser(this.platformId)) {
             return null;
        }
        
        const cookieString = this.document.cookie;
        
        if (!cookieString) {
            return null;
        }
        
        const cookies = cookieString.split(';');
        for (const cookie of cookies) {
            const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
            
            if (cookieName === name) {
                const cookieValue = cookieValueParts.join('=');
                return decodeURIComponent(cookieValue);
            }
        }
        
        return null;
    }

    isLoggedIn(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
        return false;
    }
    
    const token = this.getCookie('auth_token');
    
    const hasToken = !!token;
    return hasToken;
}

   login(credentials: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, credentials).pipe(
        tap((response) => {
            if (isPlatformBrowser(this.platformId) && response.identidad?.token) {
                // 1. ✅ Token está en response.identidad.token
                const token = response.identidad.token;
                const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
                this.document.cookie = `auth_token=${token}; Path=/; Max-Age=${thirtyDaysInSeconds}; SameSite=Lax`;
                
                // 2. ✅ Datos de usuario están en response.datos_usuario
                const userData: User = {
                    realname: response.datos_usuario?.username || response.identidad?.nombre,
                    defaultlocation: response.datos_usuario?.defaultlocation,
                    fullaccess: Number(response.datos_usuario?.fullaccess || 0)
                };
                
                // 3. Sincronización del Estado Global
                this.managerState.setUserData(userData);
                
                console.log('✅ Login exitoso - Usuario:', response.identidad.nombre);
            }
        })
    );
}

    logout(): void {
    if (isPlatformBrowser(this.platformId)) {
        // 1. Limpiar persistencia
        this.document.cookie = `auth_token=; Path=/; Max-Age=0`; 
        localStorage.removeItem('user_data');

        // 2. Notificar al estado global (FUNDAMENTAL PARA SIGNALS)
        this.managerState.setUserData(null); 

        // 3. Redirigir
        this.router.navigate(['/login']);
    }
}
}
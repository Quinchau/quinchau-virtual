import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ManagerState } from './manager-state';
import { Router } from '@angular/router';
import { User } from '../models/transfer.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);
    private apiUrl = 'https://quinchau.com/webmaster2/api-quinchau-virtual/login.php';
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
            if (isPlatformBrowser(this.platformId) && response.token) {
                // 1. Persistencia de la sesión (Cookie)
                const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
                this.document.cookie = `auth_token=${response.token}; Path=/; Max-Age=${thirtyDaysInSeconds}; SameSite=Lax`;

                // 2. Preparación del objeto de usuario con la interfaz completa
                const userData: User = {
                    realname: response.username, // Sincronizado con la respuesta del PHP
                    defaultlocation: response.defaultlocation,
                    fullaccess: Number(response.fullaccess) // Aseguramos que sea numérico
                };

                // 3. Sincronización del Estado Global (Signal)
                this.managerState.setUserData(userData);
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
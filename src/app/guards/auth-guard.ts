import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const authService = inject(AuthService);

    const isBrowser = isPlatformBrowser(platformId);
    if (!isBrowser) {
        return true;
    }

    const isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};  
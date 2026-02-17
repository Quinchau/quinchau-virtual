import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ManagerState } from '../services/manager-state';

export const adminGuard: CanActivateFn = () => {
  const state = inject(ManagerState);
  const router = inject(Router);
  const user = state.currentUser();

  // Lista blanca determinista (8 y 10)
  const ALLOWED_LEVELS = [8, 10];

  if (user && ALLOWED_LEVELS.includes(user.fullaccess)) {
    return true; // Acceso permitido
  }

  // Si no tiene acceso, lo redirigimos al home
  return router.parseUrl('/home');
};
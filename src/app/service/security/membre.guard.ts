import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';

export const membreGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)

  if (auth.role == "ROLE_MEMBRE") {
    return true
  }
  const router = inject(Router);
  return router.parseUrl('/connexion')
};

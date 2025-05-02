import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from './auth.service';

export const managerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService)

  if (auth.role == "ROLE_ADMIN" || auth.role == "ROLE_RESERVATION") {
    return true
  }
  const router = inject(Router);
  return router.parseUrl('/connexion')

};

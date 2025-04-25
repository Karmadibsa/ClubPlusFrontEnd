import {CanActivateFn, Router, UrlTree} from '@angular/router';
import {inject} from '@angular/core';

export const connecteGuard: CanActivateFn = (route, state) => {
const jwt = localStorage.getItem("jwt")

  if (jwt == null) {

    const router: Router = inject(Router);
    return router.parseUrl("/connexion")
  }

  return true;
};

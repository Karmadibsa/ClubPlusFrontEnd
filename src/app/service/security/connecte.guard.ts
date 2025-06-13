import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * @const connecteGuard
 * @description Garde de navigation `CanActivateFn` pour protéger les routes accessibles uniquement aux utilisateurs connectés.
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié.
 *
 * @param route Informations sur la route activée.
 * @param state État futur du routeur.
 * @returns `true` si la navigation est autorisée, `UrlTree` pour une redirection.
 */
export const connecteGuard: CanActivateFn = (route, state) => {
  const jwt = localStorage.getItem("jwt");

  const auth = inject(AuthService);
  const router: Router = inject(Router);

  // Vérifie si l'utilisateur est connecté via le service d'authentification.
  if (auth.connecte) {
    return true; // Autorise l'accès à la route.
  } else {
    // Redirige vers la page de connexion si l'utilisateur n'est pas connecté.
    console.log('connecteGuard: Utilisateur non connecté, redirection vers /connexion.');
    return router.parseUrl("/connexion");
  }
};

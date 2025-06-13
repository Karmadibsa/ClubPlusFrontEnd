/**
 * @const membreGuard
 * @description Garde de navigation pour protéger les routes accessibles uniquement aux utilisateurs
 * ayant le rôle 'ROLE_MEMBRE'. Redirige vers la page de connexion si le rôle est inapproprié.
 *
 * @param route Informations sur la route activée.
 * @param state État futur du routeur.
 * @returns `true` si la navigation est autorisée, `UrlTree` pour une redirection.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const membreGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);

  // Vérifie si le rôle de l'utilisateur est 'ROLE_MEMBRE'.
  if (auth.role === "ROLE_MEMBRE") {
    return true; // Autorise l'accès.
  } else {
    const router = inject(Router);
    console.log(`membreGuard: Accès refusé pour le rôle "${auth.role}". Redirection vers /connexion.`);
    return router.parseUrl('/connexion'); // Redirige vers la page de connexion.
  }
};

/**
 * @const managerGuard
 * @description Garde de navigation pour protéger les routes accessibles uniquement aux utilisateurs
 * ayant un rôle de gestionnaire ('ROLE_ADMIN' ou 'ROLE_RESERVATION').
 * Redirige vers la page de connexion si le rôle est inapproprié.
 *
 * @param route Informations sur la route activée.
 * @param state État futur du routeur.
 * @returns `true` si la navigation est autorisée, `UrlTree` pour une redirection.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const managerGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  console.log('managerGuard - Valeur actuelle de auth.role:', auth.role); // Log pour le débogage.

  // Vérifie si le rôle de l'utilisateur correspond aux rôles de gestionnaire autorisés.
  if (auth.role === "ROLE_ADMIN" || auth.role === "ROLE_RESERVATION") {
    return true; // Autorise l'accès.
  } else {
    const router = inject(Router);
    console.log(`managerGuard: Accès refusé pour le rôle "${auth.role}". Redirection vers /connexion.`);
    return router.parseUrl('/connexion'); // Redirige vers la page de connexion.
  }
};

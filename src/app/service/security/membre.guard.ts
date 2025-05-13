/**
 * Importations nécessaires.
 */
// CanActivateFn: Type de fonction pour les gardes "CanActivate".
// Router: Service Angular pour la navigation.
import { CanActivateFn, Router } from '@angular/router';
// inject: Fonction Angular pour l'injection de dépendances.
import { inject } from '@angular/core';
// AuthService: Votre service d'authentification, pour vérifier le rôle de l'utilisateur.
import { AuthService } from './auth.service'; // Assurez-vous que le chemin est correct.

/**
 * @const membreGuard
 * @description Un garde de navigation (Route Guard) de type `CanActivateFn`.
 * Il est conçu pour protéger les routes qui ne devraient être accessibles qu'aux utilisateurs
 * authentifiés ayant le rôle spécifique de 'ROLE_MEMBRE' (ou l'équivalent que votre backend utilise).
 * Si l'utilisateur n'est pas connecté ou n'a pas ce rôle, il est redirigé vers la page de connexion [1].
 *
 * @param route L'objet `ActivatedRouteSnapshot` de la route que l'utilisateur essaie d'activer.
 * @param state L'objet `RouterStateSnapshot` représentant l'état futur du routeur si la navigation est autorisée.
 *
 * @returns {boolean | UrlTree}
 *          - `true`: Si la navigation vers la route est autorisée (l'utilisateur est un membre).
 *          - `UrlTree`: Si la navigation est refusée et que l'utilisateur doit être redirigé.
 */
export const membreGuard: CanActivateFn = (route, state) => {
  // 1. Injection de l'AuthService.
  //    Permet d'accéder à l'état d'authentification et au rôle de l'utilisateur connecté.
  const auth = inject(AuthService);

  // 2. Vérification du rôle de l'utilisateur.
  //    On vérifie si la propriété `auth.role` (qui est mise à jour par `AuthService`
  //    lors du décodage du JWT) correspond au rôle 'ROLE_MEMBRE'.
  //    IMPORTANT : Assurez-vous que la chaîne "ROLE_MEMBRE" correspond exactement
  //    à ce qui est stocké dans le JWT pour un membre standard et extrait par `AuthService.role`.
  //    Comme discuté précédemment, si votre `AuthService.role` est de type `string | null`
  //    et qu'il stocke la valeur brute du JWT, cette comparaison est correcte.
  if (auth.role === "ROLE_MEMBRE") {
    // 2a. Si l'utilisateur a le rôle 'ROLE_MEMBRE'.
    //     La garde autorise l'accès à la route.
    return true;
  } else {
    // 2b. Si l'utilisateur n'est pas connecté (auquel cas `auth.role` serait `null`)
    //     ou si son rôle n'est pas 'ROLE_MEMBRE'.
    //     La navigation vers la route demandée est refusée.

    // 3. Injection du service Router d'Angular.
    //    Nécessaire pour effectuer la redirection.
    const router = inject(Router);

    // 4. Création d'un UrlTree pour la redirection vers la page de connexion.
    //    Si un utilisateur non-membre ou non connecté tente d'accéder à une page
    //    réservée aux membres, il est redirigé vers '/connexion'.
    console.log(`membreGuard: Accès refusé pour le rôle "${auth.role}". Redirection vers /connexion.`);
    return router.parseUrl('/connexion');
  }
};

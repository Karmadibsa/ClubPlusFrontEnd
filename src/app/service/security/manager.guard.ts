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
 * @const managerGuard
 * @description Un garde de navigation (Route Guard) de type `CanActivateFn`.
 * Il est conçu pour protéger les routes qui ne devraient être accessibles qu'aux utilisateurs
 * ayant un rôle de gestionnaire, tel que 'ROLE_ADMIN' ou 'ROLE_RESERVATION'.
 * Si l'utilisateur n'est pas connecté ou n'a pas le rôle approprié, il est redirigé
 * (dans ce cas, vers la page de connexion, mais pourrait être une page "accès refusé").
 *
 * @param route L'objet `ActivatedRouteSnapshot` de la route que l'utilisateur essaie d'activer.
 * @param state L'objet `RouterStateSnapshot` représentant l'état futur du routeur si la navigation est autorisée.
 *
 * @returns {boolean | UrlTree}
 *          - `true`: Si la navigation vers la route est autorisée (l'utilisateur a le bon rôle).
 *          - `UrlTree`: Si la navigation est refusée et que l'utilisateur doit être redirigé.
 */
export const managerGuard: CanActivateFn = (route, state) => {
  // 1. Injection de l'AuthService.
  //    Permet d'accéder à l'état d'authentification et au rôle de l'utilisateur connecté.
  const auth = inject(AuthService);
  console.log('managerGuard - Valeur actuelle de auth.role:', auth.role); // <--- AJOUTEZ CECI

  // 2. Vérification du rôle de l'utilisateur.
  //    On vérifie si la propriété `auth.role` (qui est mise à jour par `AuthService`
  //    lors du décodage du JWT) correspond à l'un des rôles de gestionnaire autorisés.
  //    NOTE: Les chaînes de caractères pour les rôles ('ROLE_ADMIN', 'ROLE_RESERVATION')
  //    doivent correspondre exactement à ce qui est stocké dans le JWT et extrait par `AuthService`.
  //    Il serait plus robuste d'utiliser une énumération ou des constantes pour les rôles
  //    afin d'éviter les erreurs de frappe (par exemple, si `AuthService.role` utilise `RoleType`).
  if (auth.role === "ROLE_ADMIN" || auth.role === "ROLE_RESERVATION") {
    // 2a. Si l'utilisateur a le rôle 'ROLE_ADMIN' OU 'ROLE_RESERVATION'.
    //     La garde autorise l'accès à la route.
    return true;
  } else {
    // 2b. Si l'utilisateur n'est pas connecté (auquel cas `auth.role` serait `null`)
    //     ou si son rôle n'est pas l'un des rôles de gestionnaire autorisés.
    //     La navigation vers la route demandée est refusée.

    // 3. Injection du service Router d'Angular.
    //    Nécessaire pour effectuer la redirection.
    const router = inject(Router);

    // 4. Création d'un UrlTree pour la redirection vers la page de connexion.
    //    Si un utilisateur non autorisé tente d'accéder à une page de gestion,
    //    il est redirigé vers '/connexion'.
    //    Alternativement, vous pourriez le rediriger vers une page "Accès Refusé" (ex: '/acces-refuse')
    //    si l'utilisateur est connecté mais n'a tout simplement pas les bons droits.
    //    Cela dépend de l'expérience utilisateur souhaitée.
    console.log(`managerGuard: Accès refusé pour le rôle "${auth.role}". Redirection vers /connexion.`);
    return router.parseUrl('/connexion');
  }
};

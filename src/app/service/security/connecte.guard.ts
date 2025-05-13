import { CanActivateFn, Router } from '@angular/router';
// inject: Fonction Angular pour l'injection de dépendances.
import { inject } from '@angular/core';
// AuthService: Votre service d'authentification, pour vérifier l'état de connexion.
import { AuthService } from './auth.service'; // Assurez-vous que le chemin est correct.

/**
 * @const connecteGuard
 * @description Un garde de navigation (Route Guard) de type `CanActivateFn`.
 * Il est conçu pour protéger les routes qui ne devraient être accessibles qu'aux utilisateurs connectés.
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion.
 *
 * @param route L'objet `ActivatedRouteSnapshot` de la route que l'utilisateur essaie d'activer.
 *              Contient des informations sur la route à laquelle on tente d'accéder.
 * @param state L'objet `RouterStateSnapshot` représentant l'état futur du routeur si la navigation est autorisée.
 *
 * @returns {boolean | UrlTree}
 *          - `true`: Si la navigation vers la route est autorisée.
 *          - `UrlTree`: Si la navigation est refusée et que l'utilisateur doit être redirigé.
 *                      `router.parseUrl("/connexion")` crée un UrlTree pour la redirection.
 *          - (Optionnel) Un `Observable<boolean | UrlTree>` ou `Promise<boolean | UrlTree>` si la garde
 *            doit effectuer une vérification asynchrone.
 */
export const connecteGuard: CanActivateFn = (route, state) => {
  // 1. Récupération du JWT depuis le localStorage.
  //    Cette ligne est présente mais son résultat n'est pas directement utilisé pour la décision
  //    dans ce code. La décision se base sur `auth.connecte`.
  //    Cependant, la présence d'un JWT est ce qui permet à `AuthService` (dans son constructeur)
  //    de potentiellement mettre `auth.connecte` à `true` au démarrage de l'application.
  const jwt = localStorage.getItem("jwt"); // Récupère le token

  // 2. Injection de l'AuthService.
  //    `inject(AuthService)` obtient une instance de votre service d'authentification.
  //    C'est grâce à ce service que nous pouvons vérifier l'état de connexion actuel.
  const auth = inject(AuthService);

  // 3. Vérification de l'état de connexion.
  //    `auth.connecte` est une propriété de `AuthService` qui est mise à `true`
  //    si un utilisateur est authentifié (généralement après un appel à `decodeJwt`).
  if (auth.connecte) {
    // 3a. Si l'utilisateur est connecté (`auth.connecte` est true).
    //     La garde autorise l'accès à la route.
    return true;
  } else {
    // 3b. Si l'utilisateur n'est pas connecté (`auth.connecte` est false).
    //     La navigation vers la route demandée est refusée.
    //     L'utilisateur doit être redirigé vers la page de connexion.

    // 4. Injection du service Router d'Angular.
    //    Nécessaire pour effectuer la redirection.
    const router: Router = inject(Router);

    // 5. Création d'un UrlTree pour la redirection.
    //    `router.parseUrl("/connexion")` crée un `UrlTree` qui représente
    //    l'URL "/connexion". Retourner cet `UrlTree` indique au routeur Angular
    //    d'annuler la navigation actuelle et de naviguer vers "/connexion" à la place.
    //    L'utilisateur sera donc redirigé vers la page de connexion.
    console.log('connecteGuard: Utilisateur non connecté, redirection vers /connexion.');
    return router.parseUrl("/connexion");
  }
};

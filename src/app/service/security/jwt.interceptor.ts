/**
 * @const jwtInterceptor
 * @description Intercepteur HTTP fonctionnel Angular qui ajoute automatiquement
 * un header Authorization avec un token JWT (Bearer) à chaque requête HTTP sortante,
 * si un JWT est présent dans le localStorage.
 *
 * Ce mécanisme permet d'authentifier les requêtes auprès du backend sans avoir à
 * ajouter manuellement le token dans chaque appel HTTP.
 *
 * @param req La requête HTTP entrante (HttpRequest).
 * @param next Le gestionnaire suivant dans la chaîne d'intercepteurs (HttpHandler).
 * @returns Un Observable qui émet la réponse HTTP, après avoir potentiellement modifié la requête.
 */
import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Récupération du JWT stocké dans le localStorage.
  //    Le token est supposé avoir été stocké lors de la connexion de l'utilisateur.
  const jwt = localStorage.getItem("jwt");

  // 2. Vérification de la présence du token.
  if (jwt) {
    // 3. Clonage de la requête HTTP originale pour y ajouter/modifier les headers.
    //    Les requêtes Angular HttpRequest sont immuables, donc on doit créer une copie modifiée.
    const clone = req.clone({
      // 4. Ajout du header Authorization avec la valeur "Bearer <token>".
      //    Ce format est la norme pour les tokens JWT dans les headers HTTP.
      setHeaders: { Authorization: "Bearer " + jwt }
    });

    // 5. Passage de la requête modifiée (avec le header JWT) au prochain intercepteur ou au backend.
    return next(clone);
  }

  // 6. Si aucun JWT n'est trouvé, on transmet la requête originale sans modification.
  return next(req);
};

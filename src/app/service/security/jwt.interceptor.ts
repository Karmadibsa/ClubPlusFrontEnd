/**
 * @const jwtInterceptor
 * @description Intercepteur HTTP Angular qui ajoute automatiquement un header Authorization
 * avec un token JWT (Bearer) à chaque requête HTTP sortante, si un JWT est présent dans le localStorage.
 */
import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Récupère le JWT stocké dans le localStorage.
  const jwt = localStorage.getItem("jwt");

  // Si un JWT est trouvé, clone la requête originale pour ajouter le header Authorization.
  if (jwt) {
    const clone = req.clone({
      setHeaders: { Authorization: "Bearer " + jwt }
    });

    // Passe la requête modifiée à la chaîne d'intercepteurs suivante ou au backend.
    return next(clone);
  }

  // Si aucun JWT n'est trouvé, transmet la requête originale sans modification.
  return next(req);
};

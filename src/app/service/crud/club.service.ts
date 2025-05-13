
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environments'; // Chemin vers votre fichier d'environnement
import { Club } from '../../model/club';
import { catchError, tap } from 'rxjs/operators'; // Note: Pour les versions récentes d'Angular/RxJS, l'import peut être directement depuis 'rxjs'.
import { Observable, throwError } from 'rxjs';

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que ClubService est un service fourni au niveau racine de l'application.
 * Angular crée une instance unique (singleton) de ClubService, accessible partout.
 */
@Injectable({
  providedIn: 'root'
})
export class ClubService {
  /**
   * Injection du service HttpClient d'Angular via la fonction `inject`.
   * `this.http` sera utilisé pour effectuer les requêtes HTTP.
   */
  private http = inject(HttpClient);

  /**
   * URL de base de l'API pour les fonctionnalités liées aux clubs.
   * Construite à partir de `environment.apiUrl` pour une configuration flexible.
   */
  private apiUrl = `${environment.apiUrl}/clubs`; // Le endpoint de base pour les clubs est /api/clubs

  /**
   * Récupère les détails d'un club spécifique en utilisant son ID.
   * Effectue une requête GET vers l'endpoint /api/clubs/{clubId}.
   * @param clubId L'identifiant numérique unique du club à récupérer.
   * @returns Un `Observable` qui émettra un objet `Club` contenant les détails du club.
   */
  getClubDetails(clubId: number): Observable<Club> {
    const url = `${this.apiUrl}/${clubId}`; // Construit l'URL spécifique pour ce club.

    return this.http.get<Club>(url).pipe(
      // `tap` est utilisé pour un effet de bord : logger les données reçues sans les modifier.
      tap(data => console.log(`ClubService: Données reçues pour club ${clubId}:`, data)),
      // `catchError` intercepte les erreurs et délègue leur gestion à `this.handleError`.
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour les informations d'un club existant.
   * Effectue une requête PUT vers l'endpoint /api/clubs/{clubId} [1].
   * La méthode PUT implique généralement le remplacement complet de la ressource ou une mise à jour
   * où tous les champs attendus sont fournis.
   * @param clubId L'identifiant numérique du club à mettre à jour.
   * @param clubData Un objet contenant les champs du club à mettre à jour.
   *                 L'utilisation de `Partial<Club>` offre de la flexibilité, signifiant que
   *                 toutes les propriétés de `Club` sont optionnelles. Cependant, le backend
   *                 doit être capable de gérer cela. Pour une sémantique PUT stricte,
   *                 un objet `Club` complet (sans les champs non modifiables comme `id`) serait attendu.
   * @returns Un `Observable` qui émettra l'objet `Club` mis à jour par le backend.
   */
  updateClub(clubId: number, clubData: Partial<Club>): Observable<Club> {
    const url = `${this.apiUrl}/${clubId}`;

    // Utilisation de this.http.put pour envoyer les données de mise à jour.
    // Le deuxième argument `clubData` est le corps de la requête.
    return this.http.put<Club>(url, clubData).pipe(
      tap(updatedClub => console.log(`ClubService: Club ${clubId} mis à jour (PUT):`, updatedClub)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un club spécifique par son ID.
   * Effectue une requête DELETE vers l'endpoint /api/clubs/{clubId}.
   * La suppression d'un club est une action administrative critique [1].
   * @param id L'identifiant numérique du club à supprimer.
   * @returns Un `Observable<void>` car une opération DELETE réussie ne retourne généralement
   *          pas de contenu (souvent un statut HTTP 204 No Content).
   */
  deleteClub(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`; // Construit l'URL spécifique pour la suppression.
    console.log(`ClubService: Appel DELETE ${url}`);
    // Il est bon d'ajouter le pipe avec `tap` et `catchError` ici aussi pour la cohérence.
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`ClubService: Club ${id} supprimé avec succès`)),
      catchError(this.handleError)
    );
  }

  /**
   * @private handleError
   * Méthode privée pour la gestion centralisée des erreurs HTTP survenues dans ce service.
   * @param error L'objet `HttpErrorResponse` capturé.
   * @returns Un `Observable` qui émet une erreur (`throwError`) avec un message d'erreur formaté.
   *          Ce message est destiné à être utilisé par le code appelant (ex: un composant)
   *          pour informer l'utilisateur ou gérer l'erreur.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !'; // Message par défaut.

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou problème de réseau.
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur renvoyée par le backend (statut HTTP >= 400).
      // `error.error` contient le corps de la réponse d'erreur du backend.
      const backendError = error.error;
      // Tente d'extraire un message significatif du corps de l'erreur.
      const backendMessage = backendError?.message || backendError?.error || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError));
      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    // Log de l'erreur complète dans la console pour les développeurs.
    console.error('ClubService API Error:', errorMessage, error);
    // Renvoie un Observable qui émet immédiatement l'erreur formatée.
    return throwError(() => new Error(errorMessage));
  }
}

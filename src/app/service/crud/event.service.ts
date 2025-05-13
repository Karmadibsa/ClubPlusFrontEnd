import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environments';
import { catchError, tap } from 'rxjs/operators';
import { CreateEventPayload, Evenement, UpdateEventPayload } from '../../model/evenement';
import { EventRatingPayload, Notation } from '../../model/notation';

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que EventService est un service fourni au niveau racine de l'application.
 * Une seule instance sera créée et partagée dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class EventService {
  /**
   * Injection de HttpClient pour effectuer des requêtes HTTP.
   */
  private http = inject(HttpClient);

  /**
   * URL de base pour les appels à l'API concernant les événements.
   */
  private apiUrl = `${environment.apiUrl}/events`;

  /**
   * Récupère les 5 prochains événements actifs pour le club géré par l'utilisateur connecté.
   * Correspond à l'endpoint GET /api/events/managed-club/next.
   * Le backend utilise les informations d'authentification pour déterminer le club géré.
   * @returns Un Observable contenant un tableau d'objets `Evenement`.
   */
  getNextEvents(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/managed-club/next`; // URL complète de l'API.
    console.log('Appel API Events:', url); // Pour le débogage.

    // Effectue la requête GET et spécifie le type de la réponse attendue (Evenement[]).
    return this.http.get<Evenement[]>(url);
    // IMPORTANT: La gestion des erreurs (catchError) est intentionnellement omise ici.
    // Ceci est un exemple où la gestion d'erreur est déléguée au composant qui appelle cette méthode.
    // Cela donne au composant plus de contrôle sur la façon dont l'erreur est gérée et affichée.
    // C'est un choix de conception; d'autres méthodes de ce service utilisent `handleError`.
  }

  /**
   * Crée un nouvel événement avec ses catégories initiales.
   * Correspond à l'endpoint POST /api/events?organisateurId={clubId}.
   * @param clubId L'ID du club organisateur (transmis comme paramètre de requête).
   * @param eventData Un objet de type `CreateEventPayload` contenant les détails de l'événement et de ses catégories.
   * @returns Un Observable qui émettra l'objet `Evenement` créé par le backend.
   */
  createEventWithCategories(clubId: number, eventData: CreateEventPayload): Observable<Evenement> {
    const url = `${this.apiUrl}?organisateurId=${clubId}`; // Ajoute l'ID du club comme paramètre.

    console.log(`EventService: Appel POST à ${url} avec les données:`, eventData);

    return this.http.post<Evenement>(url, eventData).pipe( // Envoie la requête POST avec les données
      tap(createdEvent => console.log('EventService: Événement créé avec succès:', createdEvent)), // Log en cas de succès
      catchError(this.handleError) // Gestion des erreurs avec la méthode privée handleError
    );
    // Note: le corps de la requête (eventData) sera automatiquement sérialisé en JSON par HttpClient.
  }

  /**
   * Met à jour un événement existant et réconcilie ses catégories.
   * Correspond à l'endpoint PUT /api/events/{eventId}/full.
   * @param eventId L'ID de l'événement à mettre à jour (transmis dans l'URL).
   * @param eventData Un objet de type `UpdateEventPayload` contenant les détails mis à jour de l'événement
   *                  et la liste complète des catégories (avec les IDs pour les catégories existantes et `null` pour les nouvelles).
   * @returns Un Observable qui émettra l'objet `Evenement` mis à jour par le backend.
   */
  updateEventWithCategories(eventId: number, eventData: UpdateEventPayload): Observable<Evenement> {
    const url = `${this.apiUrl}/${eventId}/full`; // L'ID de l'événement est inclus dans l'URL
    console.log(`EventService: Appel PUT à ${url} avec les données:`, eventData);

    return this.http.put<Evenement>(url, eventData).pipe( // Envoie la requête PUT avec les données
      tap(updatedEvent => console.log('EventService: Événement mis à jour avec succès:', updatedEvent)), // Log en cas de succès
      catchError(this.handleError) // Gestion des erreurs avec la méthode privée handleError
    );
  }

  /**
   * Effectue une suppression logique (soft delete) d'un événement.
   * Correspond à l'endpoint DELETE /api/events/{eventId}.
   * Marque l'événement comme inactif au lieu de le supprimer physiquement de la base de données.
   * @param eventId L'ID de l'événement à désactiver.
   * @returns Un Observable<void> car l'API ne renvoie généralement rien en cas de succès (204 No Content).
   */
  softDeleteEvent(eventId: number): Observable<void> {
    const url = `${this.apiUrl}/${eventId}`; // Construit l'URL ex: http://localhost:8080/api/events/11
    console.log(`Appel API Soft Delete: DELETE ${url}`);

    return this.http.delete<void>(url).pipe( // Envoie la requête DELETE
      tap(() => console.log(`EventService: Événement avec ID ${eventId} supprimé logiquement.`)), // Log en cas de succès
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  /**
   * Récupère tous les événements (actifs et inactifs).
   * Appelle l'endpoint GET /api/events.
   * @returns Un Observable contenant un tableau d'objets `Evenement`.
   */
  getAllEvents(): Observable<Evenement[]> {
    console.log('EventService: Appel GET pour tous les événements (getAllEvents)');
    return this.http.get<Evenement[]>(this.apiUrl).pipe(
      catchError(this.handleError) // Gestion d'erreur générique du service
    );
  }

  /**
   * Récupère tous les événements actifs et inclut les informations d'amitié.
   * Appelle l'endpoint GET /api/events/withfriend?status=active.
   * @returns Un Observable contenant un tableau d'objets `Evenement`.
   */
  getAllEventsWithFriend(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/withfriend?status=active`; // Ajout du paramètre de requête "status"
    console.log(`EventService: Appel GET pour tous les événements avec friend (getAllEventsWithFriend) à l'URL : ${url}`);

    return this.http.get<Evenement[]>(url).pipe(
      catchError(this.handleError) // Gestion d'erreur générique du service
    );
  }

  /**
   * Récupère les événements auxquels l'utilisateur a participé (statut UTILISE)
   * et pour lesquels il n'a pas encore soumis de notation.
   * Correspond à l'endpoint GET /api/events/notations/me/participated-events-unrated.
   * @returns Un Observable contenant un tableau d'objets `Evenement`.
   */
  getUnratedParticipatedEvents(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/notations/me/participated-events-unrated`; // Utilise l'URL backend finale confirmée
    console.log(`EventService: Appel GET ${url}`);

    return this.http.get<Evenement[]>(url).pipe(
      tap(events => console.log('EventService: Événements non notés reçus', events)), // Log les événements reçus
      catchError(this.handleError) // Gère les erreurs éventuelles
    );
  }

  /**
   * Soumet la notation pour un événement spécifique.
   * Correspond à l'endpoint POST /api/events/{eventId}/notations.
   * @param eventId L'ID de l'événement pour lequel la notation est soumise.
   * @param rating Un objet de type `EventRatingPayload` contenant les notes pour les différents critères.
   * @returns Un Observable qui émettra l'objet `Notation` créé par le backend.
   */
  submitEventRating(eventId: number, rating: EventRatingPayload): Observable<Notation> {
    const url = `${this.apiUrl}/${eventId}/notations`; // Ajoute l'ID de l'événement à l'URL
    console.log(`EventService: Appel POST ${url} avec notation`, rating);

    return this.http.post<Notation>(url, rating).pipe( // Envoie la requête POST
      tap(response => console.log('EventService: Notation créée reçue', response)), // Log la réponse reçue
      catchError(this.handleError) // Gère les erreurs
    );
  }

  /**
   * @private handleError
   * Méthode privée pour la gestion centralisée des erreurs HTTP dans ce service.
   * Standardise le traitement des erreurs pour une meilleure maintenabilité.
   * @param error L'objet `HttpErrorResponse` contenant les détails de l'erreur.
   * @returns Un Observable qui émet une erreur, permettant au composant appelant de gérer l'échec.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue lors de l\'opération sur l\'événement.'; // Message par défaut
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`; // Message spécifique pour ce type d'erreur
    } else {
      // Le backend a retourné un code d'échec.
      errorMessage = `Erreur serveur ${error.status}: ${error.error?.message || error.message}`; // Tente de récupérer le message du backend
    }
    console.error(errorMessage, error); // Log l'erreur dans la console pour le débogage
    // Retourne une erreur observable pour que le composant puisse réagir
    return throwError(() => new Error(errorMessage));
  }
}

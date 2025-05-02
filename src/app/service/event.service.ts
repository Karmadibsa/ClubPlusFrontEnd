import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {environment} from '../../environments/environments';
import {catchError, tap} from 'rxjs/operators';
import {CreateEventPayload, Evenement, UpdateEventPayload} from '../model/evenement';
import {EventRatingPayload, Notation} from '../model/notation';


@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  // Utilise l'URL de base de l'API définie dans les fichiers d'environnement
  private apiUrl = `${environment.apiUrl}/events`;

  /**
   * Récupère les 5 prochains événements actifs pour le club géré par l'utilisateur connecté.
   * Appelle GET /api/events/managed-club/next-five
   * @returns Un Observable contenant un tableau d'Event.
   */
  getNextEvents(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/clubs/next-event`;
    console.log('Appel API Events:', url); // Pour le débogage
    // Le backend détermine le club via l'utilisateur authentifié
    return this.http.get<Evenement[]>(url);
    // Note: La gestion des erreurs (catchError) est faite dans le composant pour cet exemple.
  }

  /**
   * Crée un nouvel événement avec ses catégories initiales.
   * @param clubId L'ID du club organisateur.
   * @param eventData Le DTO contenant les détails de l'événement et ses catégories.
   * @returns Observable de l'événement créé.
   */
  createEventWithCategories(clubId: number, eventData: CreateEventPayload): Observable<Evenement> { // Accepte le Payload, retourne l'Evenement
    const url = `${this.apiUrl}?organisateurId=${clubId}`;
    return this.http.post<Evenement>(url, eventData).pipe(/* ... */); // Attend un Evenement en retour
  }

  /**
   * Met à jour un événement existant et réconcilie ses catégories.
   * @param eventId L'ID de l'événement à mettre à jour.
   * @param eventData Le DTO contenant les détails mis à jour et la liste finale des catégories.
   * @returns Observable de l'événement mis à jour.
   */
  updateEventWithCategories(eventId: number, eventData: UpdateEventPayload): Observable<Evenement> { // Accepte le Payload, retourne l'Evenement
    const url = `${this.apiUrl}/${eventId}/full`;
    return this.http.put<Evenement>(url, eventData).pipe(/* ... */); // Attend un Evenement en retour
  }

  /**
   * Effectue une suppression logique (soft delete) d'un événement.
   * Appelle l'endpoint DELETE /api/events/{eventId}
   * @param eventId L'ID de l'événement à désactiver.
   * @returns Un Observable<void> car l'API ne renvoie généralement rien (204 No Content) en cas de succès.
   */
  softDeleteEvent(eventId: number): Observable<void> {
    const url = `${this.apiUrl}/${eventId}`; // Construit l'URL ex: http://localhost:8080/api/events/11
    console.log(`Appel API Soft Delete: DELETE ${url}`);

    // Effectue la requête DELETE.
    // HttpClient.delete<void> indique qu'on n'attend pas de corps de réponse en cas de succès.
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError) // Appelle notre fonction de gestion d'erreur en cas d'échec
    );
  }

  //
  // getAllEvents(): Observable<Evenement[]> {
  //   // Construit les paramètres de requête
  //   const params = new HttpParams().set('status', 'all');
  //   // Fait l'appel GET avec les paramètres
  //   return this.http.get<Evenement[]>(this.apiUrl, { params: params }).pipe(
  //     catchError(this.handleError) // Gestion d'erreur générique du service
  //   );
  // }

  getAllEvents(): Observable<Evenement[]> {
    // Construit les paramètres de requête
    // Fait l'appel GET avec les paramètres
    return this.http.get<Evenement[]>(this.apiUrl).pipe(
      catchError(this.handleError) // Gestion d'erreur générique du service
    );
  }

  getAllEventsWithFriend(): Observable<Evenement[]> {
    // Construit les paramètres de requête
    // Fait l'appel GET avec les paramètres
    return this.http.get<Evenement[]>(`${this.apiUrl}/withfriend?status=active`).pipe(
      catchError(this.handleError) // Gestion d'erreur générique du service
    );
  }

  /**
   * Récupère les événements participés (statut UTILISE) non encore notés par l'utilisateur courant.
   * GET /api/events/notations/me/participated-events-unrated
   */
  getUnratedParticipatedEvents(): Observable<Evenement[]> {
    // Utilise l'URL backend finale confirmée
    const url = `${this.apiUrl}/notations/me/participated-events-unrated`;
    console.log(`EventService: Appel GET ${url}`);
    // Pas de HttpParams nécessaires pour ce nouvel endpoint
    return this.http.get<Evenement[]>(url).pipe(
      tap(events => console.log('EventService: Événements non notés reçus', events)),
      catchError(this.handleError)
    );
  }

  /**
   * Soumet la notation pour un événement spécifique.
   * POST /api/events/{eventId}/notations
   */
  // Le backend retourne l'objet Notation créé
  submitEventRating(eventId: number, rating: EventRatingPayload): Observable<Notation> {
    const url = `${this.apiUrl}/${eventId}/notations`;
    console.log(`EventService: Appel POST ${url} avec notation`, rating);
    return this.http.post<Notation>(url, rating).pipe( // Attend un objet Notation en retour
      tap(response => console.log('EventService: Notation créée reçue', response)),
      catchError(this.handleError)
    );
  }

  // --- Gestionnaire d'erreurs (peut être plus élaboré) ---
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue lors de l\'opération sur l\'événement.';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'échec.
      errorMessage = `Erreur serveur ${error.status}: ${error.error?.message || error.message}`; // Tente de récupérer le message d'erreur du backend
    }
    console.error(errorMessage, error);
    // Retourne une erreur observable pour que le composant puisse réagir
    return throwError(() => new Error(errorMessage));
  }


}


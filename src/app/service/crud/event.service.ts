import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { CreateEventPayload, Evenement, UpdateEventPayload } from '../../model/evenement';
import { EventRatingPayload, Notation } from '../../model/notation';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'EventService' qui gère les opérations liées aux événements.
 * Fournit une instance unique dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/events`;

  /**
   * @method getNextEvents
   * @description Récupère les 5 prochains événements actifs du club géré.
   * La gestion des erreurs est déléguée au composant appelant.
   * @returns Un `Observable` de tableau d'objets `Evenement`.
   */
  getNextEvents(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/managed-club/next`;
    console.log('Appel API Events:', url);

    return this.http.get<Evenement[]>(url);
  }

  /**
   * @method createEventWithCategories
   * @description Crée un nouvel événement avec ses catégories initiales.
   * @param clubId L'ID du club organisateur.
   * @param eventData Les détails de l'événement et de ses catégories.
   * @returns Un `Observable` de l'objet `Evenement` créé.
   */
  createEventWithCategories(clubId: number, eventData: CreateEventPayload): Observable<Evenement> {
    const url = `${this.apiUrl}?organisateurId=${clubId}`;
    console.log(`EventService: Appel POST à ${url} avec les données:`, eventData);

    return this.http.post<Evenement>(url, eventData).pipe(
      tap(createdEvent => console.log('EventService: Événement créé avec succès:', createdEvent)),
      catchError(this.handleError)
    );
  }

  /**
   * @method updateEventWithCategories
   * @description Met à jour un événement existant et réconcilie ses catégories.
   * @param eventId L'ID de l'événement à mettre à jour.
   * @param eventData Les détails mis à jour de l'événement et la liste complète des catégories.
   * @returns Un `Observable` de l'objet `Evenement` mis à jour.
   */
  updateEventWithCategories(eventId: number, eventData: UpdateEventPayload): Observable<Evenement> {
    const url = `${this.apiUrl}/${eventId}/full`;
    console.log(`EventService: Appel PUT à ${url} avec les données:`, eventData);

    return this.http.put<Evenement>(url, eventData).pipe(
      tap(updatedEvent => console.log('EventService: Événement mis à jour avec succès:', updatedEvent)),
      catchError(this.handleError)
    );
  }

  /**
   * @method softDeleteEvent
   * @description Effectue une suppression logique (désactivation) d'un événement.
   * @param eventId L'ID de l'événement à désactiver.
   * @returns Un `Observable<void>`.
   */
  softDeleteEvent(eventId: number): Observable<void> {
    const url = `${this.apiUrl}/${eventId}`;
    console.log(`Appel API Soft Delete: DELETE ${url}`);

    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`EventService: Événement avec ID ${eventId} supprimé logiquement.`)),
      catchError(this.handleError)
    );
  }

  /**
   * @method getAllEvents
   * @description Récupère tous les événements (actifs et inactifs).
   * @returns Un `Observable` de tableau d'objets `Evenement`.
   */
  getAllEvents(): Observable<Evenement[]> {
    console.log('EventService: Appel GET pour tous les événements (getAllEvents)');
    return this.http.get<Evenement[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * @method getAllEventsWithFriend
   * @description Récupère tous les événements actifs avec les informations d'amitié.
   * @returns Un `Observable` de tableau d'objets `Evenement`.
   */
  getAllEventsWithFriend(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/withfriend?status=active`;
    console.log(`EventService: Appel GET pour tous les événements avec friend (getAllEventsWithFriend) à l'URL : ${url}`);

    return this.http.get<Evenement[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * @method getUnratedParticipatedEvents
   * @description Récupère les événements auxquels l'utilisateur a participé mais n'a pas encore notés.
   * @returns Un `Observable` de tableau d'objets `Evenement`.
   */
  getUnratedParticipatedEvents(): Observable<Evenement[]> {
    const url = `${this.apiUrl}/notations/me/participated-events-unrated`;
    console.log(`EventService: Appel GET ${url}`);

    return this.http.get<Evenement[]>(url).pipe(
      tap(events => console.log('EventService: Événements non notés reçus', events)),
      catchError(this.handleError)
    );
  }

  /**
   * @method submitEventRating
   * @description Soumet la notation pour un événement spécifique.
   * @param eventId L'ID de l'événement.
   * @param rating L'objet de notation.
   * @returns Un `Observable` de l'objet `Notation` créé.
   */
  submitEventRating(eventId: number, rating: EventRatingPayload): Observable<Notation> {
    const url = `${this.apiUrl}/${eventId}/notations`;
    console.log(`EventService: Appel POST ${url} avec notation`, rating);

    return this.http.post<Notation>(url, rating).pipe(
      tap(response => console.log('EventService: Notation créée reçue', response)),
      catchError(this.handleError)
    );
  }

  /**
   * @private handleError
   * @description Gestion centralisée des erreurs HTTP pour ce service.
   * @param error L'objet `HttpErrorResponse` de l'erreur.
   * @returns Un `Observable` qui émet une erreur formatée.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue lors de l\'opération sur l\'événement.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Erreur serveur ${error.status}: ${error.error?.message || error.message}`;
    }
    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

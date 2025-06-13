import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../../model/reservation';
import { ReservationStatus } from '../../model/reservationstatus';
import {catchError, tap} from 'rxjs/operators';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'ReservationService' qui gère les opérations sur les réservations.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reservations`;

  /**
   * @method getReservationsByEvent
   * @description Récupère les réservations pour un événement spécifique, avec un filtre optionnel par statut.
   * @param eventId L'ID de l'événement.
   * @param status Le statut optionnel des réservations à filtrer (ex: CONFIRME, ANNULE).
   * @returns Un `Observable` de tableau d'objets `Reservation`.
   */
  getReservationsByEvent(eventId: number, status?: ReservationStatus | null): Observable<Reservation[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    const url = `${this.apiUrl}/event/${eventId}`;
    console.log(`ReservationService: Appel GET (getReservationsByEvent) vers ${url} avec params:`, params.toString());

    return this.http.get<Reservation[]>(url, { params: params }).pipe(
      tap(reservations => console.log(`ReservationService: Réservations pour l'événement ${eventId} récupérées:`, reservations)),
      catchError(this.handleError)
    );
  }

  /**
   * @method createReservation
   * @description Crée une nouvelle réservation pour un utilisateur (connecté) pour un événement et une catégorie.
   * @param eventId L'ID de l'événement.
   * @param categorieId L'ID de la catégorie de place.
   * @returns Un `Observable` de la réponse de l'API (typage `any` à affiner si l'API retourne un type spécifique).
   */
  createReservation(eventId: number, categorieId: number): Observable<any> {
    let params = new HttpParams()
      .set('eventId', eventId.toString())
      .set('categorieId', categorieId.toString());

    console.log(`ReservationService: Appel POST (createReservation) vers ${this.apiUrl} avec params:`, params.toString());

    return this.http.post<any>(this.apiUrl, {}, { params: params })
      .pipe(
        tap(response => console.log('ReservationService: Réservation créée avec succès:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * @method getMyReservations
   * @description Récupère les réservations de l'utilisateur authentifié (par défaut 'CONFIRME').
   * @returns Un `Observable` de tableau d'objets `Reservation`.
   */
  getMyReservations(): Observable<Reservation[]> {
    const url = `${this.apiUrl}/me?status=CONFIRME`;
    console.log(`ReservationService: Appel GET (getMyReservations) vers ${url}`);

    return this.http.get<Reservation[]>(url).pipe(
      tap(reservations => console.log('ReservationService: Mes réservations (CONFIRME) récupérées:', reservations)),
      catchError(this.handleError)
    );
  }

  /**
   * @method cancelReservation
   * @description Annule une réservation existante.
   * @param reservationId L'ID de la réservation à annuler.
   * @returns Un `Observable` de la réponse de l'API (typage `any` à affiner).
   */
  cancelReservation(reservationId: number): Observable<any> {
    const cancelUrl = `${this.apiUrl}/${reservationId}/cancel`;
    console.log(`ReservationService: Appel PUT (cancelReservation) vers ${cancelUrl}`);

    return this.http.put<any>(cancelUrl, {})
      .pipe(
        tap(response => console.log(`ReservationService: Réservation ${reservationId} annulée avec succès:`, response)),
        catchError(this.handleError)
      );
  }

  /**
   * @private handleError
   * @description Gestion centralisée des erreurs HTTP pour ce service.
   * @param error L'objet `HttpErrorResponse` de l'erreur.
   * @returns Un `Observable` qui émet une erreur formatée.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      const backendError = error.error;
      const backendMessage = backendError?.message || backendError?.error || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError));
      errorMessage = `Erreur serveur : Code ${error.status}, Message: ${backendMessage || error.message}`;
    }
    console.error('Erreur API dans ReservationService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

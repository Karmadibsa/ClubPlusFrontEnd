import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environments';
import {Reservation} from '../../model/reservation';
import {Observable, throwError} from 'rxjs';
import {ReservationStatus} from '../../model/reservationstatus';
import {catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  // Adaptez l'URL si elle est différente ou stockée dans les variables d'environnement
  private apiUrl = `${environment.apiUrl}/reservations`;


  // Récupère les réservations pour un événement spécifique, avec filtre optionnel par statut
  getReservationsByEvent(eventId: number, status?: ReservationStatus | null): Observable<Reservation[]> {
    let params = new HttpParams();
    if (status) {
      // Ajoute le paramètre 'status' seulement s'il est fourni
      params = params.set('status', status);
    }

    // Construit l'URL et effectue la requête GET avec les paramètres
    const url = `${this.apiUrl}/event/${eventId}`;
    return this.http.get<Reservation[]>(url, {params});
  }

  /**
   * Crée une nouvelle réservation pour un événement et une catégorie donnés.
   * @param eventId L'ID de l'événement.
   * @param categorieId L'ID de la catégorie sélectionnée.
   * @returns Un Observable contenant la réponse de l'API.
   */
  createReservation(eventId: number, categorieId: number): Observable<any> {
    // Préparer les paramètres de requête [from previous answer]
    let params = new HttpParams()
      .set('eventId', eventId.toString())
      .set('categorieId', categorieId.toString());

    console.log(`Service: Appel API POST vers ${this.apiUrl} avec params: ${params.toString()}`);

    // Effectuer la requête POST avec les paramètres dans l'URL et un corps vide {} [3][6][from previous answer]
    return this.http.post<any>(this.apiUrl, {}, {params: params})
      .pipe(
        catchError(this.handleError) // Gérer les erreurs [3][6]
      );
  }

  /**
   * Gère les erreurs HTTP de manière centralisée pour ce service.
   * @param error L'erreur HTTP reçue.
   * @returns Un Observable qui émet une erreur.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'erreur
      // Le corps de la réponse peut contenir des indices sur la cause
      errorMessage = `Erreur serveur : Code ${error.status}, Message: ${error.message}`;
      if (error.error && typeof error.error === 'string') {
        errorMessage += ` - ${error.error}`;
      } else if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
    }
    console.error('Erreur API dans ReservationService:', errorMessage, error);
    // Retourner un observable qui échoue avec un message d'erreur orienté utilisateur
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Récupère les réservations de l'utilisateur courant.
   * @returns Un Observable contenant la liste des réservations.
   */
  getMyReservations(): Observable<Reservation[]> {
    const url = `${this.apiUrl}/me?status=CONFIRME`;
    return this.http.get<Reservation[]>(url);
  }

  /**
   * Annule une réservation existante via l'API en utilisant PUT.
   * @param reservationId L'ID de la réservation à annuler.
   * @returns Un Observable indiquant le succès ou l'échec.
   */
  cancelReservation(reservationId: number): Observable<any> {
    const cancelUrl = `${this.apiUrl}/${reservationId}/cancel`; // Exemple: http://localhost:8080/api/reservations/22/cancel

    // Log mis à jour pour indiquer PUT
    console.log(`Service: Appel API PUT vers ${cancelUrl}`);

    return this.http.put<any>(cancelUrl, {})
      .pipe(
        catchError(this.handleError) // Réutiliser le gestionnaire d'erreurs
      );
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Reservation } from '../../model/reservation'; // Modèle pour une réservation
import { Observable, throwError } from 'rxjs';
import { ReservationStatus } from '../../model/reservationstatus'; // Enum pour les statuts de réservation
import {catchError, tap} from 'rxjs/operators'; // Note: Pour RxJS v7+, importer directement de 'rxjs'

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que ReservationService est un service fourni au niveau racine.
 * Une instance unique sera disponible dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  /**
   * Injection de HttpClient pour effectuer des requêtes HTTP.
   */
  private http = inject(HttpClient);

  /**
   * URL de base pour les appels à l'API concernant les réservations.
   * Exemple: "https://api.example.com/api/reservations"
   */
  private apiUrl = `${environment.apiUrl}/reservations`;


  /**
   * Récupère les réservations pour un événement spécifique, avec un filtre optionnel par statut.
   * Correspond à l'endpoint GET /api/reservations/event/{eventId}?status={status} [1].
   * @param eventId L'ID numérique de l'événement concerné.
   * @param status Le statut optionnel des réservations à filtrer (ex: CONFIRME, ANNULE).
   *               Si `null` ou non fourni, aucun filtre de statut n'est appliqué par le client ici.
   * @returns Un Observable qui émettra un tableau d'objets `Reservation`.
   */
  getReservationsByEvent(eventId: number, status?: ReservationStatus | null): Observable<Reservation[]> {
    // Initialise un objet HttpParams. HttpParams est immuable, donc chaque appel à .set()
    // retourne une nouvelle instance.
    let params = new HttpParams();
    if (status) {
      // Si un statut est fourni, l'ajoute comme paramètre de requête.
      // Exemple: si status est ReservationStatus.CONFIRME (valeur 'CONFIRME'),
      // cela ajoutera "?status=CONFIRME" à l'URL.
      params = params.set('status', status);
    }

    const url = `${this.apiUrl}/event/${eventId}`; // URL pour récupérer les réservations par événement.
    console.log(`ReservationService: Appel GET (getReservationsByEvent) vers ${url} avec params:`, params.toString());

    // Effectue la requête GET. L'objet `params` est passé dans l'objet d'options.
    // S'attend à recevoir un tableau de `Reservation`.
    return this.http.get<Reservation[]>(url, { params: params }).pipe(
      // Note: Pas de catchError ici. La gestion d'erreur est déléguée au composant,
      // ou il faudrait ajouter catchError(this.handleError) pour la cohérence.
      // Étant donné que d'autres méthodes l'ont, il serait bon de l'ajouter ou d'avoir une raison claire pour son absence.
      tap(reservations => console.log(`ReservationService: Réservations pour l'événement ${eventId} récupérées:`, reservations)),
      catchError(this.handleError) // Ajout pour la cohérence, à discuter si c'est le comportement voulu.
    );
  }

  /**
   * Crée une nouvelle réservation pour un utilisateur (implicitement l'utilisateur connecté)
   * pour un événement et une catégorie donnés.
   * Correspond à l'endpoint POST /api/reservations?eventId={eventId}&categorieId={categorieId} [1].
   * @param eventId L'ID de l'événement pour lequel réserver.
   * @param categorieId L'ID de la catégorie de place sélectionnée.
   * @returns Un Observable contenant la réponse de l'API. Le type `any` est utilisé ici,
   *          mais il serait préférable de le typer avec ce que l'API retourne réellement
   *          (par exemple, la `Reservation` créée, ou `void` si 201 No Content, ou un message de succès).
   */
  createReservation(eventId: number, categorieId: number): Observable<any> { // Idéalement, remplacer <any> par un type plus spécifique.
    // Prépare les paramètres de requête.
    let params = new HttpParams()
      .set('eventId', eventId.toString()) // Convertit les nombres en chaînes pour HttpParams.
      .set('categorieId', categorieId.toString());

    console.log(`ReservationService: Appel POST (createReservation) vers ${this.apiUrl} avec params:`, params.toString());

    // Effectue la requête POST. Le corps de la requête (deuxième argument) est un objet vide `{}`,
    // car les informations nécessaires sont passées via les `params` de requête.
    // Le type de retour attendu est `any` pour l'instant.
    return this.http.post<any>(this.apiUrl, {}, { params: params })
      .pipe(
        tap(response => console.log('ReservationService: Réservation créée avec succès:', response)),
        catchError(this.handleError) // Gère les erreurs avec la méthode privée.
      );
  }

  /**
   * Récupère les réservations de l'utilisateur actuellement authentifié,
   * filtrées par défaut sur le statut 'CONFIRME'.
   * Correspond à l'endpoint GET /api/reservations/me?status=CONFIRME [1].
   * @returns Un Observable qui émettra un tableau d'objets `Reservation`.
   */
  getMyReservations(): Observable<Reservation[]> {
    // L'URL inclut directement le paramètre de statut.
    const url = `${this.apiUrl}/me?status=CONFIRME`;
    console.log(`ReservationService: Appel GET (getMyReservations) vers ${url}`);

    return this.http.get<Reservation[]>(url).pipe(
      // De même que pour getReservationsByEvent, il serait cohérent d'ajouter
      // tap et catchError ici si c'est la stratégie générale du service.
      tap(reservations => console.log('ReservationService: Mes réservations (CONFIRME) récupérées:', reservations)),
      catchError(this.handleError) // Ajout pour la cohérence.
    );
  }

  /**
   * Annule une réservation existante.
   * Correspond à l'endpoint PUT /api/reservations/{reservationId}/cancel [1].
   * @param reservationId L'ID de la réservation à annuler.
   * @returns Un Observable contenant la réponse de l'API (typage `any`).
   *          Idéalement, à typer avec `void` si 204 No Content, ou un type spécifique si une réponse est attendue.
   */
  cancelReservation(reservationId: number): Observable<any> { // Idéalement, remplacer <any> par un type plus spécifique.
    const cancelUrl = `${this.apiUrl}/${reservationId}/cancel`; // URL pour l'annulation.
    console.log(`ReservationService: Appel PUT (cancelReservation) vers ${cancelUrl}`);

    // Effectue la requête PUT. Le corps de la requête (deuxième argument) est un objet vide `{}`.
    return this.http.put<any>(cancelUrl, {})
      .pipe(
        tap(response => console.log(`ReservationService: Réservation ${reservationId} annulée avec succès:`, response)),
        catchError(this.handleError) // Réutilise le gestionnaire d'erreurs.
      );
  }

  /**
   * @private handleError
   * Gestionnaire d'erreurs HTTP privé pour ce service.
   * Formate les erreurs pour une meilleure lisibilité et propagation.
   * @param error L'objet `HttpErrorResponse` capturé.
   * @returns Un Observable qui émet une `Error` avec un message formaté.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau.
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      // Erreur du backend.
      // Le message d'erreur tente d'être plus spécifique en utilisant error.error.message si disponible.
      errorMessage = `Erreur serveur : Code ${error.status}, Message: ${error.message}`; // Message HTTP de base
      if (error.error && typeof error.error === 'string') {
        // Si le corps de l'erreur est une simple chaîne.
        errorMessage += ` - Détail: ${error.error}`;
      } else if (error.error && error.error.message) {
        // Si le corps de l'erreur est un objet avec une propriété 'message'.
        errorMessage += ` - Détail: ${error.error.message}`;
      }
      // Vous pourriez ajouter d'autres logiques pour extraire des messages d'erreur
      // spécifiques à la structure de vos réponses d'erreur backend.
    }
    console.error('Erreur API dans ReservationService:', errorMessage, error); // Log pour le débogage.
    return throwError(() => new Error(errorMessage)); // Propagation de l'erreur formatée.
  }
}

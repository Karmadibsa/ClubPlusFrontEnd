import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Membre } from '../../model/membre';
import { DemandeAmi } from '../../model/demandeAmi';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'AmisService' qui gère les opérations liées aux amis et aux demandes d'ami.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class AmisService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/amis`;

  /**
   * @method getCurrentFriends
   * @description Récupère la liste des amis de l'utilisateur authentifié.
   * @returns Un `Observable` de tableau d'objets `Membre`.
   */
  getCurrentFriends(): Observable<Membre[]> {
    const url = `${this.apiUrl}`;
    return this.http.get<Membre[]>(url).pipe(
      tap(friends => console.log('AmisService: Amis récupérés', friends)),
      catchError(this.handleError)
    );
  }

  /**
   * @method getReceivedFriendRequests
   * @description Récupère la liste des demandes d'amis reçues.
   * @returns Un `Observable` de tableau de `DemandeAmi`.
   */
  getReceivedFriendRequests(): Observable<DemandeAmi[]> {
    const url = `${this.apiUrl}/demandes/recues`;
    console.log(`AmisService: Appel GET ${url}`);
    return this.http.get<DemandeAmi[]>(url).pipe(
      tap(requests => console.log('AmisService: Demandes reçues récupérées', requests)),
      catchError(this.handleError)
    );
  }

  /**
   * @method getSentFriendRequests
   * @description Récupère la liste des demandes d'amis envoyées.
   * @returns Un `Observable` de tableau de `DemandeAmi`.
   */
  getSentFriendRequests(): Observable<DemandeAmi[]> {
    const url = `${this.apiUrl}/demandes/envoyees`;
    console.log(`AmisService: Appel GET ${url}`);
    return this.http.get<DemandeAmi[]>(url).pipe(
      tap(requests => {}),
      catchError(this.handleError)
    );
  }

  /**
   * @method sendFriendRequestByCode
   * @description Envoie une demande d'ami via le code ami du destinataire.
   * @param codeAmi Le code ami unique du membre destinataire.
   * @returns Un `Observable` de la `DemandeAmi` créée.
   */
  sendFriendRequestByCode(codeAmi: string): Observable<DemandeAmi> {
    const url = `${this.apiUrl}/demandes/envoyer-par-code`;
    const params = new HttpParams().set('code', codeAmi);
    return this.http.post<DemandeAmi>(url, {}, { params: params }).pipe(
      tap((demande) => console.log(`AmisService: Demande d'ami envoyée via code ${codeAmi}`, demande)),
      catchError(this.handleError)
    );
  }

  /**
   * @method removeFriend
   * @description Supprime un ami de la liste de l'utilisateur courant.
   * @param friendId L'ID numérique de l'ami à supprimer.
   * @returns Un `Observable<void>`.
   */
  removeFriend(friendId: number): Observable<void> {
    const url = `${this.apiUrl}/${friendId}`;
    console.log(`AmisService: Appel DELETE ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`AmisService: Ami ${friendId} supprimé`)),
      catchError(this.handleError)
    );
  }

  /**
   * @method acceptFriendRequest
   * @description Accepte une demande d'ami reçue.
   * @param requestId L'ID de la demande d'ami à accepter.
   * @returns Un `Observable<void>`.
   */
  acceptFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/accepter/${requestId}`;
    console.log(`AmisService: Appel PUT ${url}`);
    return this.http.put<void>(url, {}).pipe(
      tap(() => console.log(`AmisService: Demande ${requestId} acceptée`)),
      catchError(this.handleError)
    );
  }

  /**
   * @method rejectFriendRequest
   * @description Refuse une demande d'ami reçue.
   * @param requestId L'ID de la `DemandeAmi` à refuser.
   * @returns Un `Observable<void>`.
   */
  rejectFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/refuser/${requestId}`;
    console.log(`AmisService: Appel PUT ${url}`);
    return this.http.put<void>(url, {}).pipe(
      tap(() => console.log(`AmisService: Demande ${requestId} refusée`)),
      catchError(this.handleError)
    );
  }

  /**
   * @method cancelSentFriendRequest
   * @description Annule une demande d'ami précédemment envoyée.
   * @param requestId L'ID de la `DemandeAmi` à annuler.
   * @returns Un `Observable<void>`.
   */
  cancelSentFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/annuler/${requestId}`;
    console.log(`AmisService: Appel DELETE ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`AmisService: Demande ${requestId} annulée`)),
      catchError(this.handleError)
    );
  }

  /**
   * @private handleError
   * @description Gestion centralisée des erreurs HTTP.
   * @param error L'objet `HttpErrorResponse` de l'erreur.
   * @returns Un `Observable` qui émet une erreur avec un message formaté.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      const backendError = error.error;
      const backendMessage = backendError?.message || backendError?.error || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError));

      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    console.error('AmisService API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

import {inject, Injectable} from '@angular/core';
import {catchError, Observable, tap, throwError} from 'rxjs';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environments';
import {Membre} from '../../model/membre';
import {DemandeAmi} from '../../model/demandeAmi';


@Injectable({
  providedIn: 'root'
})
export class AmisService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/amis`; // URL de base pour les amis

  /**
   * Récupère la liste des amis de l'utilisateur courant.
   * Correspond à: GET /api/amis
   * @returns Un Observable contenant un tableau d'utilisateurs (amis).
   */
  getCurrentFriends(): Observable<Membre[]> {
    const url = `${this.apiUrl}`; // Pas besoin de /amis car c'est déjà dans apiUrl
    console.log(`FriendService: Appel GET ${url}`);
    return this.http.get<Membre[]>(url).pipe(
      tap(friends => console.log('FriendService: Amis récupérés', friends)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère la liste des demandes d'amis reçues par l'utilisateur courant.
   * Correspond à: GET /api/amis/demandes/recues
   * @returns Un Observable contenant un tableau de FriendRequest.
   */
  getReceivedFriendRequests(): Observable<DemandeAmi[]> {
    const url = `${this.apiUrl}/demandes/recues`;
    console.log(`FriendService: Appel GET ${url}`);
    return this.http.get<DemandeAmi[]>(url).pipe(
      tap(requests => console.log('FriendService: Demandes reçues récupérées', requests)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère la liste des demandes d'amis envoyées par l'utilisateur courant.
   * Correspond à: GET /api/amis/demandes/envoyees
   * @returns Un Observable contenant un tableau de FriendRequest.
   */
  getSentFriendRequests(): Observable<DemandeAmi[]> {
    const url = `${this.apiUrl}/demandes/envoyees`;
    console.log(`FriendService: Appel GET ${url}`);
    return this.http.get<DemandeAmi[]>(url).pipe(
      tap(requests => {
        // LOG AJOUTÉ ICI pour voir les données brutes après HttpClient
        console.log('FriendService: Données BRUTES reçues via HttpClient:', requests);
        if (requests && requests.length > 0) {
          console.log('FriendService: Recepteur dans données BRUTES:', requests[0].recepteur);
          console.log('FriendService: Prénom Recepteur dans données BRUTES:', requests[0].recepteur?.prenom);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Envoie une demande d'ami en utilisant le codeAmi du récepteur.
   * Correspond à: POST /api/amis/demandes/envoyer-par-code?code={codeAmi}
   * @param codeAmi Le code ami du destinataire.
   * @returns Un Observable contenant la DemandeAmi créée.
   */
  sendFriendRequestByCode(codeAmi: string): Observable<DemandeAmi> { // Renomme et change paramètre
    const url = `${this.apiUrl}/demandes/envoyer-par-code`; // Nouvelle URL
    let params = new HttpParams().set('code', codeAmi); // Paramètre de requête

    console.log(`AmisService: Appel POST ${url} avec code=${codeAmi}`);
    return this.http.post<DemandeAmi>(url, {}, {params: params}).pipe( // Envoi corps vide, mais avec params
      tap((demande) => console.log(`AmisService: Demande d'ami envoyée via code ${codeAmi}`, demande)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un ami de la liste d'amis de l'utilisateur courant.
   * Correspond à: DELETE /api/amis/{friendId}
   * @param friendId L'ID de l'ami à supprimer.
   * @returns Un Observable de type void.
   */
  removeFriend(friendId: number): Observable<void> {
    const url = `${this.apiUrl}/${friendId}`; // Ajout de l'ID dans l'URL
    console.log(`FriendService: Appel DELETE ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`FriendService: Ami ${friendId} supprimé`)),
      catchError(this.handleError)
    );
  }

  /**
   * Accepte une demande d'ami.
   * Correspond à: PUT /api/amis/demandes/accepter/{requestId}
   * @param requestId L'ID de la demande à accepter.
   * @returns Un Observable de type void.
   */
  acceptFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/accepter/${requestId}`; // Ajout de l'ID dans l'URL
    console.log(`FriendService: Appel PUT ${url}`);
    return this.http.put<void>(url, {}).pipe( // Envoi d'un corps vide
      tap(() => console.log(`FriendService: Demande ${requestId} acceptée`)),
      catchError(this.handleError)
    );
  }

  /**
   * Refuse une demande d'ami.
   * Correspond à: PUT /api/amis/demandes/refuser/{requestId}
   * @param requestId L'ID de la demande à refuser.
   * @returns Un Observable de type void.
   */
  rejectFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/refuser/${requestId}`; // Ajout de l'ID dans l'URL
    console.log(`FriendService: Appel PUT ${url}`);
    return this.http.put<void>(url, {}).pipe( // Envoi d'un corps vide
      tap(() => console.log(`FriendService: Demande ${requestId} refusée`)),
      catchError(this.handleError)
    );
  }

  /**
   * Annule une demande d'ami envoyée.
   * Correspond à: DELETE /api/amis/demandes/annuler/{requestId}
   * @param requestId L'ID de la demande à annuler.
   * @returns Un Observable de type void.
   */
  cancelSentFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/annuler/${requestId}`; // Ajout de l'ID dans l'URL
    console.log(`FriendService: Appel DELETE ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`FriendService: Demande ${requestId} annulée`)),
      catchError(this.handleError)
    );
  }


  // --- Gestionnaire d'Erreurs Privé (Copie de ClubService) ---
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'échec.
      // Le corps de la réponse peut contenir des indices sur ce qui a mal tourné.
      // Tente d'extraire un message d'erreur plus spécifique du backend
      const backendError = error.error; // Corps de l'erreur backend (peut être string, objet...)
      const backendMessage = backendError?.message || backendError?.error || JSON.stringify(backendError);

      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    console.error('FriendService API Error:', errorMessage, error); // Log complet pour le débogage
    // Retourne un observable qui échoue avec le message d'erreur destiné à l'utilisateur
    return throwError(() => new Error(errorMessage));
  }
}

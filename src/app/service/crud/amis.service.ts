import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environments'; // Chemin vers votre fichier d'environnement
import { Membre } from '../../model/membre';
import { DemandeAmi } from '../../model/demandeAmi';

/**
 * @Injectable({ providedIn: 'root' })
 * Ce décorateur marque la classe 'AmisService' comme un service qui peut être injecté.
 * 'providedIn: 'root'' signifie que Angular créera une instance unique (singleton) de ce service
 * et qu'elle sera disponible dans toute l'application sans avoir besoin de l'ajouter
 * à la liste 'providers' d'un module spécifique.
 */
@Injectable({
  providedIn: 'root'
})
export class AmisService {

  /**
   * Injection du service HttpClient d'Angular.
   * La fonction `inject(HttpClient)` est une manière moderne d'injecter des dépendances,
   * alternative à l'injection via le constructeur.
   * `this.http` sera utilisé pour effectuer toutes les requêtes HTTP vers le backend.
   */
  private http = inject(HttpClient);

  /**
   * URL de base de l'API pour les fonctionnalités liées aux amis.
   * Elle est construite en utilisant la variable `apiUrl` définie dans le fichier d'environnement,
   * ce qui permet de configurer facilement l'URL du backend pour différents environnements
   * (développement, production, etc.).
   */
  private apiUrl = `${environment.apiUrl}/amis`;

  /**
   * Récupère la liste des amis de l'utilisateur actuellement authentifié.
   * Cette méthode effectue une requête GET vers l'endpoint '/api/amis' (défini par `this.apiUrl`).
   * @returns Un `Observable` qui, une fois souscrit, émettra un tableau d'objets `Membre` représentant les amis.
   */
  getCurrentFriends(): Observable<Membre[]> {
    const url = `${this.apiUrl}`; // L'URL complète est simplement this.apiUrl car il contient déjà /amis.
    // this.http.get<Membre[]> effectue la requête GET.
    // Le type <Membre[]> indique à HttpClient de s'attendre à un tableau de Membre dans la réponse.
    return this.http.get<Membre[]>(url).pipe(
      // L'opérateur `tap` est utilisé ici pour un effet de bord : logger les amis récupérés.
      // Il n'altère pas les données émises par l'Observable.
      tap(friends => console.log('AmisService: Amis récupérés', friends)),
      // L'opérateur `catchError` intercepte toute erreur survenant durant la requête HTTP
      // ou dans les opérateurs précédents du `pipe`. Il délègue la gestion à `this.handleError`.
      catchError(this.handleError)
    );
  }

  /**
   * Récupère la liste des demandes d'amis reçues par l'utilisateur courant.
   * Correspond à l'endpoint GET /api/amis/demandes/recues.
   * @returns Un `Observable` qui émettra un tableau de `DemandeAmi`.
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
   * Récupère la liste des demandes d'amis envoyées par l'utilisateur courant.
   * Correspond à l'endpoint GET /api/amis/demandes/envoyees.
   * @returns Un `Observable` qui émettra un tableau de `DemandeAmi`.
   */
  getSentFriendRequests(): Observable<DemandeAmi[]> {
    const url = `${this.apiUrl}/demandes/envoyees`;
    console.log(`AmisService: Appel GET ${url}`);
    return this.http.get<DemandeAmi[]>(url).pipe(
      tap(requests => {
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Envoie une demande d'ami en utilisant le `codeAmi` du destinataire.
   * Correspond à l'endpoint POST /api/amis/demandes/envoyer-par-code.
   * Le `codeAmi` est passé comme paramètre de requête (?code=...).
   * @param codeAmi Le code ami unique du membre à qui envoyer la demande.
   * @returns Un `Observable` qui émettra la `DemandeAmi` créée par le backend.
   */
  sendFriendRequestByCode(codeAmi: string): Observable<DemandeAmi> {
    const url = `${this.apiUrl}/demandes/envoyer-par-code`;
    // HttpParams est utilisé pour construire les paramètres de requête de manière sécurisée et correcte.
    const params = new HttpParams().set('code', codeAmi);
    // this.http.post effectue la requête POST.
    // Le deuxième argument ({}) est le corps de la requête (body), vide ici.
    // Le troisième argument est un objet d'options, incluant les `params`.
    return this.http.post<DemandeAmi>(url, {}, { params: params }).pipe(
      tap((demande) => console.log(`AmisService: Demande d'ami envoyée via code ${codeAmi}`, demande)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un ami de la liste d'amis de l'utilisateur courant.
   * Correspond à l'endpoint DELETE /api/amis/{friendId}.
   * @param friendId L'ID numérique du membre à supprimer de la liste d'amis.
   * @returns Un `Observable<void>` car l'opération DELETE ne retourne généralement pas de contenu
   *          si elle réussit (souvent un statut HTTP 204 No Content).
   */
  removeFriend(friendId: number): Observable<void> {
    const url = `${this.apiUrl}/${friendId}`; // L'ID de l'ami est inclus dans le chemin de l'URL.
    console.log(`AmisService: Appel DELETE ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`AmisService: Ami ${friendId} supprimé`)),
      catchError(this.handleError)
    );
  }

  /**
   * Accepte une demande d'ami.
   * Correspond à l'endpoint PUT /api/amis/demandes/accepter/{requestId}.
   * @param requestId L'ID de la `DemandeAmi` à accepter.
   * @returns Un `Observable<void>`, indiquant la réussite de l'opération sans retour de contenu.
   */
  acceptFriendRequest(requestId: number): Observable<void> {
    const url = `${this.apiUrl}/demandes/accepter/${requestId}`;
    console.log(`AmisService: Appel PUT ${url}`);
    // this.http.put effectue la requête PUT. Le deuxième argument ({}) est un corps vide.
    return this.http.put<void>(url, {}).pipe(
      tap(() => console.log(`AmisService: Demande ${requestId} acceptée`)),
      catchError(this.handleError)
    );
  }

  /**
   * Refuse une demande d'ami.
   * Correspond à l'endpoint PUT /api/amis/demandes/refuser/{requestId}.
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
   * Annule une demande d'ami précédemment envoyée par l'utilisateur courant.
   * Correspond à l'endpoint DELETE /api/amis/demandes/annuler/{requestId}.
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
   * Méthode privée pour la gestion centralisée des erreurs HTTP.
   * @param error L'objet HttpErrorResponse reçu en cas d'échec de la requête.
   * @returns Un `Observable` qui émet une erreur (`throwError`) avec un message formaté.
   *          Ceci permet aux composants qui appellent le service de traiter l'erreur.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !'; // Message par défaut.

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (ex: problème de réseau, erreur JavaScript non interceptée avant la requête).
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur renvoyée par le backend (ex: statut 404, 500, 401, etc.).
      // `error.error` contient le corps de la réponse d'erreur du backend.
      // Cela peut être une chaîne, un objet JSON, etc.
      const backendError = error.error;
      // Tentative d'extraire un message plus spécifique du corps de l'erreur backend.
      // Les backends structurent souvent leurs erreurs avec une propriété 'message' ou 'error'.
      const backendMessage = backendError?.message || backendError?.error || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError));

      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    // Log de l'erreur complète dans la console pour le débogage.
    console.error('AmisService API Error:', errorMessage, error);
    // Retourne un nouvel Observable qui émet immédiatement l'erreur formatée.
    // Les composants pourront s'abonner au flux d'erreur de cet Observable.
    return throwError(() => new Error(errorMessage));
  }
}

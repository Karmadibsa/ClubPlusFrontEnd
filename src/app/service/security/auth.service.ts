// src/app/services/auth.service.ts
import {inject, Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environments';
import {catchError, tap} from 'rxjs/operators';
import {Membre, MembrePayload} from '../../model/membre';
import {Club, ClubRegistrationPayload} from '../../model/club';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // --- Constantes ---
  private apiUrl = `${environment.apiUrl}/auth`; // Base URL pour l'authentification

  connecte = false;
  role: string | null = null;
  managedClubId: number | null = null;

  constructor() {
    const jwt = localStorage.getItem("jwt")
    if (jwt != null) {
      this.decodeJwt(jwt)
    }
  }

  /**
   * Traite le JSON Web Token (JWT) reçu pour établir une session utilisateur.
   * Cette fonction stocke le token, décode sa charge utile (payload) pour extraire
   * les informations utilisateur (notamment le rôle), et met à jour l'état
   * de connexion de l'application.
   *
   * @param jwt La chaîne de caractères JWT reçue après une authentification réussie.
   */
  decodeJwt(jwt: string) {

    // 1. Stocker le JWT reçu dans le localStorage du navigateur.
    // Cela permet au token de persister lors des rechargements de page ou entre les sessions.
    localStorage.setItem("jwt", jwt);

    // 2. Diviser la chaîne JWT en ses trois composants (En-tête, Charge utile, Signature)
    // en utilisant le point (.) comme séparateur.
    const splitJwt = jwt.split(".");

    // 3. Récupérer la deuxième partie du JWT (index 1), qui correspond à la Charge utile (Payload).
    // La charge utile contient généralement les revendications (claims) sur l'utilisateur.
    const jwtBody = splitJwt[1];

    // 4. Décoder la chaîne de la Charge utile (Payload) qui est encodée en Base64Url.
    // La fonction atob() décode le Base64 standard. Des ajustements peuvent être nécessaires
    // si le serveur utilise strictement Base64Url (remplacement de '-' par '+' et '_' par '/').
    // Le résultat est une chaîne de caractères au format JSON.
    const jsonBody = atob(jwtBody);

    // 5. Analyser (parser) la chaîne JSON issue du décodage de la Charge utile.
    // Ceci transforme la chaîne en un objet JavaScript manipulable.
    const body = JSON.parse(jsonBody);

    // 6. Afficher la chaîne JSON décodée dans la console du navigateur.
    // Utile pour le débogage afin d'inspecter le contenu du token.
    // Afficher jsonBody est direct car c'est le résultat du décodage.
    // console.log(jsonBody);

    // 7. Extraire la propriété 'role' de l'objet 'body' (la charge utile analysée).
    // Assigner cette valeur à la propriété 'role' de l'instance courante (this.role).
    // Permet d'utiliser le rôle de l'utilisateur dans d'autres parties de l'application.
    this.role = body.role;
    this.managedClubId = body.managedClubId ?? null;

    // 8. Mettre à jour la propriété booléenne 'connecte' de l'instance courante à 'true'.
    // Indique que le processus de connexion est terminé et que l'utilisateur est authentifié
    // du point de vue de l'état de l'application.
    this.connecte = true;
  }


  deconnexion() {
    localStorage.removeItem("jwt")
    this.connecte = false;
    this.role = null;
    this.managedClubId = null;
  }

  getManagedClubId() {
    return this.managedClubId;
  }

  getRole() {
    return this.role;
  }


  /**
   * Tente de connecter l'utilisateur en envoyant les identifiants à l'API.
   * En cas de succès, décode le JWT reçu et met à jour l'état interne.
   * Retourne un Observable<void> qui émet `next` en cas de succès, `error` sinon.
   * @param credentials - Objet contenant l'email et le mot de passe.
   */
  login(credentials: { email: string, password: any }): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/connexion`, // URL complète de l'API
      credentials,
      { responseType: 'text' } // On attend le JWT en format texte
    ).pipe(
      tap(jwt => {
        // Si la requête réussit (status 2xx), on décode le JWT
        this.decodeJwt(jwt);
      }),
      catchError(this.handleError) // Gestion centralisée des erreurs HTTP
    );
  }

  /**
   * Tente d'inscrire un nouveau membre en envoyant les données à l'API.
   * @param payload - Les informations du membre à inscrire (sans codeClub/confirmPassword).
   * @param codeClub - Le code du club à joindre, passé en query parameter.
   * @returns Observable<Membre> qui émet le membre créé en cas de succès, ou une erreur.
   */
  register(payload: MembrePayload, codeClub: string): Observable<Membre> {
    // Prépare les query parameters
    const params = new HttpParams().set('codeClub', codeClub);

    // Construit l'URL complète
    const registrationUrl = `${this.apiUrl}/membre/inscription`;


    return this.http.post<Membre>(
      registrationUrl,
      payload,
      { params: params } // Ajoute les query parameters ici
    ).pipe(
      tap(createdMember => {
        // Action optionnelle en cas de succès (ex: log)
        // NOTE: On ne met PAS à jour l'état de connexion ici, l'utilisateur
        // doit se connecter séparément après l'inscription (selon le flux actuel).
      }),
      catchError(this.handleError) // Utilise le même gestionnaire d'erreurs que login
    );
  }


  // --- Gestionnaire d'Erreurs ---
  /**
   * Gère les erreurs HTTP de manière centralisée.
   * @param error - L'objet HttpErrorResponse.
   * @returns Observable qui émet une erreur.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue!';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'erreur
      // Le corps de la réponse peut contenir des indices sur la cause
      errorMessage = `Code ${error.status}: ${error.message}`;
      // Si le backend envoie un message d'erreur spécifique (ex: dans error.error.message)
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message; // Utiliser le message du backend si disponible
      } else if (typeof error.error === 'string') {
        errorMessage = error.error; // Si le backend renvoie juste une string d'erreur
      }
    }
    console.error('AuthService Error:', errorMessage, error);
    // Renvoyer une erreur observable avec un message utile pour le composant
    return throwError(() => new Error(errorMessage)); // Renvoie l'erreur pour que le composant puisse la traiter
  }

  /**
   * Tente d'inscrire un nouveau club et son administrateur initial.
   * @param payload - Les informations du club et de l'admin (sans confirmPassword).
   * @returns Observable<Club> qui émet le club créé en cas de succès, ou une erreur.
   *          (Adapter le type de retour <Club> si l'API renvoie autre chose, ex: <void> ou <any>)
   */
  registerClub(payload: ClubRegistrationPayload): Observable<Club> { // Ou Observable<any> si le retour n'est pas un Club
    // Construit l'URL complète pour l'inscription club
    const registrationClubUrl = `${this.apiUrl}/club/inscription`; // <- Utilise le chemin correct


    // Fait l'appel POST, attend un objet Club en retour (à adapter si besoin)
    return this.http.post<Club>( // Ou <any>
      registrationClubUrl,
      payload
    ).pipe(
      tap(createdClub => {
        // Action optionnelle en cas de succès (ex: log)
        // Pas de mise à jour de l'état de connexion ici non plus.
      }),
      catchError(this.handleError) // Réutilise le gestionnaire d'erreurs
    );
  }
}




// src/app/services/auth.service.ts

/**
 * Importations des modules et des types nécessaires.
 */
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environments'; // Pour l'URL de base de l'API
import { catchError, tap } from 'rxjs/operators'; // Opérateurs RxJS
import { Membre, MembrePayload } from '../../model/membre'; // Modèles pour les membres
import { Club, ClubRegistrationPayload } from '../../model/club';
import {RoleType} from '../../model/role'; // Modèles pour les clubs

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que AuthService est un service fourni au niveau racine de l'application.
 * Une instance unique (singleton) sera créée et partagée.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Injection de HttpClient pour effectuer des requêtes HTTP vers le backend.
   */
  private http = inject(HttpClient);

  /**
   * URL de base pour les endpoints d'authentification de l'API.
   * Exemple: "https://api.example.com/api/auth"
   */
  private apiUrl = `${environment.apiUrl}/auth`;

  /**
   * @property {boolean} connecte
   * @description Indicateur de l'état de connexion de l'utilisateur.
   * `true` si un utilisateur est authentifié (JWT valide traité), `false` sinon.
   * Les composants peuvent observer ou utiliser cette propriété pour adapter l'UI.
   */
  connecte = false;

  /**
   * @property {string | null} role
   * @description Rôle de l'utilisateur actuellement connecté (ex: 'MEMBRE', 'ADMIN', 'RESERVATION').
   * Extrait du JWT. `null` si aucun utilisateur n'est connecté ou si le rôle n'est pas défini.
   * Utilisé pour le contrôle d'accès basé sur les rôles (RBAC) côté frontend.
   */
  role: string | null = null; // Pourrait être typé avec RoleType pour plus de sécurité

  /**
   * @property {number | null} managedClubId
   * @description L'ID du club géré par l'utilisateur si celui-ci a un rôle
   *              de 'RESERVATION' ou 'ADMIN'. Extrait du JWT.
   *              `null` si l'utilisateur n'est pas un gestionnaire de club ou n'est pas connecté.
   */
  managedClubId: number | null = null;

  /**
   * Constructeur du service.
   * Exécuté une seule fois lors de la création de l'instance du service.
   * Tente de récupérer un JWT existant depuis le localStorage pour restaurer
   * l'état de connexion si l'utilisateur avait une session active.
   */
  constructor() {
    const jwt = localStorage.getItem("jwt"); // Récupère le JWT du localStorage
    if (jwt != null) { // Si un JWT est trouvé
      this.decodeJwt(jwt); // Tente de le décoder et de restaurer l'état de session
    }
  }

  /**
   * Traite le JSON Web Token (JWT) reçu pour établir ou restaurer une session utilisateur.
   * Cette fonction stocke le token, décode sa charge utile (payload) pour extraire
   * les informations utilisateur (notamment le rôle et l'ID du club géré),
   * et met à jour l'état de connexion de l'application (`this.connecte`, `this.role`, `this.managedClubId`).
   *
   * @param jwt La chaîne de caractères JWT reçue après une authentification réussie ou récupérée du localStorage.
   */
  decodeJwt(jwt: string): void { // void car elle modifie l'état interne du service

    // 1. Stocker le JWT reçu dans le localStorage du navigateur.
    //    `localStorage` permet au token de persister même si l'utilisateur ferme l'onglet
    //    ou le navigateur (selon la configuration du navigateur).
    //    Le token sera ainsi disponible lors des prochaines visites ou rechargements.
    localStorage.setItem("jwt", jwt);

    // 2. Diviser la chaîne JWT en ses trois composants : En-tête, Charge utile, Signature.
    //    Un JWT a la forme "xxxxx.yyyyy.zzzzz". Nous avons besoin de la partie "yyyyy".
    const splitJwt = jwt.split(".");
    if (splitJwt.length < 2) {
      console.error("AuthService: JWT invalide - ne peut pas être splitté.");
      this.deconnexion(); // Réinitialise l'état si le JWT est malformé
      return;
    }

    // 3. Récupérer la deuxième partie du JWT (index 1), qui est la Charge utile (Payload).
    //    La charge utile contient les "claims" (revendications) : informations sur l'utilisateur
    //    (comme son ID, son rôle, son nom) et des métadonnées du token (comme la date d'expiration `exp`).
    const jwtBodyEncoded = splitJwt[1];

    // 4. Décoder la chaîne de la Charge utile qui est encodée en Base64Url.
    //    `atob()` décode une chaîne encodée en Base64.
    //    Note: Pour un décodage Base64Url strict, il faudrait remplacer les caractères '-' par '+' et '_' par '/',
    //    et potentiellement ajouter du padding '=' si nécessaire, avant d'appeler atob().
    //    Cependant, pour de nombreux JWT simples, `atob()` peut fonctionner directement.
    let jsonBody: string;
    try {
      // Il est plus sûr de gérer le décodage Base64Url correctement.
      const base64 = jwtBodyEncoded.replace(/-/g, '+').replace(/_/g, '/');
      // Ajout du padding si nécessaire pour que la longueur soit un multiple de 4
      const paddedBase64 = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
      jsonBody = atob(paddedBase64);
    } catch (e) {
      console.error("AuthService: Erreur lors du décodage Base64 du JWT.", e);
      this.deconnexion(); // Réinitialise l'état en cas d'erreur de décodage
      return;
    }

    // 5. Analyser (parser) la chaîne JSON obtenue après le décodage de la Charge utile.
    //    Ceci transforme la chaîne JSON en un objet JavaScript.
    let body: any; // Utiliser 'any' ici car la structure exacte du payload peut varier, bien qu'on s'attende à 'role' et 'managedClubId'.
    try {
      body = JSON.parse(jsonBody);
    } catch (e) {
      console.error("AuthService: Erreur lors du parsing JSON du JWT.", e);
      this.deconnexion();
      return;
    }

    // 6. (Optionnel) Afficher la charge utile décodée pour le débogage.
    // console.log("AuthService: Payload JWT décodé:", body);

    // 7. Extraire les informations de la charge utile et les stocker dans les propriétés du service.
    //    `body.role`: Récupère la valeur de la claim 'role'.
    //    `body.managedClubId ?? null`: Récupère la claim 'managedClubId'. L'opérateur `??` (nullish coalescing)
    //                                 assigne `null` si `body.managedClubId` est `undefined` ou `null`.
    this.role = body.role || null; // S'assure que role est null si non présent
    this.managedClubId = body.managedClubId ?? null;

    // 8. Mettre à jour l'état de connexion à `true`.
    this.connecte = true;
  }


  /**
   * Déconnecte l'utilisateur.
   * Supprime le JWT du localStorage et réinitialise les propriétés d'état du service.
   */
  deconnexion(): void {
    localStorage.removeItem("jwt"); // Supprime le token du stockage persistant.
    this.connecte = false;         // Met l'état de connexion à false.
    this.role = null;              // Réinitialise le rôle.
    this.managedClubId = null;     // Réinitialise l'ID du club géré.
    // Il pourrait être utile d'émettre un événement ici pour que d'autres parties de l'appli réagissent à la déconnexion.
    // Par exemple, via un `Subject` RxJS.
  }

  /**
   * Retourne l'ID du club géré par l'utilisateur connecté.
   * @returns L'ID du club ou `null`.
   */
  getManagedClubId(): number | null {
    return this.managedClubId;
  }

  /**
   * Retourne le rôle de l'utilisateur connecté.
   * @returns Le rôle sous forme de chaîne ou `null`.
   */
  getRole(): string | null { // Pourrait être RoleType | null
    return this.role;
  }


  /**
   * Tente de connecter l'utilisateur en envoyant ses identifiants (email/mot de passe) à l'API.
   * Correspond à l'endpoint POST /api/auth/connexion [2].
   * Si la connexion réussit (réponse 2xx du serveur), l'API retourne un JWT.
   * Ce JWT est alors traité par `decodeJwt`.
   * @param credentials Un objet contenant `email` et `password`.
   * @returns Un `Observable<string>` qui émet le JWT brut en cas de succès, ou une erreur.
   *          Le `tap` intercepte ce JWT pour appeler `decodeJwt`. Le composant pourrait ne pas
   *          avoir besoin de s'abonner au JWT lui-même si `decodeJwt` fait tout le travail.
   *          Souvent, un `Observable<void>` ou `Observable<boolean>` est retourné ici pour indiquer
   *          simplement le succès/échec de la tentative de connexion.
   */
  login(credentials: { email: string, password: any }): Observable<string> { // Le type de password est 'any', attention.
    return this.http.post(
      `${this.apiUrl}/connexion`, // URL de l'endpoint de connexion
      credentials,                // Corps de la requête (email, password)
      { responseType: 'text' }    // Option importante : indique à HttpClient que la réponse
      // attendue est une simple chaîne de texte (le JWT), et non du JSON.
    ).pipe(
      tap(jwt => {
        // Cet opérateur `tap` est exécuté si la requête HTTP réussit (statut 2xx).
        // `jwt` est la chaîne de texte (le token) retournée par le serveur.
        this.decodeJwt(jwt); // Traite le JWT pour mettre à jour l'état de l'application.
      }),
      catchError(this.handleError) // Gère les erreurs HTTP (ex: identifiants incorrects -> 401).
    );
  }

  /**
   * Tente d'inscrire un nouveau membre.
   * Correspond à l'endpoint POST /api/auth/membre/inscription?codeClub={codeClub} [2].
   * @param payload Un objet `MembrePayload` contenant les informations du nouveau membre.
   * @param codeClub Le code unique du club que le membre souhaite rejoindre (passé en paramètre de requête).
   * @returns Un `Observable<Membre>` qui émet l'objet `Membre` créé par le backend en cas de succès.
   */
  register(payload: MembrePayload, codeClub: string): Observable<Membre> {
    // Prépare les paramètres de requête pour le codeClub.
    const params = new HttpParams().set('codeClub', codeClub);
    const registrationUrl = `${this.apiUrl}/membre/inscription`; // URL de l'endpoint d'inscription membre.

    console.log(`AuthService: Appel POST (register) vers ${registrationUrl} avec codeClub=${codeClub} et payload:`, payload);

    return this.http.post<Membre>( // S'attend à recevoir un objet Membre complet.
      registrationUrl,
      payload,                // Corps de la requête (données du membre).
      { params: params }      // Ajoute le `codeClub` comme paramètre de requête.
    ).pipe(
      tap(createdMember => {
        console.log('AuthService: Membre inscrit avec succès:', createdMember);
        // Note: L'inscription réussie ne connecte PAS automatiquement l'utilisateur ici.
        // L'utilisateur devra se connecter séparément après son inscription.
        // C'est un choix de flux d'application.
      }),
      catchError(this.handleError) // Gestion des erreurs (ex: email déjà utilisé, code club invalide).
    );
  }

  /**
   * Tente d'inscrire un nouveau club et son administrateur initial.
   * Correspond à l'endpoint POST /api/auth/club/inscription.
   * @param payload Un objet `ClubRegistrationPayload` contenant les informations du club et de son premier admin.
   * @returns Un `Observable<Club>` qui émet l'objet `Club` créé par le backend.
   *          (Adapter le type de retour si l'API renvoie autre chose, ex: `<void>` ou `<any>`).
   */
  registerClub(payload: ClubRegistrationPayload): Observable<Club> { // Ou Observable<any>
    const registrationClubUrl = `${this.apiUrl}/club/inscription`; // URL de l'endpoint d'inscription club.
    console.log(`AuthService: Appel POST (registerClub) vers ${registrationClubUrl} avec payload:`, payload);

    return this.http.post<Club>( // S'attend à recevoir un objet Club.
      registrationClubUrl,
      payload                 // Corps de la requête (données du club et de l'admin).
    ).pipe(
      tap(createdClub => {
        console.log('AuthService: Club inscrit avec succès:', createdClub);
        // De même, l'inscription du club ne connecte pas l'admin automatiquement.
      }),
      catchError(this.handleError) // Gestion des erreurs.
    );
  }

  /**
   * @private handleError
   * Gestionnaire d'erreurs HTTP privé pour ce service.
   * Formate les erreurs pour une meilleure lisibilité et propagation.
   * @param error L'objet `HttpErrorResponse` capturé.
   * @returns Un Observable qui émet une `Error` avec un message formaté.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue!'; // Message par défaut.
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau.
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur renvoyée par le backend.
      // `error.message` est le message HTTP générique (ex: "Unauthorized").
      // `error.error` est le corps de la réponse d'erreur du backend.
      errorMessage = `Code ${error.status}: ${error.message}`; // Commence avec le message HTTP de base.

      // Tentative d'utiliser un message d'erreur plus spécifique du backend.
      if (error.error && typeof error.error === 'object' && error.error.message) {
        // Si error.error est un objet avec une propriété 'message' (structure commune).
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string' && error.error.trim() !== '') {
        // Si error.error est une chaîne de caractères non vide.
        errorMessage = error.error;
      }
      // Si aucune de ces conditions n'est remplie, errorMessage reste `Code X: Message HTTP`.
    }
    console.error('AuthService Error:', errorMessage, error); // Log complet pour le débogage.
    // Renvoie un Observable qui émet immédiatement l'erreur avec le message traité.
    return throwError(() => new Error(errorMessage));
  }
}

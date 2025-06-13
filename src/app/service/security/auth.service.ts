import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { Membre, MembrePayload } from '../../model/membre';
import { Club, ClubRegistrationPayload } from '../../model/club';
import {RoleType} from '../../model/role';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'AuthService' qui gère l'authentification et l'inscription des utilisateurs.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  /** Indique l'état de connexion de l'utilisateur. */
  connecte = false;
  /** Rôle de l'utilisateur connecté (ex: 'MEMBRE', 'ADMIN'). */
  role: string | null = null;
  /** ID du club géré par l'utilisateur connecté (si applicable). */
  managedClubId: number | null = null;

  constructor() {
    const jwt = localStorage.getItem("jwt");
    if (jwt != null) {
      this.decodeJwt(jwt);
    }
  }

  /**
   * @method decodeJwt
   * @description Traite le JSON Web Token (JWT) pour établir ou restaurer une session utilisateur.
   * Stocke le token, décode sa charge utile et met à jour l'état de connexion.
   * @param jwt La chaîne de caractères JWT.
   */
  decodeJwt(jwt: string): void {
    localStorage.setItem("jwt", jwt);

    const splitJwt = jwt.split(".");
    if (splitJwt.length < 2) {
      console.error("AuthService: JWT invalide - ne peut pas être splitté.");
      this.deconnexion();
      return;
    }

    const jwtBodyEncoded = splitJwt[1];
    let jsonBody: string;
    try {
      const base64 = jwtBodyEncoded.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64 + '=='.substring(0, (4 - base64.length % 4) % 4);
      jsonBody = atob(paddedBase64);
    } catch (e) {
      console.error("AuthService: Erreur lors du décodage Base64 du JWT.", e);
      this.deconnexion();
      return;
    }

    let body: any;
    try {
      body = JSON.parse(jsonBody);
    } catch (e) {
      console.error("AuthService: Erreur lors du parsing JSON du JWT.", e);
      this.deconnexion();
      return;
    }

    this.role = body.role || null;
    this.managedClubId = body.managedClubId ?? null;
    this.connecte = true;
  }

  /**
   * @method deconnexion
   * @description Déconnecte l'utilisateur.
   * Supprime le JWT du localStorage et réinitialise les propriétés d'état.
   */
  deconnexion(): void {
    localStorage.removeItem("jwt");
    this.connecte = false;
    this.role = null;
    this.managedClubId = null;
  }

  /**
   * @method getManagedClubId
   * @description Retourne l'ID du club géré par l'utilisateur.
   * @returns L'ID du club ou `null`.
   */
  getManagedClubId(): number | null {
    return this.managedClubId;
  }

  /**
   * @method getRole
   * @description Retourne le rôle de l'utilisateur connecté.
   * @returns Le rôle ou `null`.
   */
  getRole(): string | null {
    return this.role;
  }

  /**
   * @method login
   * @description Tente de connecter l'utilisateur avec ses identifiants.
   * @param credentials Un objet contenant `email` et `password`.
   * @returns Un `Observable<string>` qui émet le JWT brut en cas de succès.
   */
  login(credentials: { email: string, password: any }): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/connexion`,
      credentials,
      { responseType: 'text' }
    ).pipe(
      tap(jwt => {
        this.decodeJwt(jwt);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * @method register
   * @description Tente d'inscrire un nouveau membre.
   * @param payload Les informations du nouveau membre.
   * @param codeClub Le code du club que le membre souhaite rejoindre.
   * @returns Un `Observable<Membre>` qui émet l'objet `Membre` créé.
   */
  register(payload: MembrePayload, codeClub: string): Observable<Membre> {
    const params = new HttpParams().set('codeClub', codeClub);
    const registrationUrl = `${this.apiUrl}/membre/inscription`;

    console.log(`AuthService: Appel POST (register) vers ${registrationUrl} avec codeClub=${codeClub} et payload:`, payload);

    return this.http.post<Membre>(
      registrationUrl,
      payload,
      { params: params }
    ).pipe(
      tap(createdMember => {
        console.log('AuthService: Membre inscrit avec succès:', createdMember);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * @method registerClub
   * @description Tente d'inscrire un nouveau club et son administrateur initial.
   * @param payload Les informations du club et de son premier admin.
   * @returns Un `Observable<Club>` qui émet l'objet `Club` créé.
   */
  registerClub(payload: ClubRegistrationPayload): Observable<Club> {
    const registrationClubUrl = `${this.apiUrl}/club/inscription`;
    console.log(`AuthService: Appel POST (registerClub) vers ${registrationClubUrl} avec payload:`, payload);

    return this.http.post<Club>(
      registrationClubUrl,
      payload
    ).pipe(
      tap(createdClub => {
        console.log('AuthService: Club inscrit avec succès:', createdClub);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * @method requestPasswordReset
   * @description Demande un lien de réinitialisation de mot de passe par email.
   * @param email L'email de l'utilisateur.
   * @returns Un `Observable<string>` de la réponse textuelle du backend.
   */
  requestPasswordReset(email: string): Observable<string> {
    const params = new HttpParams().set('email', email);
    return this.http.post<string>(`${this.apiUrl}/mail-password-reset`, {}, { params, responseType: 'text' as 'json' })
      .pipe(
        tap(response => console.log('Password reset request successful', response)),
        catchError(this.handleError)
      );
  }

  /**
   * @method resetPassword
   * @description Réinitialise le mot de passe d'un utilisateur.
   * @param token Le token de réinitialisation.
   * @param newPassword Le nouveau mot de passe.
   * @returns Un `Observable<string>` de la réponse textuelle du backend.
   */
  resetPassword(token: string, newPassword: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword }, { responseType: 'text' });
  }

  /**
   * @method validateResetToken
   * @description Valide un token de réinitialisation de mot de passe.
   * @param token Le token à valider.
   * @returns Un `Observable<void>`.
   */
  validateResetToken(token: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/validate-reset-token`, { params: { token } });
  }

  /**
   * @method changePasswordConnectedUser
   * @description Permet à un utilisateur connecté de changer son mot de passe.
   * @param payload Un objet contenant le mot de passe actuel et le nouveau mot de passe.
   * @returns Un `Observable<any>` de la réponse du backend.
   */
  changePasswordConnectedUser(payload: { currentPassword: string, newPassword: string }): Observable<any> {
    return this.http.post<string>(`${this.apiUrl}/change-password`, payload, { responseType: 'text' as 'json' })
      .pipe(
        tap(response => console.log('AuthService: Changement de mot de passe réussi.', response)),
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
    let errorMessage = 'Une erreur inconnue est survenue!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code ${error.status}: ${error.message}`;
      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string' && error.error.trim() !== '') {
        errorMessage = error.error;
      }
    }
    console.error('AuthService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

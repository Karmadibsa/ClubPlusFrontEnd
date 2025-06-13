import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleType } from '../../model/role';
import { catchError, tap } from 'rxjs/operators';
import { Membre } from '../../model/membre';
import { Club } from '../../model/club';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'MembreService' qui gère les opérations liées aux membres.
 * Fournit une instance unique dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class MembreService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/membres`;

  /**
   * @method getLatestMembers
   * @description Récupère les 5 derniers membres inscrits pour le club géré.
   * La gestion des erreurs est déléguée au composant appelant.
   * @returns Un `Observable` de tableau d'objets `Membre`.
   */
  getLatestMembers(): Observable<Membre[]> {
    const url = `${this.apiUrl}/managed-club/latest`;
    console.log('Appel API Membres (getLatestMembers):', url);

    return this.http.get<Membre[]>(url);
  }

  /**
   * @method getCurrentUserProfile
   * @description Récupère le profil du membre authentifié.
   * @returns Un `Observable` de l'objet `Membre` du profil.
   */
  getCurrentUserProfile(): Observable<Membre> {
    const url = `${this.apiUrl}/profile`;
    console.log(`MembreService: Appel GET (getCurrentUserProfile) ${url}`);
    return this.http.get<Membre>(url).pipe(
      tap(data => console.log(`MembreService: Profil reçu:`, data)),
      catchError(this.handleError)
    );
  }

  /**
   * @method updateCurrentUserProfile
   * @description Met à jour le profil du membre authentifié.
   * @param data Les champs du membre à mettre à jour.
   * @returns Un `Observable` de l'objet `Membre` mis à jour.
   */
  updateCurrentUserProfile(data: Partial<Membre>): Observable<Membre> {
    const url = `${this.apiUrl}/profile`;
    console.log(`MembreService: Appel PUT (updateCurrentUserProfile) ${url} avec données:`, data);
    return this.http.put<Membre>(url, data).pipe(
      tap(updatedProfile => console.log(`MembreService: Profil mis à jour:`, updatedProfile)),
      catchError(this.handleError)
    );
  }

  /**
   * @method getMembersByClub
   * @description Récupère la liste des membres d'un club spécifique.
   * La gestion des erreurs est déléguée au composant appelant.
   * @param clubId L'ID du club.
   * @returns Un `Observable` de tableau d'objets `Membre`.
   */
  getMembersByClub(clubId: number): Observable<Membre[]> {
    const url = `${environment.apiUrl}/clubs/${clubId}/membres`;
    console.log('Appel API Membres (getMembersByClub):', url);

    return this.http.get<Membre[]>(url);
  }

  /**
   * @method changeMemberRole
   * @description Modifie le rôle d'un membre dans un club.
   * @param membreId L'ID du membre.
   * @param clubId L'ID du club.
   * @param newRole Le nouveau rôle à assigner.
   * @returns Un `Observable` de l'objet `Membre` mis à jour.
   */
  changeMemberRole(membreId: number, clubId: number, newRole: RoleType): Observable<Membre> {
    const url = `${this.apiUrl}/${membreId}/role`;
    let params = new HttpParams();
    params = params.append('clubId', clubId.toString());
    params = params.append('newRole', newRole);

    console.log(`MembreService: Appel PUT (changeMemberRole) vers ${url} avec params:`, params.toString());

    return this.http.put<Membre>(url, null, { params: params }).pipe(
      tap(updatedMember => console.log(`MembreService: Rôle du membre ${membreId} mis à jour:`, updatedMember)),
      catchError(this.handleError)
    );
  }

  /**
   * @method deleteCurrentUserProfile
   * @description Supprime le profil de l'utilisateur authentifié.
   * @returns `Observable<void>`.
   */
  deleteCurrentUserProfile(): Observable<void> {
    const url = `${this.apiUrl}/profile`;
    console.log(`MembreService: Appel DELETE (deleteCurrentUserProfile) ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log('MembreService: Profil utilisateur supprimé avec succès')),
      catchError(this.handleError)
    );
  }

  /**
   * @method getUserClubs
   * @description Récupère la liste des clubs auxquels l'utilisateur est membre.
   * @returns Un `Observable` de tableau d'objets `Club`.
   */
  getUserClubs(): Observable<Club[]> {
    const url = `${this.apiUrl}/profile/clubs`;
    console.log(`MembreService: Appel GET (getUserClubs) vers ${url}`);
    return this.http.get<Club[]>(url).pipe(
      tap(clubs => console.log('MembreService: Clubs utilisateur reçus', clubs)),
      catchError(this.handleError)
    );
  }

  /**
   * @method joinClubByCode
   * @description Permet de rejoindre un club via son code.
   * @param codeClub Le code unique du club à rejoindre.
   * @returns Un `Observable` de l'objet `Club` rejoint.
   */
  joinClubByCode(codeClub: string): Observable<Club> {
    const url = `${this.apiUrl}/profile/join`;
    const params = new HttpParams().set('codeClub', codeClub);
    console.log(`MembreService: Appel POST (joinClubByCode) vers ${url} avec codeClub=${codeClub}`);

    return this.http.post<Club>(url, null, { params: params }).pipe(
      tap(joinedClub => console.log('MembreService: Club rejoint', joinedClub)),
      catchError(this.handleError)
    );
  }

  /**
   * @method leaveClub
   * @description Permet de quitter un club spécifique.
   * @param clubId L'ID du club à quitter.
   * @returns `Observable<void>`.
   */
  leaveClub(clubId: number): Observable<void> {
    const url = `${this.apiUrl}/profile/leave/${clubId}`;
    console.log(`MembreService: Appel DELETE (leaveClub) vers ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`MembreService: Club ${clubId} quitté avec succès`)),
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
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      const backendError = error.error;
      const backendMessage = backendError?.message || backendError?.error || JSON.stringify(backendError);
      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    console.error('MembreService API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

/**
 * Importations des modules et des types nécessaires.
 */
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoleType } from '../../model/role'; // Type pour les rôles utilisateurs
import { catchError, tap } from 'rxjs/operators';
import { Membre } from '../../model/membre';   // Modèle de données pour un membre
import { Club } from '../../model/club';     // Modèle de données pour un club

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que MembreService est un service fourni au niveau racine de l'application.
 * Une instance unique sera créée et partagée globalement.
 */
@Injectable({
  providedIn: 'root'
})
export class MembreService {
  /**
   * Injection de HttpClient pour les requêtes HTTP.
   */
  private http = inject(HttpClient);

  /**
   * URL de base pour les appels à l'API concernant les membres.
   */
  private apiUrl = `${environment.apiUrl}/membres`;

  /**
   * Récupère les 5 derniers membres inscrits pour le club géré par l'utilisateur connecté.
   * Correspond à l'endpoint GET /api/membres/managed-club/latest.
   * Le backend identifie le club via l'utilisateur authentifié.
   * @returns Un Observable contenant un tableau d'objets `Membre`.
   */
  getLatestMembers(): Observable<Membre[]> {
    const url = `${this.apiUrl}/managed-club/latest`;
    console.log('Appel API Membres (getLatestMembers):', url); // Log de débogage.

    // Requête GET. Le type de réponse attendu est Membre[].
    return this.http.get<Membre[]>(url);
    // Note: La gestion d'erreur est ici déléguée au composant appelant (pas de .pipe(catchError(...))).
    // C'est un choix de conception, comme dans EventService.getNextEvents().
  }

  /**
   * Récupère le profil du membre actuellement authentifié.
   * Correspond à l'endpoint GET /api/membres/profile.
   * @returns Un Observable qui émettra un objet `Membre` représentant le profil.
   */
  getCurrentUserProfile(): Observable<Membre> {
    const url = `${this.apiUrl}/profile`;
    console.log(`MembreService: Appel GET (getCurrentUserProfile) ${url}`);
    return this.http.get<Membre>(url).pipe(
      tap(data => console.log(`MembreService: Profil reçu:`, data)), // Log les données reçues
      catchError(this.handleError) // Gère les erreurs via la méthode privée
    );
  }

  /**
   * Met à jour le profil du membre actuellement authentifié.
   * Correspond à l'endpoint PUT /api/membres/profile.
   * @param data Un objet `Partial<Membre>` contenant les champs à mettre à jour.
   *             `Partial` rend toutes les propriétés de `Membre` optionnelles,
   *             permettant une mise à jour partielle si le backend le supporte avec PUT.
   * @returns Un Observable qui émettra l'objet `Membre` mis à jour.
   */
  updateCurrentUserProfile(data: Partial<Membre>): Observable<Membre> {
    const url = `${this.apiUrl}/profile`;
    console.log(`MembreService: Appel PUT (updateCurrentUserProfile) ${url} avec données:`, data);
    return this.http.put<Membre>(url, data).pipe( // Requête PUT avec les données de mise à jour
      tap(updatedProfile => console.log(`MembreService: Profil mis à jour:`, updatedProfile)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère la liste des membres d'un club spécifique.
   * Correspond à l'endpoint GET /api/clubs/{clubId}/membres.
   * @param clubId L'ID du club dont on veut lister les membres.
   * @returns Un Observable contenant un tableau d'objets `Membre`.
   */
  getMembersByClub(clubId: number): Observable<Membre[]> {
    const url = `${environment.apiUrl}/clubs/${clubId}/membres`; // Note: URL construite différemment ici
    console.log('Appel API Membres (getMembersByClub):', url);

    return this.http.get<Membre[]>(url);
    // Note: Gestion d'erreur également déléguée au composant ici.
  }

  /**
   * Modifie le rôle d'un membre spécifique au sein d'un club donné.
   * Correspond à l'endpoint PUT /api/membres/{membreId}/role?clubId={clubId}&newRole={newRole}.
   * @param membreId L'ID du membre dont le rôle est modifié.
   * @param clubId L'ID du club contextuel pour ce changement de rôle.
   * @param newRole Le nouveau rôle (type `RoleType`) à assigner.
   * @returns Un Observable qui émettra l'objet `Membre` mis à jour (si l'API le retourne).
   *          Ajuster à `Observable<void>` si l'API renvoie un 204 No Content.
   */
  changeMemberRole(membreId: number, clubId: number, newRole: RoleType): Observable<Membre> {
    const url = `${this.apiUrl}/${membreId}/role`; // URL de base pour l'action.

    // Construction des paramètres de requête (query parameters).
    let params = new HttpParams();
    params = params.append('clubId', clubId.toString()); // `clubId` est converti en chaîne.
    params = params.append('newRole', newRole);        // `newRole` est déjà une chaîne ('MEMBRE', 'RESERVATION', etc.).

    console.log(`MembreService: Appel PUT (changeMemberRole) vers ${url} avec params:`, params.toString());

    // Requête PUT. Le corps de la requête (deuxième argument) est `null` car les
    // informations sont passées via les `params` de requête.
    return this.http.put<Membre>(url, null, { params: params }).pipe(
      tap(updatedMember => console.log(`MembreService: Rôle du membre ${membreId} mis à jour:`, updatedMember)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime le profil de l'utilisateur actuellement connecté (soft delete ou hard delete selon l'API).
   * Correspond à l'endpoint DELETE /api/membres/profile.
   * @returns `Observable<void>` car une suppression réussie ne retourne généralement pas de contenu.
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
   * Récupère la liste des clubs auxquels l'utilisateur actuellement connecté est membre.
   * Correspond à l'endpoint GET /api/membres/profile/clubs.
   * @returns Un Observable contenant un tableau d'objets `Club`.
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
   * Permet à l'utilisateur connecté de rejoindre un club en utilisant son code unique.
   * Correspond à l'endpoint POST /api/membres/profile/join?codeClub={codeClub}.
   * @param codeClub Le code unique du club à rejoindre.
   * @returns Un Observable qui émettra l'objet `Club` rejoint (si l'API le retourne).
   *          Ajuster si l'API retourne `void` ou autre chose.
   */
  joinClubByCode(codeClub: string): Observable<Club> {
    const url = `${this.apiUrl}/profile/join`;
    const params = new HttpParams().set('codeClub', codeClub); // `codeClub` comme paramètre de requête.
    console.log(`MembreService: Appel POST (joinClubByCode) vers ${url} avec codeClub=${codeClub}`);

    // Requête POST avec un corps `null` car l'information est dans les `params`.
    return this.http.post<Club>(url, null, { params: params }).pipe(
      tap(joinedClub => console.log('MembreService: Club rejoint', joinedClub)),
      catchError(this.handleError)
    );
  }

  /**
   * Permet à l'utilisateur connecté de quitter un club spécifique.
   * Correspond à l'endpoint DELETE /api/membres/profile/leave/{clubId}.
   * @param clubId L'ID du club à quitter.
   * @returns `Observable<void>` car l'opération ne retourne généralement pas de contenu.
   */
  leaveClub(clubId: number): Observable<void> {
    const url = `${this.apiUrl}/profile/leave/${clubId}`; // L'ID du club est dans le chemin.
    console.log(`MembreService: Appel DELETE (leaveClub) vers ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`MembreService: Club ${clubId} quitté avec succès`)),
      catchError(this.handleError)
    );
  }

  /**
   * @private handleError
   * Gestionnaire d'erreurs HTTP privé pour ce service.
   * @param error L'objet `HttpErrorResponse` capturé.
   * @returns Un Observable qui émet une `Error` avec un message formaté.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau.
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur du backend.
      const backendError = error.error;
      const backendMessage = backendError?.message || backendError?.error || JSON.stringify(backendError);
      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    console.error('MembreService API Error:', errorMessage, error); // Log pour le débogage.
    return throwError(() => new Error(errorMessage)); // Propagation de l'erreur formatée.
  }
}

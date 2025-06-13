import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Club } from '../../model/club';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'ClubService' qui gère les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer) pour les clubs.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clubs`;

  /**
   * @method getClubDetails
   * @description Récupère les détails d'un club spécifique.
   * @param clubId L'identifiant unique du club.
   * @returns Un `Observable` de l'objet `Club` détaillé.
   */
  getClubDetails(clubId: number): Observable<Club> {
    const url = `${this.apiUrl}/${clubId}`;

    return this.http.get<Club>(url).pipe(
      tap(data => console.log(`ClubService: Données reçues pour club ${clubId}:`, data)),
      catchError(this.handleError)
    );
  }

  /**
   * @method updateClub
   * @description Met à jour les informations d'un club existant.
   * @param clubId L'identifiant du club à mettre à jour.
   * @param clubData Les données partielles ou complètes du club à mettre à jour.
   * @returns Un `Observable` de l'objet `Club` mis à jour.
   */
  updateClub(clubId: number, clubData: Partial<Club>): Observable<Club> {
    const url = `${this.apiUrl}/${clubId}`;

    return this.http.put<Club>(url, clubData).pipe(
      tap(updatedClub => console.log(`ClubService: Club ${clubId} mis à jour (PUT):`, updatedClub)),
      catchError(this.handleError)
    );
  }

  /**
   * @method deleteClub
   * @description Supprime un club spécifique.
   * @param id L'identifiant numérique du club à supprimer.
   * @returns Un `Observable<void>` (pas de contenu retourné en cas de succès).
   */
  deleteClub(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`ClubService: Appel DELETE ${url}`);
    return this.http.delete<void>(url).pipe(
      tap(() => console.log(`ClubService: Club ${id} supprimé avec succès`)),
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
    console.error('ClubService API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

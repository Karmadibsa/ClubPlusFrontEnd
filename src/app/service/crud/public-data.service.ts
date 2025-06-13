import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HomepageStats } from '../../model/HomepageStats';
import { catchError, tap } from 'rxjs/operators';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'PublicDataService' qui gère la récupération des données publiques.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class PublicDataService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  /**
   * @method getHomepageStats
   * @description Récupère les statistiques agrégées pour la page d'accueil.
   * @returns Un `Observable` qui émet un objet `HomepageStats`.
   */
  getHomepageStats(): Observable<HomepageStats> {
    const url = `${this.apiUrl}/stats`;
    return this.http.get<HomepageStats>(url).pipe(
      tap(stats => console.log('PublicDataService: Statistiques de la page d\'accueil récupérées', stats)),
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
      const backendMessage = backendError?.message || backendError?.error || (typeof backendError === 'string' ? backendError : JSON.stringify(backendError));
      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    console.error('PublicDataService API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

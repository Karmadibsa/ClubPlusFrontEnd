import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {ContactFormData, ContactResponse} from '../model/contact';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'ContactService' pour l'envoi de messages via le formulaire de contact.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private http = inject(HttpClient);
  private contactApiUrl = `${environment.apiUrl}/contact`;

  /**
   * @method sendContactMessage
   * @description Envoie les données du formulaire de contact au backend.
   * @param formData Les données du formulaire.
   * @returns Un `Observable` de la réponse du serveur.
   */
  sendContactMessage(formData: ContactFormData): Observable<ContactResponse | string> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text' as 'json'
    };

    console.log('ContactService: Envoi des données au backend:', formData);

    return this.http.post<ContactResponse | string>(this.contactApiUrl, formData, httpOptions)
      .pipe(
        tap(response => console.log('ContactService: Réponse du backend reçue:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * @private handleError
   * @description Gère les erreurs HTTP de manière centralisée.
   * @param error L'erreur HTTP (`HttpErrorResponse`).
   * @returns Un `Observable` qui émet une erreur formatée.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion ou l\'URL du backend.';
      } else if (typeof error.error === 'string') {
        errorMessage = `Erreur ${error.status}: ${error.error}`;
      } else {
        errorMessage = `Erreur serveur ${error.status}: ${error.message}`;
      }
    }
    console.error('ContactService: Erreur lors de l\'appel API:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

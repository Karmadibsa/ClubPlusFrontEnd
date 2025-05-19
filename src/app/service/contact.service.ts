// src/app/services/contact.service.ts

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {environment} from '../../environments/environment';

// Interface pour les données du formulaire (optionnel mais bonne pratique)
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Interface pour la réponse attendue du backend (optionnel)
export interface ContactResponse {
  message: string; // Ou tout autre structure que votre backend retourne
}

@Injectable({
  providedIn: 'root' // Service disponible globalement
})
export class ContactService {

  private http = inject(HttpClient);
  // Définissez l'URL de base de votre API, par exemple depuis un fichier d'environnement
  // Pour l'instant, nous utilisons un chemin relatif ou une URL complète.
  private contactApiUrl = `${environment.apiUrl}/contact`; // Ou l'URL complète de votre backend

  constructor() { }

  /**
   * Envoie les données du formulaire de contact au backend.
   * @param formData Les données du formulaire.
   * @returns Un Observable avec la réponse du serveur.
   */
  sendContactMessage(formData: ContactFormData): Observable<ContactResponse | string> { // Accepte string pour les ResponseEntity<String>
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
   * Gère les erreurs HTTP.
   * @param error L'erreur HTTP.
   * @returns Un Observable qui émet une erreur.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau.
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'erreur.
      // Le corps de la réponse peut contenir des indices sur ce qui a mal tourné.
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

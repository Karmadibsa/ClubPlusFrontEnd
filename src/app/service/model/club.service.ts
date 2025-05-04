import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environments';
import {Club} from '../../model/club';
import {catchError, tap} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private http = inject(HttpClient);
  // Utilise l'URL de base de l'API définie dans les fichiers d'environnement
  private apiUrl = `${environment.apiUrl}/clubs`;

  // Charger les données existantes du club depuis l'API

  /**
   * Récupère les détails d'un club spécifique par son ID.
   * Correspond à: GET /api/club/{clubId}
   * @param clubId L'ID numérique du club à récupérer.
   * @returns Un Observable contenant les détails du Club.
   */
  getClubDetails(clubId: number): Observable<Club> {
    const url = `${this.apiUrl}/${clubId}`;
    console.log(`ClubService: Appel GET ${url}`);

    return this.http.get<Club>(url).pipe(
      tap(data => console.log(`ClubService: Données reçues pour club ${clubId}:`, data)), // Log les données reçues
      catchError(this.handleError) // Appelle le gestionnaire d'erreur
    );
  }

  /**
   * Met à jour les informations d'un club existant en utilisant PUT.
   * Correspond à: PUT /api/clubs/{clubId}
   * @param clubId L'ID numérique du club à mettre à jour.
   * @param clubData Un objet contenant les champs à mettre à jour.
   *                 Pour PUT, cela devrait idéalement être l'objet Club complet,
   *                 mais Partial<Club> fonctionne souvent si le backend est permissif.
   * @returns Un Observable contenant les détails du Club mis à jour.
   */
  updateClub(clubId: number, clubData: Partial<Club>): Observable<Club> { // Garde Partial<Club> pour flexibilité
    const url = `${this.apiUrl}/${clubId}`;
    console.log(`ClubService: Appel PUT ${url} avec données:`, clubData);

    // --- CORRECTION DE LA MÉTHODE HTTP ---
    // Utilise PUT comme demandé par l'API
    return this.http.put<Club>(url, clubData).pipe( // << CHANGEMENT ICI: put au lieu de patch
      tap(updatedClub => console.log(`ClubService: Club ${clubId} mis à jour (PUT):`, updatedClub)),
      catchError(this.handleError)
    );
  }





// --- Gestionnaire d'Erreurs Privé ---

  /**
   * Gère les erreurs provenant des appels HttpClient.
   * Log l'erreur et retourne un Observable qui échoue avec un message compréhensible.
   * @param error L'objet HttpErrorResponse reçu.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Le backend a retourné un code d'échec.
      // Le corps de la réponse peut contenir des indices sur ce qui a mal tourné.
      // Tente d'extraire un message d'erreur plus spécifique du backend
      const backendError = error.error; // Corps de l'erreur backend (peut être string, objet...)
      const backendMessage = backendError?.message || backendError?.error || JSON.stringify(backendError);

      errorMessage = `Erreur Serveur ${error.status}: ${backendMessage || error.message}`;
    }
    console.error('ClubService API Error:', errorMessage, error); // Log complet pour le débogage
    // Retourne un observable qui échoue avec le message d'erreur destiné à l'utilisateur
    return throwError(() => new Error(errorMessage));
  }

  deleteClub(id: number): Observable<void> { // Retourne Observable<void> car DELETE renvoie souvent 204 No Content
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


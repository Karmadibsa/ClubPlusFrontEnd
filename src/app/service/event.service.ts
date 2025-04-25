import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  // Utilise l'URL de base de l'API définie dans les fichiers d'environnement
  private apiUrl = `${environment.apiUrl}/events`;

  /**
   * Récupère les 5 prochains événements actifs pour le club géré par l'utilisateur connecté.
   * Appelle GET /api/events/managed-club/next-five
   * @returns Un Observable contenant un tableau d'Event.
   */
  getNextEvents(): Observable<Event[]> {
    const url = `${this.apiUrl}/clubs/next-event`;
    console.log('Appel API Events:', url); // Pour le débogage
    // Le backend détermine le club via l'utilisateur authentifié
    return this.http.get<Event[]>(url);
    // Note: La gestion des erreurs (catchError) est faite dans le composant pour cet exemple.
  }
}

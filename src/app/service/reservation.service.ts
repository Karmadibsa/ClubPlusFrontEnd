import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environments';
import {Reservation} from '../model/reservation';
import {Observable} from 'rxjs';
import {ReservationStatus} from '../model/reservationstatus';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  // Adaptez l'URL si elle est différente ou stockée dans les variables d'environnement
  private apiUrl = `${environment.apiUrl}/reservations`;


  // Récupère les réservations pour un événement spécifique, avec filtre optionnel par statut
  getReservationsByEvent(eventId: number, status?: ReservationStatus | null): Observable<Reservation[]> {
    let params = new HttpParams();
    if (status) {
      // Ajoute le paramètre 'status' seulement s'il est fourni
      params = params.set('status', status);
    }

    // Construit l'URL et effectue la requête GET avec les paramètres
    const url = `${this.apiUrl}/event/${eventId}`;
    return this.http.get<Reservation[]>(url, { params });
  }
}

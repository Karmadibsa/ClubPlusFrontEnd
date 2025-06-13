import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { MembreService } from '../crud/membre.service';
import { EventService } from '../crud/event.service';
import { Membre } from '../../model/membre';
import { Evenement } from '../../model/evenement';
import { environment } from '../../../environments/environment';

/**
 * Interface pour les données combinées retournées par le service.
 */
export interface DashboardData {
  summary: DashboardSummaryDTO | null;
  latestMembers: Membre[] | null;
  nextEvents: Evenement[] | null;
}

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'DashboardService' qui gère la récupération des données agrégées pour le tableau de bord d'un club.
 * Il combine plusieurs appels API en utilisant `forkJoin`.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private membreService = inject(MembreService);
  private eventService = inject(EventService);

  private apiUrl = `${environment.apiUrl}`;

  /**
   * @method getDashboardData
   * @description Récupère toutes les données nécessaires pour le tableau de bord d'un club.
   * Combine les données de résumé, les derniers membres et les prochains événements.
   * Chaque appel partiel est géré pour ne pas faire échouer l'ensemble de l'opération.
   * @param clubId L'identifiant du club.
   * @returns Un `Observable` qui émet un objet `DashboardData` ou `null` si tous les appels partiels échouent.
   */
  getDashboardData(clubId: number): Observable<DashboardData | null> {
    const summaryUrl = `${this.apiUrl}/stats/clubs/${clubId}/dashboard-summary`;

    const summary$: Observable<DashboardSummaryDTO | null> = this.http.get<DashboardSummaryDTO>(summaryUrl).pipe(
      catchError(err => {
        console.error("DashboardService: Erreur API lors du chargement du résumé:", err);
        return of(null); // Retourne `null` en cas d'erreur partielle.
      })
    );

    const latestMembers$: Observable<Membre[] | null> = this.membreService.getLatestMembers().pipe(
      catchError(err => {
        console.error("DashboardService: Erreur API lors du chargement des derniers membres:", err);
        return of(null);
      })
    );

    const nextEvents$: Observable<Evenement[] | null> = this.eventService.getNextEvents().pipe(
      catchError(err => {
        console.error("DashboardService: Erreur API lors du chargement des prochains événements:", err);
        return of(null);
      })
    );

    return forkJoin([summary$, latestMembers$, nextEvents$]).pipe(
      map(([summaryResponse, membersResponse, eventsResponse]) => {
        // Si tous les appels ont échoué, retourne `null` globalement.
        if (summaryResponse === null && membersResponse === null && eventsResponse === null) {
          console.warn("DashboardService: Tous les appels pour les données du tableau de bord ont échoué.");
          return null;
        }
        return {
          summary: summaryResponse,
          latestMembers: membersResponse,
          nextEvents: eventsResponse
        };
      }),
      catchError(err => {
        console.error("DashboardService: Erreur inattendue dans forkJoin:", err);
        return of(null);
      })
    );
  }
}

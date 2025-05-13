// src/app/service/dashboard/dashboard.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { MembreService } from '../crud/membre.service';
import { EventService } from '../crud/event.service';
import { Membre } from '../../model/membre';
import { Evenement } from '../../model/evenement';
import {environment} from '../../../environments/environments';

// Interface pour les données combinées retournées par le service
export interface DashboardData {
  summary: DashboardSummaryDTO | null;
  latestMembers: Membre[] | null;
  nextEvents: Evenement[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private membreService = inject(MembreService);
  private eventService = inject(EventService);

  // Récupérez l'URL de base depuis les variables d'environnement
  private apiUrl = `${environment.apiUrl}`;

  constructor() { }

  /**
   * Récupère toutes les données nécessaires pour le dashboard d'un club.
   * @param clubId L'ID du club.
   * @returns Un Observable émettant un objet DashboardData ou null en cas d'erreur partielle.
   */
  getDashboardData(clubId: number): Observable<DashboardData | null> {
    const summaryUrl = `${this.apiUrl}/stats/clubs/${clubId}/dashboard-summary`;

    const summary$: Observable<DashboardSummaryDTO | null> = this.http.get<DashboardSummaryDTO>(summaryUrl).pipe(
      catchError(err => {
        console.error("DashboardService: Erreur API lors du chargement du résumé:", err);
        // Vous pourriez émettre une erreur spécifique ici si le composant doit savoir QUEL appel a échoué
        // ou simplement retourner null pour indiquer un échec partiel.
        return of(null);
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
        // Si tous les appels ont échoué (tous sont null), vous pourriez vouloir retourner null globalement.
        if (summaryResponse === null && membersResponse === null && eventsResponse === null) {
          console.warn("DashboardService: Tous les appels pour les données du dashboard ont échoué.");
          return null; // Ou vous pourriez propager une erreur spécifique si nécessaire
        }
        return {
          summary: summaryResponse,
          latestMembers: membersResponse,
          nextEvents: eventsResponse
        };
      }),
      catchError(err => {
        // Ce catchError est pour forkJoin lui-même, bien que peu probable d'être atteint
        // si chaque source a son propre catchError.
        console.error("DashboardService: Erreur inattendue dans forkJoin de getDashboardData:", err);
        return of(null); // Retourne null en cas d'erreur globale de forkJoin.
      })
    );
  }
}

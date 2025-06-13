// ----- IMPORTATIONS -----
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../service/security/auth.service';
import { MembreService } from '../../../service/crud/membre.service';
import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { StatCardComponent } from '../../../component/dashboard/stat-card/stat-card.component';
import { EventRowComponent } from '../../../component/event/event-row/event-row.component';
import { MembreRowComponent } from '../../../component/membre/membre-row/membre-row.component';
import { CreateEventButtonComponent } from '../../../component/event/create-event-button/create-event-button.component';
import { LucideAngularModule } from 'lucide-angular';

import { Membre } from '../../../model/membre';
import { Evenement } from '../../../model/evenement';
import { RoleType } from '../../../model/role';

import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {DashboardData, DashboardService} from '../../../service/crud/dashboard.service'; // Nécessite de connaître DashboardData

/**
 * @Component décorateur qui configure le DashboardComponent.
 * C'est la page principale pour les utilisateurs avec des rôles administratifs ou de réservation,
 * affichant des statistiques clés, des aperçus de listes et des graphiques pertinents.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PercentPipe,
    BaseChartDirective,
    StatCardComponent,
    EventRowComponent,
    MembreRowComponent,
    CreateEventButtonComponent,
    LucideAngularModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation de la détection de changements:
                                                  // le composant est mis à jour uniquement
                                                  // si ses @Input changent, si un événement est émis,
                                                  // ou si `cdr.detectChanges()` est appelé manuellement.
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- Dépendances Injectées ---
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);
  private membreService = inject(MembreService);
  private eventService = inject(EventService);
  private dashboardService = inject(DashboardService);

  // --- État du Composant (Propriétés pour l'affichage) ---
  /**
   * Nombre total d'événements organisés par le club.
   * Initialisé à '...' pour indiquer un état de chargement visuel.
   */
  totalEvents: number | string = '...';

  /**
   * Nombre d'événements à venir dans les 30 prochains jours.
   * Initialisé à '...' pour indiquer un état de chargement visuel.
   */
  upcomingEventsCount: number | string = '...';

  /**
   * Taux d'occupation moyen des événements du club, pour le pipe 'percent'.
   * Initialisé à `null` pour permettre l'affichage de 'N/A' ou un état non disponible.
   */
  averageEventOccupancy: number | string | null = null;

  /**
   * Nombre total de membres actifs au sein du club.
   * Initialisé à `null` pour indiquer un état non disponible.
   */
  totalActiveMembers: number | string | null = null;

  /**
   * Nombre total de participations validées à l'ensemble des événements du club.
   * Initialisé à `null` pour indiquer un état non disponible.
   */
  totalParticipations: number | string | null = null;

  /**
   * Liste des cinq derniers membres inscrits pour affichage dans un tableau.
   * Initialisé à un tableau vide.
   */
  lastFiveMembers: Membre[] = [];

  /**
   * Liste des cinq prochains événements du club pour affichage dans un tableau.
   * Initialisé à un tableau vide.
   */
  nextFiveEvents: Evenement[] = [];

  /**
   * Indique l'état de chargement global du tableau de bord.
   * Contrôle l'affichage de l'indicateur de chargement.
   */
  isLoading = true;

  /**
   * Gère la désinscription de l'abonnement aux données du dashboard pour éviter les fuites mémoire.
   */
  private dataSubscription: Subscription | null = null;

  // --- Configuration des Graphiques (Chart.js) ---
  /**
   * Options de base communes à tous les graphiques Chart.js.
   * Inclut la réactivité, le maintien du ratio d'aspect, et la configuration des plugins.
   */
  private baseChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { /* ... configuration ... */ } },
    font: { family: "'Poppins', sans-serif", size: 12 },
  };

  /**
   * Options spécifiques pour le graphique en ligne des inscriptions des membres.
   * Hérite des options de base et configure les échelles et les interactions.
   */
  public membersChartOptions: ChartOptions<'line'> = {
    ...this.baseChartOptions,
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#555', precision: 0 }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#555' }, border: { display: false } }
    },
    interaction: { intersect: false, mode: 'index' },
  };

  /**
   * Données pour le graphique en ligne des inscriptions des membres.
   * Initialisé à un état vide.
   */
  public membersChartData: ChartData<'line'> = { labels: [], datasets: [] };

  /**
   * Options spécifiques pour le graphique en barres des notes moyennes.
   * Hérite des options de base et configure les échelles, notamment la limite maximale de 5.
   */
  public ratingsChartOptions: ChartOptions<'bar'> = {
    ...this.baseChartOptions,
    scales: {
      y: { beginAtZero: true, max: 5, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#555', stepSize: 1 }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#555' }, border: { display: false } }
    }
  };

  /**
   * Données pour le graphique en barres des notes moyennes.
   * Initialisé à un état vide.
   */
  public ratingsChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  // --- Cycle de Vie Angular ---
  /**
   * Méthode du cycle de vie appelée après l'initialisation du composant.
   * Récupère l'ID du club et lance le chargement des données du tableau de bord.
   */
  ngOnInit(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) {
      this.loadAllDashboardData(clubId);
    } else {
      this.handleMissingClubId();
    }
  }

  /**
   * Méthode du cycle de vie appelée juste avant la destruction du composant.
   * Annule l'abonnement aux données pour éviter les fuites mémoire.
   */
  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
  }

  // --- Chargement Principal des Données ---
  /**
   * Charge toutes les données nécessaires pour le tableau de bord en appelant le `DashboardService`.
   * Gère l'état de chargement et la distribution des données reçues aux propriétés du composant.
   * @param clubId L'identifiant du club pour lequel charger les données.
   */
  private loadAllDashboardData(clubId: number): void {
    this.isLoading = true;
    this.resetData();

    this.dataSubscription = this.dashboardService.getDashboardData(clubId).subscribe({
      next: (dashboardData: DashboardData | null) => {
        if (dashboardData) {
          // Traite la section 'summary' des données si elle est disponible.
          if (dashboardData.summary) {
            this.updateSummaryData(dashboardData.summary);
          } else {
            this.notification.show("Les données du résumé n'ont pas pu être chargées.", "warning");
            // Affiche un état d'erreur/indisponibilité pour les KPIs et vide les graphiques.
            this.totalEvents = "N/A";
            this.upcomingEventsCount = "N/A";
            this.averageEventOccupancy = "N/A";
            this.totalActiveMembers = "N/A";
            this.totalParticipations = "N/A";
            this.membersChartData = { labels: [], datasets: [] };
            this.ratingsChartData = { labels: [], datasets: [] };
          }

          // Affecte les cinq derniers membres, ou un tableau vide si les données sont null.
          this.lastFiveMembers = dashboardData.latestMembers ?? [];
          if (!dashboardData.latestMembers) {
            this.notification.show("Les derniers membres n'ont pas pu être chargés.", "warning");
          }

          // Affecte les cinq prochains événements, ou un tableau vide si les données sont null.
          this.nextFiveEvents = dashboardData.nextEvents ?? [];
          if (!dashboardData.nextEvents) {
            this.notification.show("Les prochains événements n'ont pas pu être chargés.", "warning");
          }

        } else {
          // Cas où le DashboardService a indiqué un échec global de récupération des données.
          this.handleMajorDataLoadFailure('chargement global du dashboard (service a retourné null)');
        }

        this.isLoading = false;
        // Nécessaire avec ChangeDetectionStrategy.OnPush pour forcer la mise à jour de la vue
        // après la modification asynchrone des propriétés du composant.
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        // Gère les erreurs de la souscription, potentiellement non interceptées par le service.
        this.handleApiError(error, 'souscription DashboardService');
      }
    });
  }

  /**
   * Réinitialise toutes les propriétés de données du composant à leur état initial de "chargement" ou vide.
   * Ceci est fait avant chaque nouveau chargement de données.
   */
  private resetData(): void {
    this.totalEvents = "...";
    this.upcomingEventsCount = "...";
    this.averageEventOccupancy = null;
    this.totalActiveMembers = null;
    this.totalParticipations = null;
    this.membersChartData = { labels: [], datasets: [] };
    this.ratingsChartData = { labels: [], datasets: [] };
    this.lastFiveMembers = [];
    this.nextFiveEvents = [];
    // Force la mise à jour de la vue pour montrer l'état de réinitialisation.
    this.cdr.detectChanges();
  }

  // --- Méthodes de Mise à Jour des Données pour l'UI ---
  /**
   * Met à jour les indicateurs clés de performance (KPIs) et prépare les données pour les graphiques
   * à partir de l'objet `DashboardSummaryDTO` reçu.
   * @param summary L'objet `DashboardSummaryDTO` contenant les statistiques générales.
   */
  private updateSummaryData(summary: DashboardSummaryDTO): void {
    this.totalEvents = summary.totalEvents ?? 'N/A';
    this.upcomingEventsCount = summary.upcomingEventsCount30d ?? 'N/A';
    this.totalActiveMembers = summary.totalActiveMembers ?? 'N/A';
    this.totalParticipations = summary.totalParticipations ?? 'N/A';
    this.updateAverageOccupancy(summary.averageEventOccupancyRate);
    this.updateMembersChartData(summary.monthlyRegistrations);
    this.updateRatingsChartData(summary.averageEventRatings);
  }

  /**
   * Convertit le taux d'occupation moyen brut en un format utilisable par le pipe 'percent'
   * et met à jour la propriété `averageEventOccupancy`.
   * @param rate Le taux brut (par exemple, 75.5 pour 75.5%).
   */
  private updateAverageOccupancy(rate: number | undefined | null): void {
    if (typeof rate === 'number') {
      this.averageEventOccupancy = rate / 100; // Le pipe 'percent' attend une valeur entre 0 et 1.
    } else {
      this.averageEventOccupancy = 'N/A';
    }
  }

  /**
   * Prépare et formate les données brutes des inscriptions mensuelles pour le graphique en ligne.
   * @param registrations Un tableau de points de données `MonthlyRegistrationPoint`.
   */
  private updateMembersChartData(registrations: MonthlyRegistrationPoint[] | undefined | null): void {
    if (!registrations || registrations.length === 0) {
      this.membersChartData = { labels: [], datasets: [] };
      return;
    }
    this.membersChartData = {
      labels: registrations.map(point => point.monthYear),
      datasets: [{
        data: registrations.map(point => point.count),
        label: 'Inscriptions', fill: true, backgroundColor: 'rgba(26, 95, 122, 0.1)',
        borderColor: '#1a5f7a', tension: 0.3, pointBackgroundColor: '#1a5f7a',
        pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#1a5f7a'
      }]
    };
  }

  /**
   * Prépare et formate les données brutes des notes moyennes des événements pour le graphique en barres.
   * S'assure que les catégories sont affichées dans un ordre prédéfini.
   * @param ratings Un objet `AverageRatings` contenant les notes moyennes par critère.
   */
  private updateRatingsChartData(ratings: AverageRatings | undefined | null): void {
    if (!ratings || Object.keys(ratings).length === 0) {
      this.ratingsChartData = { labels: [], datasets: [] };
      return;
    }
    // Définit l'ordre des catégories pour le graphique.
    const orderedKeys: (keyof AverageRatings)[] = ['organisation', 'proprete', 'ambiance', 'fairPlay', 'niveauJoueurs', 'moyenneGenerale'];
    // Mappage des clés techniques vers des libellés affichables.
    const displayLabels: Record<keyof AverageRatings, string> = {
      organisation: 'Organisation', proprete: 'Propreté', ambiance: 'Ambiance',
      fairPlay: 'Fairplay', niveauJoueurs: 'Niveau Joueurs', moyenneGenerale: 'Moyenne Générale'
    };
    this.ratingsChartData = {
      labels: orderedKeys.map(key => displayLabels[key] || key.toString()),
      datasets: [{
        data: orderedKeys.map(key => ratings[key] ?? 0), // Utilise 0 si la note est absente ou null.
        label: 'Note Moyenne', backgroundColor: 'rgba(242, 97, 34, 0.7)',
        borderColor: '#f26122', borderWidth: 1, borderRadius: 5,
        hoverBackgroundColor: 'rgba(242, 97, 34, 0.9)'
      }]
    };
  }

  // --- GESTION DES ACTIONS UTILISATEUR (Handlers) ---
  /**
   * Gère la demande de changement de rôle d'un membre.
   * Appelle le service `MembreService` et recharge les données du dashboard après succès.
   * @param data L'objet contenant l'ID du membre (`membreId`) et le nouveau rôle (`newRole`).
   */
  handleSaveRole(data: { membreId: number, newRole: RoleType }): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club gestionnaire non trouvé.", "error");
      return;
    }
    if (!data || !data.newRole) {
      this.notification.show("Erreur: Données de rôle invalides.", "error");
      return;
    }
    this.membreService.changeMemberRole(data.membreId, clubId, data.newRole).subscribe({
      next: (updatedMember) => {
        this.notification.show(`Rôle du membre (ID: ${updatedMember.id}) mis à jour en ${updatedMember.role}.`, "success");
        this.loadAllDashboardData(clubId); // Recharge les données pour refléter le changement.
      },
      error: (error: HttpErrorResponse) => {
        const message = error?.error?.message || error?.message || "Erreur inconnue lors de la mise à jour du rôle.";
        this.notification.show(message, "error");
      }
    });
  }

  /**
   * Gère la demande de désactivation (suppression douce) d'un événement.
   * Appelle le service `EventService` et recharge les données du dashboard après succès.
   * @param eventToDelete L'événement à désactiver.
   */
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé.`, 'success');
        const clubId = this.authService.getManagedClubId();
        if (clubId !== null) this.loadAllDashboardData(clubId); // Recharge les données.
      },
      error: (error: HttpErrorResponse) => {
        this.notification.show(error?.message || "Erreur lors de la désactivation.", 'error');
      }
    });
  }

  /**
   * Gère la création ou la mise à jour d'un événement (upsert).
   * Déclenchée par les composants enfants après une opération réussie.
   * @param newOrUpdatedEvent L'événement qui vient d'être créé ou mis à jour.
   */
  handleEventUpserted(newOrUpdatedEvent: Evenement): void {
    // Détermine si l'opération était une mise à jour ou une création pour le message de notification.
    const action = this.nextFiveEvents.find(e => e.id === newOrUpdatedEvent.id) ? 'mis à jour' : 'créé';
    this.notification.show(`Événement "${newOrUpdatedEvent.nom}" ${action}. Rechargement...`, 'info');
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) this.loadAllDashboardData(clubId); // Recharge les données.
    else this.notification.show("Erreur: ID du club non trouvé pour recharger.", "error");
  }

  // --- Gestion des Erreurs et Cas Particuliers ---
  /**
   * Gère les erreurs d'API en affichant une notification à l'utilisateur.
   * Met à jour l'état de chargement et l'affichage des KPIs en cas d'erreur.
   * @param error L'objet `HttpErrorResponse` (ou un type `any` si l'erreur n'est pas typée).
   * @param context Une chaîne de caractères décrivant le contexte où l'erreur est survenue.
   */
  private handleApiError(error: HttpErrorResponse | any, context: string): void {
    const message = error instanceof HttpErrorResponse
      ? error.message
      : `Une erreur s'est produite (${context}).`;
    this.notification.show(message, "error");
    this.isLoading = false;
    // Met à jour les KPIs pour indiquer une erreur.
    this.totalEvents = "Erreur";
    this.upcomingEventsCount = "Erreur";
    this.averageEventOccupancy = "Erreur";
    this.totalActiveMembers = "Erreur";
    this.totalParticipations = "Erreur";
    // Force la détection de changements pour mettre à jour l'UI avec les états d'erreur.
    this.cdr.detectChanges();
  }

  /**
   * Gère un échec majeur du chargement des données du tableau de bord.
   * Affiche une notification critique et réinitialise tous les indicateurs à "N/A" ou vide.
   * @param context Une chaîne de caractères décrivant le contexte de l'échec.
   */
  private handleMajorDataLoadFailure(context: string): void {
    this.notification.show(`Erreur critique: Impossible de charger les données du tableau de bord.`, "error");
    this.isLoading = false;
    // Réinitialise tous les KPIs et les données des graphiques/tableaux.
    this.totalEvents = "N/A";
    this.upcomingEventsCount = "N/A";
    this.averageEventOccupancy = "N/A";
    this.totalActiveMembers = "N/A";
    this.totalParticipations = "N/A";
    this.membersChartData = { labels: [], datasets: [] };
    this.ratingsChartData = { labels: [], datasets: [] };
    this.lastFiveMembers = [];
    this.nextFiveEvents = [];
    // Force la détection de changements.
    this.cdr.detectChanges();
  }

  /**
   * Gère le cas où l'identifiant du club géré par l'utilisateur n'est pas disponible au démarrage du composant.
   * Affiche une erreur et désactive l'état de chargement.
   */
  private handleMissingClubId(): void {
    this.notification.show("Erreur: ID du club introuvable. Impossible de charger le tableau de bord.", "error");
    this.isLoading = false;
    // Met à jour les KPIs pour indiquer l'absence d'ID de club.
    this.totalEvents = 'Erreur Club ID';
    this.upcomingEventsCount = 'Erreur Club ID';
    this.averageEventOccupancy = 'Erreur Club ID';
    this.totalActiveMembers = 'Erreur Club ID';
    this.totalParticipations = 'Erreur Club ID';
    // Force la détection de changements.
    this.cdr.detectChanges();
  }
}

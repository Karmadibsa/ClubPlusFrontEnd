// ----- IMPORTATIONS -----
// Modules Angular essentiels
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common'; // Pour @if, @for, le pipe 'percent'
import { HttpErrorResponse } from '@angular/common/http'; // Peut rester pour typer les erreurs du subscribe.
import { Subscription } from 'rxjs'; // Outil pour gérer la désinscription.

// Services de votre application
import { AuthService } from '../../../service/security/auth.service'; // Pour l'ID du club et le rôle.
import { MembreService } from '../../../service/crud/membre.service'; // Pour changer le rôle d'un membre.
import { EventService } from '../../../service/crud/event.service';   // Pour désactiver un événement.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications.
// Composants utilisés dans le template HTML
import { StatCardComponent } from '../../../component/dashboard/stat-card/stat-card.component';
import { EventRowComponent } from '../../../component/event/event-row/event-row.component';
import { MembreRowComponent } from '../../../component/membre/membre-row/membre-row.component';
import { CreateEventButtonComponent } from '../../../component/event/create-event-button/create-event-button.component';
import { LucideAngularModule } from 'lucide-angular';

// Types de données (Modèles)
import { Membre } from '../../../model/membre';
import { Evenement } from '../../../model/evenement';
import { RoleType } from '../../../model/role';

// Outils pour les graphiques (Chart.js via ng2-charts)
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import {DashboardData, DashboardService} from '../../../service/crud/dashboard.service';

/**
 * @Component décorateur qui configure le DashboardComponent.
 * C'est la page principale pour les utilisateurs administratifs et de réservation,
 * affichant des statistiques clés, des listes d'aperçu et des graphiques.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,                 // Composant autonome.
  imports: [                        // Dépendances pour le template.
    CommonModule,                   // Pour @if, @for, etc.
    PercentPipe,                    // Pour formater les taux en pourcentages.
    BaseChartDirective,             // Pour <canvas baseChart ...>
    StatCardComponent,
    EventRowComponent,
    MembreRowComponent,
    CreateEventButtonComponent,
    LucideAngularModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation: le composant est vérifié
                                                  // seulement si ses @Input changent ou si
                                                  // la détection est explicitement demandée.
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- Dépendances Injectées ---
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef); // Pour déclencher manuellement la détection de changements.
  private membreService = inject(MembreService); // Conservé pour handleSaveRole.
  private eventService = inject(EventService);   // Conservé pour handleDeleteEventRequest.
  private dashboardService = inject(DashboardService); // NOUVEAU: Service pour charger les données du dashboard.

  // --- État du Composant (Propriétés pour l'affichage) ---
  // Indicateurs Clés (KPIs)
  totalEvents: number | string = '...'; // '...' pour l'effet de chargement initial.
  upcomingEventsCount: number | string = '...';
  averageEventOccupancy: number | string | null = null; // null pour gérer 'N/A' via le template.
  totalActiveMembers: number | string | null = null;
  totalParticipations: number | string | null = null;

  // Listes pour les tableaux d'aperçu
  lastFiveMembers: Membre[] = [];
  nextFiveEvents: Evenement[] = [];

  // État de chargement global
  isLoading = true;

  // Abonnement principal aux données du dashboard (pour désinscription)
  private dataSubscription: Subscription | null = null;

  // --- Configuration des Graphiques (Chart.js) ---
  private baseChartOptions: ChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { /* ... configuration ... */ } },
    font: { family: "'Poppins', sans-serif", size: 12 },
  };

  public membersChartOptions: ChartOptions<'line'> = { /* ... configuration spécifique ... */
    ...this.baseChartOptions,
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#555', precision: 0 }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#555' }, border: { display: false } }
    },
    interaction: { intersect: false, mode: 'index' },
  };
  public membersChartData: ChartData<'line'> = { labels: [], datasets: [] }; // Données initialement vides.

  public ratingsChartOptions: ChartOptions<'bar'> = { /* ... configuration spécifique ... */
    ...this.baseChartOptions,
    scales: {
      y: { beginAtZero: true, max: 5, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#555', stepSize: 1 }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: '#555' }, border: { display: false } }
    }
  };
  public ratingsChartData: ChartData<'bar'> = { labels: [], datasets: [] }; // Données initialement vides.

  // --- Cycle de Vie Angular ---
  ngOnInit(): void {
    console.log("DashboardComponent: Initialisation.");
    const clubId = this.authService.getManagedClubId(); // Récupère l'ID du club géré.
    if (clubId !== null) {
      this.loadAllDashboardData(clubId); // Lance le chargement des données.
    } else {
      this.handleMissingClubId(); // Gère le cas où l'ID du club est introuvable.
    }
  }

  ngOnDestroy(): void {
    console.log("DashboardComponent: Destruction, désinscription des données.");
    this.dataSubscription?.unsubscribe(); // Annule l'abonnement pour éviter les fuites mémoire.
  }

  // --- Chargement Principal des Données (Refactorisé) ---
  /**
   * Charge toutes les données nécessaires pour le dashboard en appelant `DashboardService`.
   * @param clubId L'ID du club pour lequel charger les données.
   */
  private loadAllDashboardData(clubId: number): void {
    this.isLoading = true;    // Active l'indicateur de chargement.
    this.resetData();         // Réinitialise les affichages à leur état de "chargement".
    console.log(`DashboardComponent: Appel à DashboardService.getDashboardData pour club ID: ${clubId}`);

    // S'abonne à l'Observable retourné par le DashboardService.
    this.dataSubscription = this.dashboardService.getDashboardData(clubId).subscribe({
      next: (dashboardData: DashboardData | null) => {
        // Ce bloc est exécuté lorsque le DashboardService émet des données.
        // `dashboardData` peut être un objet DashboardData ou null si tous les appels API internes ont échoué.
        if (dashboardData) {
          console.log("DashboardComponent: Données du dashboard reçues du service:", dashboardData);

          // Traite la section 'summary' des données.
          if (dashboardData.summary) {
            this.updateSummaryData(dashboardData.summary); // Met à jour KPIs et données des graphiques.
          } else {
            // Si `dashboardData.summary` est null (l'appel API du résumé a échoué dans le service).
            this.notification.show("Les données du résumé n'ont pas pu être chargées.", "warning");
            this.totalEvents = "N/A"; // Affiche un état d'erreur/indisponibilité.
            this.upcomingEventsCount = "N/A";
            this.averageEventOccupancy = "N/A";
            this.totalActiveMembers = "N/A";
            this.totalParticipations = "N/A";
            this.membersChartData = { labels: [], datasets: [] }; // Vide les graphiques.
            this.ratingsChartData = { labels: [], datasets: [] };
          }

          // Traite la section 'latestMembers'.
          // Utilise l'opérateur de coalescence nulle (`??`) pour affecter un tableau vide si `null`.
          this.lastFiveMembers = dashboardData.latestMembers ?? [];
          if (!dashboardData.latestMembers) {
            this.notification.show("Les derniers membres n'ont pas pu être chargés.", "warning");
          }

          // Traite la section 'nextEvents'.
          this.nextFiveEvents = dashboardData.nextEvents ?? [];
          if (!dashboardData.nextEvents) {
            this.notification.show("Les prochains événements n'ont pas pu être chargés.", "warning");
          }

        } else {
          // Ce cas est atteint si `dashboardData` est entièrement `null`,
          // signifiant que le DashboardService a indiqué un échec global de récupération.
          console.error("DashboardComponent: Aucune donnée reçue du DashboardService (échec global).");
          this.handleMajorDataLoadFailure('chargement global du dashboard (service a retourné null)');
        }

        this.isLoading = false; // Fin du chargement.
        this.cdr.detectChanges(); // Notifie Angular de vérifier les changements pour mettre à jour la vue.
                                  // Essentiel avec ChangeDetectionStrategy.OnPush.
        console.log("DashboardComponent: Données du dashboard traitées et affichage rafraîchi.");
      },
      error: (error: HttpErrorResponse) => { // Gère les erreurs non interceptées par le service (rare).
        console.error("DashboardComponent: Erreur inattendue lors de la souscription à DashboardService.getDashboardData:", error);
        this.handleApiError(error, 'souscription DashboardService'); // Utilise le gestionnaire d'erreur existant.
        // isLoading et detectChanges sont déjà gérés dans handleApiError.
      }
    });
  }

  /**
   * Réinitialise les propriétés de données à leur état de chargement initial.
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
    this.cdr.detectChanges(); // Met à jour la vue pour montrer l'état de "chargement".
  }

  // --- Méthodes de Mise à Jour des Données pour l'UI ---
  // Ces méthodes prennent les données brutes (ou une partie) et les préparent pour l'affichage
  // ou pour les graphiques. Elles restent dans le composant car elles sont spécifiques à sa présentation.

  /**
   * Met à jour les KPIs et lance la préparation des données pour les graphiques
   * à partir de l'objet `DashboardSummaryDTO`.
   * @param summary L'objet contenant les statistiques générales.
   */
  private updateSummaryData(summary: DashboardSummaryDTO): void {
    this.totalEvents = summary.totalEvents ?? 'N/A';
    this.upcomingEventsCount = summary.upcomingEventsCount30d ?? 'N/A';
    this.totalActiveMembers = summary.totalActiveMembers ?? 'N/A';
    this.totalParticipations = summary.totalParticipations ?? 'N/A';
    this.updateAverageOccupancy(summary.averageEventOccupancyRate);
    this.updateMembersChartData(summary.monthlyRegistrations); // Transmet les données pour le graphique des membres.
    this.updateRatingsChartData(summary.averageEventRatings);   // Transmet les données pour le graphique des notes.
  }

  /**
   * Met à jour le KPI du taux d'occupation moyen, en le convertissant pour le pipe `percent`.
   * @param rate Le taux brut (ex: 75.5 pour 75.5%).
   */
  private updateAverageOccupancy(rate: number | undefined | null): void {
    if (typeof rate === 'number') {
      this.averageEventOccupancy = rate / 100; // Pour le pipe 'percent' (ex: 0.755).
    } else {
      this.averageEventOccupancy = 'N/A';
    }
  }

  /**
   * Prépare les données pour le graphique LIGNE des inscriptions mensuelles.
   * @param registrations Un tableau de points de données `MonthlyRegistrationPoint`.
   */
  private updateMembersChartData(registrations: MonthlyRegistrationPoint[] | undefined | null): void {
    if (!registrations || registrations.length === 0) {
      console.log("DashboardComponent: Aucune donnée d'inscription mensuelle pour le graphique.");
      this.membersChartData = { labels: [], datasets: [] }; // Assure un état vide pour le graphique.
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
    console.log("DashboardComponent: Données du graphique des inscriptions préparées.");
  }

  /**
   * Prépare les données pour le graphique BARRES des notes moyennes des événements.
   * @param ratings Un objet `AverageRatings` contenant les notes moyennes par critère.
   */
  private updateRatingsChartData(ratings: AverageRatings | undefined | null): void {
    if (!ratings || Object.keys(ratings).length === 0) {
      console.log("DashboardComponent: Aucune donnée de notation moyenne pour le graphique.");
      this.ratingsChartData = { labels: [], datasets: [] }; // Assure un état vide.
      return;
    }
    const orderedKeys: (keyof AverageRatings)[] = ['organisation', 'proprete', 'ambiance', 'fairPlay', 'niveauJoueurs', 'moyenneGenerale'];
    const displayLabels: Record<keyof AverageRatings, string> = {
      organisation: 'Organisation', proprete: 'Propreté', ambiance: 'Ambiance',
      fairPlay: 'Fairplay', niveauJoueurs: 'Niveau Joueurs', moyenneGenerale: 'Moyenne Générale'
    };
    this.ratingsChartData = {
      labels: orderedKeys.map(key => displayLabels[key] || key.toString()),
      datasets: [{
        data: orderedKeys.map(key => ratings[key] ?? 0), // Met 0 si la note est undefined.
        label: 'Note Moyenne', backgroundColor: 'rgba(242, 97, 34, 0.7)',
        borderColor: '#f26122', borderWidth: 1, borderRadius: 5,
        hoverBackgroundColor: 'rgba(242, 97, 34, 0.9)'
      }]
    };
    console.log("DashboardComponent: Données du graphique des notations préparées.");
  }

  // --- GESTION DES ACTIONS UTILISATEUR (Handlers pour les événements des composants enfants) ---
  // Ces méthodes gèrent les interactions initiées par l'utilisateur sur les composants enfants
  // (comme EventRowComponent, MembreRowComponent). Elles appellent les services CRUD appropriés
  // puis déclenchent un rechargement des données du dashboard pour refléter les changements.

  /**
   * Gère la demande de changement de rôle émise par un `MembreRowComponent`.
   * @param data L'objet `{ membreId: number, newRole: RoleType }`.
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
    console.log(`DashboardComponent: Sauvegarde du rôle pour Membre ID ${data.membreId}, Nouveau Rôle: ${data.newRole}`);
    this.membreService.changeMemberRole(data.membreId, clubId, data.newRole).subscribe({
      next: (updatedMember) => {
        this.notification.show(`Rôle du membre (ID: ${updatedMember.id}) mis à jour en ${updatedMember.role}.`, "success");
        this.loadAllDashboardData(clubId); // Recharge les données du dashboard.
      },
      error: (error) => {
        const message = error?.error?.message || error?.message || "Erreur inconnue lors de la mise à jour du rôle.";
        this.notification.show(message, "error");
      }
    });
  }

  /**
   * Gère la demande de désactivation d'un événement émise par un `EventRowComponent`.
   * @param eventToDelete L'objet `Evenement` à désactiver.
   */
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    console.log("DashboardComponent: Désactivation de l'événement:", eventToDelete.nom);
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé.`, 'success');
        const clubId = this.authService.getManagedClubId();
        if (clubId !== null) this.loadAllDashboardData(clubId); // Recharge.
      },
      error: (error) => {
        this.notification.show(error?.message || "Erreur lors de la désactivation.", 'error');
      }
    });
  }

  /**
   * Gère la création ou la mise à jour d'un événement (émis par `CreateEventButtonComponent` ou `EventRowComponent`).
   * @param newOrUpdatedEvent L'événement créé ou mis à jour.
   */
  handleEventUpserted(newOrUpdatedEvent: Evenement): void {
    const action = this.nextFiveEvents.find(e => e.id === newOrUpdatedEvent.id) ? 'mis à jour' : 'créé';
    console.log(`DashboardComponent: Événement ${action}:`, newOrUpdatedEvent.nom);
    this.notification.show(`Événement "${newOrUpdatedEvent.nom}" ${action}. Rechargement...`, 'info');
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) this.loadAllDashboardData(clubId); // Recharge.
    else this.notification.show("Erreur: ID du club non trouvé pour recharger.", "error");
  }

  // --- Gestion des Erreurs et Cas Particuliers ---

  /**
   * Gère une erreur API spécifique (quand un objet HttpErrorResponse est disponible).
   * @param error L'objet `HttpErrorResponse` (ou `any` pour plus de flexibilité).
   * @param context Une chaîne décrivant le contexte de l'erreur.
   */
  private handleApiError(error: HttpErrorResponse | any, context: string): void {
    console.error(`DashboardComponent: Erreur API dans le contexte "${context}":`, error);
    const message = error instanceof HttpErrorResponse
      ? error.message // Message de l'erreur HTTP
      : `Une erreur s'est produite (${context}).`; // Message générique
    this.notification.show(message, "error");
    this.isLoading = false;
    this.totalEvents = "Erreur"; this.upcomingEventsCount = "Erreur"; /* ... autres KPIs ... */
    this.cdr.detectChanges();
  }

  /**
   * Gère spécifiquement le cas où le chargement global des données du dashboard
   * a échoué de manière significative (ex: le `DashboardService` a retourné `null`).
   * @param context Une chaîne décrivant le contexte.
   */
  private handleMajorDataLoadFailure(context: string): void {
    console.error(`DashboardComponent: Échec majeur du chargement des données dans "${context}"`);
    this.notification.show(`Erreur critique: Impossible de charger les données du tableau de bord.`, "error");
    this.isLoading = false;
    this.totalEvents = "N/A"; this.upcomingEventsCount = "N/A"; /* ... autres KPIs à "N/A" ... */
    this.membersChartData = { labels: [], datasets: [] }; this.ratingsChartData = { labels: [], datasets: [] };
    this.lastFiveMembers = []; this.nextFiveEvents = [];
    this.cdr.detectChanges();
  }

  /**
   * Gère le cas où l'ID du club géré par l'utilisateur n'est pas trouvé au démarrage.
   */
  private handleMissingClubId(): void {
    console.error("DashboardComponent: ID du club géré introuvable.");
    this.notification.show("Erreur: ID du club introuvable. Impossible de charger le tableau de bord.", "error");
    this.isLoading = false;
    this.totalEvents = 'Erreur Club ID'; this.upcomingEventsCount = 'Erreur Club ID'; /* ... */
    this.cdr.detectChanges();
  }
}

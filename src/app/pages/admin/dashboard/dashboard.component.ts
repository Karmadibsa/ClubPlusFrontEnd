// dashboard.component.ts (Version SIMPLE, STABLE et COMMENTÉE)

import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { SidebarComponent } from '../../../component/navigation/sidebar/sidebar.component'; // Adapte chemin
import { AuthService } from '../../../service/security/auth.service'; // Adapte chemin
import { NotificationService } from '../../../service/notification.service'; // Adapte chemin
import { Router } from '@angular/router';
import {forkJoin, Observable, of, Subscription} from 'rxjs';
import { MembreService } from '../../../service/membre.service';
import { EventService } from '../../../service/event.service';

// --- Imports Chart.js & ng2-charts ---
import { ChartData, ChartOptions, Chart, PointElement, LineElement, Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineController, BarController, Filler } from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {StatCardComponent} from '../../../component/dashboard/stat-card/stat-card.component';
import {catchError} from 'rxjs/operators';
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {MembreRowComponent} from '../../../component/membre/membre-row/membre-row.component';
import {MembreDetailModalComponent} from '../../../component/membre/membre-detail-modal/membre-detail-modal.component';



// --- CONSTANTES DE STYLE ---
const MAIN_BLUE = '#1a5f7a';
const MAIN_ORANGE = '#f26122';
const FONT_FAMILY_POPPINS = "'Poppins', sans-serif";
const CHART_GRID_COLOR = 'rgba(0, 0, 0, 0.05)';
const CHART_TICK_COLOR = '#555';
const CHART_TOOLTIP_BG = 'rgba(0, 0, 0, 0.85)';
// -------------------------

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PercentPipe, SidebarComponent, BaseChartDirective, StatCardComponent, EventRowComponent, MembreRowComponent, MembreDetailModalComponent], // Retire DecimalPipe si non utilisé
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation possible
})
export class DashboardComponent implements OnInit, OnDestroy {

  // --- Injections ---
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private membreService = inject(MembreService);
  private eventService = inject(EventService);

  // --- Propriétés KPIs ---
  totalEvents: number | string = '...';
  upcomingEventsCount: number | string = '...';
  averageEventOccupancy: number | null | string = null;
  totalActiveMembers: number | null | string = null;
  totalParticipations: number | null | string = null;
  lastFiveMembers: Membre[] = [];
  nextFiveEvents: Event[] = [];

  isDetailModalVisible = false;
  selectedMemberForDetail: Membre | null = null;

  // --- Options de base communes (inclut animation simple par défaut) ---
  private baseChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true, backgroundColor: CHART_TOOLTIP_BG,
        titleFont: { family: FONT_FAMILY_POPPINS, weight: 'bold', size: 13 },
        bodyFont: { family: FONT_FAMILY_POPPINS, size: 12 },
        padding: 12, cornerRadius: 3, displayColors: false, boxPadding: 4
      }
    },
    font: { family: FONT_FAMILY_POPPINS, size: 12 },
    // L'animation par défaut de Chart.js sera utilisée (simple fondu/montée)
    // On n'a plus besoin de 'animation: { duration: 600, ... }' ici
    // ni de la section 'animations' complexe pour la ligne.
  };

  // --- Options spécifiques & Données Graphique Inscriptions (LIGNE) ---
  public membersChartOptions: ChartOptions<'line'> = { // Type ligne spécifié
    ...this.baseChartOptions, // Hérite des options communes
    scales: {
      y: { // Axe Y: Nombre
        beginAtZero: true,
        grid: { color: CHART_GRID_COLOR }, // Grille légère, pas de bordure d'axe
        ticks: {
          color: CHART_TICK_COLOR,
          font: { family: FONT_FAMILY_POPPINS },
          stepSize: 1, // Force les graduations entières
          precision: 0 // Force l'affichage d'entiers
        },
        border: { display: false } // Cache la ligne de l'axe Y
      },
      x: { // Axe X: Mois
        grid: { display: false }, // Pas de grille verticale
        ticks: {
          color: CHART_TICK_COLOR,
          font: { family: FONT_FAMILY_POPPINS }
        },
        border: { display: false } // Cache la ligne de l'axe X
      }
    },
    interaction: { // Améliore l'interaction avec la ligne
      intersect: false, // Tooltip même si pas pile sur le point
      mode: 'index', // Tooltip pour tous les points sur le même index X
    },
  };
  // Données pour le graphique ligne
  public membersChartData: ChartData<'line'> = { labels: [], datasets: [] }; // Type ligne spécifié

  // --- Options spécifiques & Données Graphique Notes (BARRES) ---
  public ratingsChartOptions: ChartOptions<'bar'> = { // Type barre spécifié
    ...this.baseChartOptions, // Hérite des options communes (et de l'animation simple)
    scales: {
      y: { // Axe Y: Note
        beginAtZero: true, max: 5, // Echelle 0-5
        grid: { color: CHART_GRID_COLOR },
        ticks: {
          color: CHART_TICK_COLOR,
          font: { family: FONT_FAMILY_POPPINS },
          stepSize: 1 // Pas de 1 pour les notes
        },
        border: { display: false }
      },
      x: { // Axe X: Catégories
        grid: { display: false },
        ticks: {
          color: CHART_TICK_COLOR,
          font: { family: FONT_FAMILY_POPPINS }
        },
        border: { display: false }
      }
    }
  };
  // Données pour le graphique barres
  public ratingsChartData: ChartData<'bar'> = { labels: [], datasets: [] }; // Type barre spécifié

  // --- État & Subscription ---
  isLoading = false;
  private apiSubscription: Subscription | null = null;
  private readonly baseApiUrl = 'http://localhost:8080/api';
  private dataSubscription: Subscription | null = null; // Renommé pour plus de clarté

  constructor() {} // Le constructeur est vide, c'est normal

  /** Initialisation: Récupère l'ID et lance le chargement */
  ngOnInit(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) {
      this.loadAllDashboardData(clubId);
    } else {
      this.handleMissingClubId();
    }
  }

  /** Nettoyage: Annule l'appel API si le composant est détruit */
  ngOnDestroy(): void {
    this.apiSubscription?.unsubscribe();
  }

  private loadAllDashboardData(clubId: number): void {
    this.isLoading = true;
    // Réinitialisation avant les appels
    this.resetData();

    const summaryUrl = `${this.baseApiUrl}/stats/clubs/${clubId}/dashboard-summary`;

    // Création des Observables pour chaque appel API
    const summary$: Observable<DashboardSummaryDTO | null> = this.http.get<DashboardSummaryDTO>(summaryUrl).pipe(
      catchError(err => {
        console.error("Erreur API Summary:", err);
        this.notification.show("Erreur chargement résumé dashboard.", "error");
        return of(null); // Retourne null en cas d'erreur pour que forkJoin continue
      })
    );

    const latestMembers$: Observable<Membre[] | null> = this.membreService.getLatestMembers().pipe(
      catchError(err => {
        console.error("Erreur API Derniers Membres:", err);
        this.notification.show("Erreur chargement derniers membres.", "error");
        return of(null); // Retourne null en cas d'erreur
      })
    );

    const nextEvents$: Observable<Event[] | null> = this.eventService.getNextEvents().pipe(
      catchError(err => {
        console.error("Erreur API Prochains Evénements:", err);
        this.notification.show("Erreur chargement prochains événements.", "error");
        return of(null); // Retourne null en cas d'erreur
      })
    );

    // Exécution des appels en parallèle avec forkJoin
    this.dataSubscription = forkJoin([summary$, latestMembers$, nextEvents$]).subscribe({
      next: ([summaryResponse, membersResponse, eventsResponse]) => {
        console.log("Réponses API reçues (summary, membres, events):", summaryResponse, membersResponse, eventsResponse);

        // Traitement de la réponse du résumé (si non nulle)
        if (summaryResponse) {
          this.updateSummaryData(summaryResponse);
        } else {
          // Gérer l'échec du chargement du résumé si nécessaire (ex: afficher des erreurs)
          this.totalEvents = "Erreur";
          // ... autres KPIs
        }

        // Traitement de la réponse des membres (si non nulle)
        this.lastFiveMembers = membersResponse ?? []; // Assigne la liste ou un tableau vide

        // Traitement de la réponse des événements (si non nulle)
        this.nextFiveEvents = eventsResponse ?? []; // Assigne la liste ou un tableau vide

        this.isLoading = false; // Fin du chargement global
        this.cdr.detectChanges(); // Notifier Angular pour rafraîchir la vue
        console.log("Données Dashboard mises à jour.");
      },
      error: (error: HttpErrorResponse) => {
        // Ne devrait pas être atteint si catchError est bien utilisé, mais sécurité
        console.error("Erreur inattendue dans forkJoin:", error);
        this.handleApiError(error, 'global dashboard');
      }
    });
  }
  /** Réinitialise les données avant un nouveau chargement */
  private resetData(): void {
    this.totalEvents = "...";
    this.upcomingEventsCount = "...";
    this.averageEventOccupancy = null;
    this.totalActiveMembers = null;
    this.totalParticipations = null;
    this.membersChartData = { labels: [], datasets: [] };
    this.ratingsChartData = { labels: [], datasets: [] };
    this.lastFiveMembers = []; // Réinitialise la liste des membres
    this.nextFiveEvents = [];  // Réinitialise la liste des événements
    this.cdr.detectChanges(); // S'assure que l'état 'chargement' est visible
  }

  /** Met à jour les KPIs et graphiques à partir des données du résumé */
  private updateSummaryData(response: DashboardSummaryDTO): void {
    this.totalEvents = response.totalEvents;
    this.upcomingEventsCount = response.upcomingEventsCount30d;
    this.totalActiveMembers = response.totalActiveMembers;
    this.totalParticipations = response.totalParticipations;
    this.updateAverageOccupancy(response.averageEventOccupancyRate);
    this.updateMembersChartData(response.monthlyRegistrations);
    this.updateRatingsChartData(response.averageEventRatings);
  }

  /** Met à jour le KPI Taux d'Occupation (avec vérification) */
  private updateAverageOccupancy(rate: number | undefined | null): void {
    if (typeof rate === 'number') {
      // Convertit en format 0-1 (ex: 3.4 => 0.034). Adapte si ton API est différente.
      this.averageEventOccupancy = rate / 100;
    } else {
      this.averageEventOccupancy = 'N/A'; // Valeur par défaut si donnée invalide
      console.warn("Format incorrect pour averageEventOccupancyRate:", rate);
    }
  }

  /** Prépare et assigne les données pour le graphique des inscriptions (LIGNE) */
  private updateMembersChartData(registrations: MonthlyRegistrationPoint[] | undefined | null): void {
    if (!registrations?.length) {
      console.warn("Aucune donnée d'inscription.");
      this.membersChartData = { labels: [], datasets: [] }; // Assure que c'est vide
      return;
    }
    this.membersChartData = {
      labels: registrations.map(p => p.monthYear), // Mois sur l'axe X
      datasets: [{
        data: registrations.map(p => p.count), // Nombre d'inscriptions
        label: 'Inscriptions',
        // Styles pour la ligne
        fill: true,
        backgroundColor: 'rgba(26, 95, 122, 0.1)', // Remplissage bleu très léger
        borderColor: MAIN_BLUE, // Ligne bleue
        pointBackgroundColor: MAIN_BLUE,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: MAIN_BLUE,
        tension: 0.3, // Courbe douce
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    };
    console.log("Données graphique Inscriptions préparées.");
  }

  /** Prépare et assigne les données pour le graphique des notes (BARRES) */
  private updateRatingsChartData(ratings: AverageRatings | undefined | null): void {
    if (!ratings || Object.keys(ratings).length === 0) {
      console.warn("Aucune donnée de notes.");
      this.ratingsChartData = { labels: [], datasets: [] }; // Assure que c'est vide
      return;
    }
    const orderedKeys = ['organisation', 'proprete', 'ambiance', 'fairPlay', 'niveauJoueurs', 'moyenneGenerale'];
    const displayLabels: Record<string, string> = { organisation: 'Organisation', proprete: 'Propreté', ambiance: 'Ambiance', fairPlay: 'Fairplay', niveauJoueurs: 'Niveau', moyenneGenerale: 'Moyenne' };

    this.ratingsChartData = {
      labels: orderedKeys.map(key => displayLabels[key] || key), // Catégories sur l'axe X
      datasets: [{
        data: orderedKeys.map(key => ratings[key] ?? 0), // Notes (ou 0 si manquant)
        label: 'Note',
        // Styles pour les barres
        backgroundColor: 'rgba(242, 97, 34, 0.5)', // Couleur orange
        borderColor: MAIN_ORANGE,
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(242, 97, 34)',
        barPercentage: 0.6, // Largeur des barres
        categoryPercentage: 0.7 // Espace entre groupes
      }]
    };
    console.log("Données graphique Notes préparées.");
  }

  /**
   * Appelé lorsque l'événement (viewDetails) est émis par app-membre-row.
   * Prépare et affiche la modale de détails du membre.
   * @param membre Le membre dont il faut afficher les détails.
   */
  handleViewMemberDetails(membre: Membre): void {
    console.log("Affichage détails pour:", membre);
    this.selectedMemberForDetail = membre;
    this.isDetailModalVisible = true;
    this.cdr.detectChanges(); // Important car l'état change potentiellement en dehors d'un cycle standard
  }

  /**
   * Appelé lorsque la modale de détails émet l'événement (close).
   * Cache la modale et réinitialise le membre sélectionné.
   */
  closeMemberDetailModal(): void {
    console.log("Fermeture modale détails membre");
    this.isDetailModalVisible = false;
    this.selectedMemberForDetail = null;
    // Pas besoin de detectChanges ici car la fermeture est souvent initiée par un clic utilisateur
    // qui déclenche la détection de changements.
  }

  /** Gère les erreurs d'appel API */
  private handleApiError(error: HttpErrorResponse, context: string): void {
    this.notification.show(`Erreur chargement (${context}).`, "error");
    this.totalEvents = "Erreur";
    this.upcomingEventsCount = "Erreur";
    this.averageEventOccupancy = "Erreur";
    this.isLoading = false;
    this.cdr.detectChanges(); // Met à jour la vue pour montrer l'état d'erreur
  }

  /** Gère le cas où l'ID du club est manquant */
  private handleMissingClubId(): void {
    this.notification.show("ID Club manquant.", "error");
    this.totalEvents = 'Erreur ID';
    this.upcomingEventsCount = 'Erreur ID';
    this.averageEventOccupancy = 'Erreur ID';
    this.isLoading = false;
    this.cdr.detectChanges();
  }



  supprimerEvenement(event: Event): void {
    console.log("Supprimer événement:", event);
    // Logique de confirmation et appel API de suppression (probablement deactivateEvent)
    // Attention: recharger les données ou retirer l'élément de la liste après succès
    // this.eventService.deactivateEvent(event.id).subscribe(...) etc.
  }

  mettreAJourEvenement(event: Event): void {
    console.log("Modifier événement:", event);
    // Logique de navigation vers la page d'édition ou ouverture d'un modal
    // this.router.navigate(['/events', event.id, 'edit']);
  }
}

// --- Interfaces DTO ---
interface DashboardSummaryDTO {
  totalEvents: number;
  upcomingEventsCount30d: number;
  averageEventOccupancyRate: number;
  monthlyRegistrations: MonthlyRegistrationPoint[];
  averageEventRatings: AverageRatings;
  totalMembers: number;
  totalActiveMembers : number;
  totalParticipations : number;
}
interface MonthlyRegistrationPoint { count: number; monthYear: string; }
interface AverageRatings { [category: string]: number; }
// ---------------------------

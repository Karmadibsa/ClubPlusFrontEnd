// dashboard.component.ts (Version SIMPLE, STABLE et COMMENTÉE)

import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { SidebarComponent } from '../../../component/navigation/sidebar/sidebar.component'; // Adapte chemin
import { AuthService } from '../../../service/auth.service'; // Adapte chemin
import { NotificationService } from '../../../service/notification.service'; // Adapte chemin
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// --- Imports Chart.js & ng2-charts ---
import { ChartData, ChartOptions, Chart, PointElement, LineElement, Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineController, BarController, Filler } from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';



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
  imports: [ CommonModule, PercentPipe, SidebarComponent, BaseChartDirective ], // Retire DecimalPipe si non utilisé
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

  // --- Propriétés KPIs ---
  totalEvents: number | string = '...';
  upcomingEventsCount: number | string = '...';
  averageEventOccupancy: number | null | string = null;
  totalActiveMembers: number | null | string = null;
  totalParticipations: number | null | string = null;

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

  constructor() {} // Le constructeur est vide, c'est normal

  /** Initialisation: Récupère l'ID et lance le chargement */
  ngOnInit(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) {
      this.loadDashboardData(clubId);
    } else {
      this.handleMissingClubId();
    }
  }

  /** Nettoyage: Annule l'appel API si le composant est détruit */
  ngOnDestroy(): void {
    this.apiSubscription?.unsubscribe();
  }

  /** Charge toutes les données via l'API */
  private loadDashboardData(clubId: number): void {
    this.isLoading = true;
    // Réinitialisation avant l'appel
    this.totalEvents = "..."; this.upcomingEventsCount = "..."; this.averageEventOccupancy = null;this.totalActiveMembers = null;this.totalParticipations = null;
    this.membersChartData = { labels: [], datasets: [] };
    this.ratingsChartData = { labels: [], datasets: [] };

    const url = `${this.baseApiUrl}/stats/clubs/${clubId}/dashboard-summary`;
    console.log("Appel API:", url);

    this.apiSubscription = this.http.get<DashboardSummaryDTO>(url).subscribe({
      /** Succès de l'appel API */
      next: (response) => {
        console.log("Données reçues:", response);

        // 1. Mettre à jour les KPIs
        this.totalEvents = response.totalEvents;
        this.upcomingEventsCount = response.upcomingEventsCount30d;
        this.totalActiveMembers = response.totalActiveMembers;
        this.totalParticipations = response.totalParticipations;
        this.updateAverageOccupancy(response.averageEventOccupancyRate);


        // 2. Mettre à jour les données du graphique des inscriptions (LIGNE)
        this.updateMembersChartData(response.monthlyRegistrations);

        // 3. Mettre à jour les données du graphique des notes (BARRES)
        this.updateRatingsChartData(response.averageEventRatings);

        this.isLoading = false; // Fin du chargement
        this.cdr.detectChanges(); // Notifier Angular pour rafraîchir la vue
        console.log("Données mises à jour.");
      },
      /** Erreur de l'appel API */
      error: (error: HttpErrorResponse) => {
        console.error("Erreur API:", error);
        this.handleApiError(error, 'résumé dashboard'); // Gère l'erreur
      }
    });
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
        backgroundColor: MAIN_ORANGE, // Couleur orange
        borderColor: MAIN_ORANGE,
        borderWidth: 0,
        borderRadius: 5,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(242, 97, 34, 0.85)',
        barPercentage: 0.6, // Largeur des barres
        categoryPercentage: 0.7 // Espace entre groupes
      }]
    };
    console.log("Données graphique Notes préparées.");
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

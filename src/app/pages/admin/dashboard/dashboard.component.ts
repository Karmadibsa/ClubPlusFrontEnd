import {Component, inject, OnInit} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import * as Highcharts from 'highcharts';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {MembreRowComponent} from '../../../component/membre/membre-row/membre-row.component';
import {HighchartsChartModule} from 'highcharts-angular';
import {SidebarComponent} from '../../../component/navigation/sidebar/sidebar.component';
import {AuthService} from '../../../service/auth.service';
import {NotificationService} from '../../../service/notification.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    HighchartsChartModule,
    SidebarComponent
  ],
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // --- Injections ---
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // --- Propriétés pour le Template ---
  // KPIs (comme avant)
  totalEvents: number | string = 'Chargement...';
  upcomingEventsCount: number | string = 'Chargement...';
  averageEventOccupancy: number | string = 'Chargement...';
  totalMembers: number | string = 'Chargement...';

  // --- Propriétés pour Highcharts ---
  Highcharts: typeof Highcharts = Highcharts; // Nécessaire pour le template
  // Initialise les options avec un état "chargement" simple
  membersChartOptions: Highcharts.Options = {
    title: { text: 'Chargement des inscriptions...' },
    series: [] // Important d'avoir au moins un tableau vide pour éviter les erreurs initiales
  };
  ratingsChartOptions: Highcharts.Options = {
    title: { text: 'Chargement des notes...' },
    series: []
  };

  isLoadingSummary = false;
  private readonly baseApiUrl = 'http://localhost:8080/api'; // Adapte si nécessaire

  ngOnInit(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) {
      this.loadDashboardSummary(clubId);
    } else {
      this.handleMissingClubId();
    }
  }

  private loadDashboardSummary(clubId: number): void {
    this.isLoadingSummary = true;
    // Reset KPIs et options des graphiques à l'état "chargement"
    this.totalEvents = "Chargement...";
    // ... reset autres KPIs ...
    this.membersChartOptions = { title: { text: 'Chargement des inscriptions...' }, series: [] };
    this.ratingsChartOptions = { title: { text: 'Chargement des notes...' }, series: [] };

    const url = `${this.baseApiUrl}/stats/clubs/${clubId}/dashboard-summary`;
    console.log("Appel API:", url);

    this.http.get<DashboardSummaryDTO>(url).subscribe({
      next: (response) => {
        console.log("Données reçues:", response); // TU VOIS BIEN CECI DANS LA CONSOLE

        // Mise à jour des KPIs (comme avant)
        this.totalEvents = response.totalEvents;
        this.upcomingEventsCount = response.upcomingEventsCount30d;
        this.averageEventOccupancy = response.averageEventOccupancyRate;
        this.totalMembers = response.totalMembers;

        // --- Appel des fonctions pour mettre à jour CHAQUE graphique ---
        this.updateSimpleMembersChart(response.monthlyRegistrations);
        this.updateSimpleRatingsChart(response.averageEventRatings);
        // -------------------------------------------------------------

        this.isLoadingSummary = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error("Erreur API:", error);
        this.handleApiError(error, 'résumé dashboard');
        // Mettre les graphiques en état d'erreur
        this.membersChartOptions = { title: { text: 'Erreur chargement inscriptions' }, series: [] };
        this.ratingsChartOptions = { title: { text: 'Erreur chargement notes' }, series: [] };
        this.isLoadingSummary = false;
      }
    });
  }


  // --- Gestionnaires d'Erreurs et d'Actions ---
  private handleApiError(error: HttpErrorResponse, context: string): void {
    console.error(`Erreur chargement ${context}:`, error);
    this.notification.show(`Erreur lors du chargement (${context}).`, "error");
    // Pas besoin de onComplete ici car on arrête le loader dans le subscribe
  }

  private handleMissingClubId(): void {
    const userRole = this.authService.getRole();
    if (userRole === 'ADMIN' || userRole === 'RESERVATION') {
      this.notification.show("Erreur critique : Impossible de récupérer l'ID du club géré.", "error");
    } else {
      this.notification.show("Accès non autorisé.", "error");
      this.router.navigate(['/']);
    }
    this.isLoadingSummary = false; // Arrêter ce loader spécifique
    // Mettre les valeurs en état d'erreur
    this.totalEvents = 'Erreur';
  }

  /**
   * RETOUR À LA BASE : Graphique en COLONNES simple.
   * Doit fonctionner si l'environnement est sain.
   */
  private updateSimpleMembersChart(data: MonthlyRegistrationPoint[] | undefined | null): void {
    if (!data || data.length === 0) {
      console.warn("Pas de données d'inscription à afficher.");
      this.membersChartOptions = { title: { text: 'Aucune donnée d\'inscription' }, series: [] };
      return;
    }

    // Extraction des données (identique)
    const categories = data.map(point => point.monthYear);
    const seriesData = data.map(point => point.count);

    console.log("Catégories Membres:", categories);
    console.log("Données Série Membres:", seriesData);

    // Création des options pour un graphique en COLONNES
    this.membersChartOptions = {
      chart: {
        type: 'column' // <-- Retour au type COLONNE
      },
      title: {
        text: 'Inscriptions Mensuelles' // Titre simple
      },
      xAxis: {
        categories: categories,
        title: { text: 'Mois' }
        // PAS de crosshair ici
      } as Highcharts.XAxisOptions, // Assertion pour la compilation si nécessaire
      yAxis: {
        min: 0,
        title: { text: 'Nombre d\'inscriptions' },
        allowDecimals: false
      },
      series: [{
        name: 'Inscriptions',
        type: 'column', // <-- Retour au type COLONNE
        data: seriesData
        // PAS de marker ici (pas très utile pour les colonnes)
      }],
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: {
        // Tooltip simple pour colonnes
        headerFormat: '<span style="font-size: 10px">{point.key}</span><br/>', // Affiche la catégorie (mois)
        pointFormat: '{series.name}: <b>{point.y}</b>'
      }
    };
    console.log("[RETOUR BASE] Options Membres (type Colonne) mises à jour:", this.membersChartOptions);
  }



  /**
   * Crée les options SIMPLES pour le graphique des notes moyennes.
   * Utilise les noms des critères comme catégories sur l'axe X.
   */
  private updateSimpleRatingsChart(data: AverageRatings | undefined | null): void {
    if (!data || Object.keys(data).length === 0) {
      console.warn("Pas de données de notes à afficher.");
      this.ratingsChartOptions = { title: { text: 'Aucune donnée de note' }, series: [] };
      return;
    }

    // 1. Définir l'ordre et les libellés qu'on veut afficher
    const orderedKeys: (keyof AverageRatings)[] = ['organisation', 'proprete', 'ambiance', 'fairPlay', 'niveauJoueurs', 'moyenneGenerale'];
    const displayLabels: { [key in keyof AverageRatings]?: string } = {
      organisation: 'Organisation', proprete: 'Propreté', ambiance: 'Ambiance',
      fairPlay: 'Fairplay', niveauJoueurs: 'Niveau Joueurs', moyenneGenerale: 'Moyenne'
    };

    // 2. Extraire les catégories (les libellés dans l'ordre)
    const categories = orderedKeys.map(key => displayLabels[key] || key); // Prend le joli nom ou la clé
    console.log("Catégories Notes:", categories);

    // 3. Extraire les données (les notes dans le MÊME ordre)
    const seriesData = orderedKeys.map(key => data[key] !== undefined ? data[key] : 0); // Prend la note ou 0 si absente
    console.log("Données Série Notes:", seriesData);

    // 4. Créer l'objet d'options Highcharts
    this.ratingsChartOptions = {
      chart: {
        type: 'bar' // Type simple : barres horizontales
      },
      title: {
        text: 'Notes Moyennes des Événements'
      },
      xAxis: {
        // Utiliser les libellés comme catégories
        categories: categories,
        title: { text: 'Critère' }
      }as Highcharts.XAxisOptions,
      yAxis: {
        min: 0,
        max: 5, // IMPORTANT : Doit correspondre à ton échelle de notes
        title: { text: 'Note Moyenne / 5' }, // Adapter si échelle différente
        labels: { format: '{value:.1f}' } // Afficher une décimale
      },
      series: [{
        name: 'Note Moyenne', // Nom de la série
        type: 'bar',          // Répéter le type
        data: seriesData      // Les données numériques extraites dans l'ordre
      }],
      legend: { enabled: false },
      credits: { enabled: false }
    };
    console.log("Options Notes mises à jour:", this.ratingsChartOptions);
  }


  // Gestion des membres
  onEditMembre(memberUpdates: any): void {
    // this.http.patch(`http://localhost:8080/api/membres/${memberUpdates.id}`, memberUpdates)
    //   .subscribe({
    //     next: () => {
    //       const index = this.lastFiveMembers.findIndex(m => m.id === memberUpdates.id);
    //       if (index !== -1) {
    //         this.lastFiveMembers[index] = { ...this.lastFiveMembers[index], ...memberUpdates };
    //       }
    //     },
    //     error: (err) => console.error('Erreur mise à jour membre:', err)
    //   });
  }

  onDeleteMembre(membre: any): void {
    // if (confirm(`Supprimer ${membre.nom} ?`)) {
    //   this.http.delete(`http://localhost:8080/api/membres/${membre.id}`)
    //     .subscribe({
    //       next: () => {
    //         this.lastFiveMembers = this.lastFiveMembers.filter(m => m.id !== membre.id);
    //       },
    //       error: (err) => console.error('Erreur suppression membre:', err)
    //     });
    // }
  }

  // Gestion des événements
  supprimerEvenement(event: any): void {
    // if (confirm(`Supprimer "${event.titre}" ?`)) {
    //   this.http.delete(`http://localhost:8080/api/events/${event.id}`)
    //     .subscribe({
    //       next: () => {
    //         this.nextFiveEvents = this.nextFiveEvents.filter(e => e.id !== event.id);
    //         this.totalEvents--;
    //       },
    //       error: (err) => console.error('Erreur suppression événement:', err)
    //     });
    // }
  }

  mettreAJourEvenement(eventUpdates: any): void {
    // this.http.put(`http://localhost:8080/api/events/${eventUpdates.id}`, eventUpdates)
    //   .subscribe({
    //     next: () => {
    //       const index = this.nextFiveEvents.findIndex(e => e.id === eventUpdates.id);
    //       if (index !== -1) {
    //         this.nextFiveEvents[index] = { ...this.nextFiveEvents[index], ...eventUpdates };
    //       }
    //     },
    //     error: (err) => console.error('Erreur mise à jour événement:', err)
    //   });
  }
}


export interface DashboardSummaryDTO {
  totalEvents: number;
  upcomingEventsCount30d: number;
  averageEventOccupancyRate: number;
  totalMembers: number;
  monthlyRegistrations: MonthlyRegistrationPoint[];
  averageEventRatings: AverageRatings;
}

export interface MonthlyRegistrationPoint {
  count: number;
  monthYear: string; // Format "YYYY-MM"

}

// Interface pour les notes moyennes (optionnel mais propre)
export interface AverageRatings {
  [category: string]: number;
}

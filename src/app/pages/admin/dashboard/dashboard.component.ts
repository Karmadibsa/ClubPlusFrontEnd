import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {MembreRowComponent} from '../../../component/membre/membre-row/membre-row.component';
import {HighchartsChartModule} from 'highcharts-angular';
import {SidebarComponent} from '../../../component/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    NgForOf,
    EventRowComponent,
    MembreRowComponent,
    HighchartsChartModule,
    DecimalPipe,
    SidebarComponent,
    NgIf
  ],
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Propriétés des statistiques principales
  totalEvents = 0;          // Nombre total d'événements
  upcomingEventsCount = 0;  // Événements à venir dans les 30 jours
  averageParticipation = 0; // Taux de participation moyen

  // Configuration Highcharts
  Highcharts: typeof Highcharts = Highcharts;
  membersChartOptions: Highcharts.Options = {
    title: { text: 'Évolution des inscriptions' },
    series: [{ type: 'line', data: [] }]
  };
  ratingsChartOptions: Highcharts.Options = {
    title: { text: 'Satisfaction des participants' },
    series: [{ type: 'bar', data: [] }]
  };

  // Données pour les tableaux
  allMembres: any[] = [];      // Tous les membres
  lastFiveMembers: any[] = []; // 5 derniers membres inscrits
  nextFiveEvents: any[] = [];  // 5 prochains événements
  evenements: Evenement[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMembres();       // Chargement des membres au démarrage
    this.chargerEvenements(); // Chargement des événements au démarrage
  }

  /**
   * Charge les événements depuis l'API et calcule les statistiques
   */
  chargerEvenements(): void {
    this.http.get<any[]>('http://localhost:8080/api/events').subscribe({
      next: (data) => {
        // Mise à jour de la liste complète
        this.evenements = data;

        // 1. Calcul du taux de participation global
        const { totalPlaces, totalParticipants } = data.reduce((acc, event) => ({
          totalPlaces: acc.totalPlaces + (event.placeTotal || 0),
          totalParticipants: acc.totalParticipants + (event.placeReserve || 0)
        }), { totalPlaces: 0, totalParticipants: 0 });

        this.averageParticipation = totalPlaces > 0
          ? parseFloat(((totalParticipants / totalPlaces) * 100).toFixed(2))
          : 0;

        // 2. Filtrage des prochains événements
        const now = new Date();
        this.nextFiveEvents = data
          .filter(event => new Date(event.start) > now)
          .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .slice(0, 5);

        // 3. Calcul des statistiques de base
        this.totalEvents = data.length;
        const next30Days = new Date(now.setDate(now.getDate() + 30));
        this.upcomingEventsCount = data.filter(event =>
          new Date(event.start) > new Date() &&
          new Date(event.start) <= next30Days
        ).length;

        // 4. Mise à jour du graphique de satisfaction
        this.updateRatingsChart();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.totalEvents = 0;
        this.upcomingEventsCount = 0;
        this.averageParticipation = 0;
      }
    });
  }

  /**
   * Charge les membres depuis l'API et met à jour le graphique
   */
  loadMembres(): void {
    this.http.get<any[]>('http://localhost:8080/api/membres').subscribe({
      next: (data) => {
        this.allMembres = data;

        // 1. Tri des 5 derniers inscrits
        this.lastFiveMembers = data
          .sort((a, b) => new Date(b.date_inscription).getTime() - new Date(a.date_inscription).getTime())
          .slice(0, 5);

        // 2. Mise à jour du graphique des inscriptions
        this.updateMembersChart();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }
// Dans dashboard.component.ts

  /**
   * Génère les données mensuelles pour le graphique des inscriptions
   */
  private generateMonthlyRegistrations(): Highcharts.PointOptionsObject[] {
    const now = new Date();
    const monthlyData: { year: number; month: number; count: number; }[] = [];

    // Générer les 12 derniers mois (du mois courant -11 mois au mois courant)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyData.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        count: 0
      });
    }

    // Compter les inscriptions par mois
    this.allMembres.forEach(membre => {
      const dateInscription = new Date(membre.date_inscription);
      const targetMonth = monthlyData.find(m =>
        m.year === dateInscription.getFullYear() &&
        m.month === dateInscription.getMonth()
      );

      if (targetMonth) {
        targetMonth.count++;
      }
    });

    // Formater pour Highcharts
    return monthlyData.map(entry => ({
      x: Date.UTC(entry.year, entry.month),
      y: entry.count,
      name: new Date(entry.year, entry.month).toLocaleDateString('fr-FR', {
        month: 'long'
      })
    }));
  }

  /**
   * Met à jour le graphique des inscriptions
   */
  private updateMembersChart(): void {
    this.membersChartOptions = {
      chart: {
        type: 'line',
        backgroundColor: 'transparent'
      },
      title: {
        text: 'Inscriptions mensuelles',
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          month: '%b' // Format court français (Janv, Févr, Mars...)
        },
        labels: {
          style: { color: '#1a5f7a' }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Nombre d\'inscriptions',
          style: { color: '#1a5f7a' }
        },
        labels: {
          style: { color: '#1a5f7a' }
        },
        gridLineColor: '#f0f0f0'
      },
      plotOptions: {
        line: {
          color: '#1a5f7a', // Couleur principale
          marker: {
            fillColor: '#ffffff',
            lineWidth: 2,
            lineColor: '#f26122'
          }
        }
      },
      series: [{
        type: 'line',
        name: 'Inscriptions',
        data: this.generateMonthlyRegistrations()
      }]
    };
  }


          /**
   * Met à jour le graphique de satisfaction (données fixes)
   */
          private updateRatingsChart(): void {
            this.ratingsChartOptions = {
              chart: {
                type: 'bar',
                backgroundColor: 'transparent' // Fond transparent pour une meilleure intégration
              },
              title: {
                text: 'Satisfaction moyenne',
              },
              xAxis: {
                categories: ['Ambiance', 'Propreté', 'Organisation', 'Fairplay'],
                title: { text: null },
                labels: {
                  style: { color: 'var(--main-blue)' } // Couleur des libellés de l'axe X
                }
              },
              yAxis: {
                min: 0,
                max: 20,
                title: {
                  text: 'Note/20',
                  style: { color: 'var(--main-blue)' } // Couleur du titre de l'axe Y
                },
                labels: {
                  style: { color: 'var(--main-blue)' } // Couleur des valeurs de l'axe Y
                },
                gridLineColor: '#f0f0f0' // Couleur des lignes de la grille
              },
              plotOptions: {
                bar: {
                  borderWidth: 0,
                  colorByPoint: true, // Permet d'utiliser différentes couleurs pour chaque barre
                  colors: ['var(--main-orange)', 'var(--main-blue)', 'var(--main-orange)', 'var(--main-blue)'] // Alternance des couleurs
                }
              },
              series: [{
                type: 'bar',
                name: 'Satisfaction',
                data: [16, 14, 12, 15],
                colorByPoint: true // Active la couleur par point
              }]
            };
          }

  // Gestion des membres
  onEditMembre(memberUpdates: any): void {
    this.http.patch(`http://localhost:8080/api/membres/${memberUpdates.id}`, memberUpdates)
      .subscribe({
        next: () => {
          const index = this.lastFiveMembers.findIndex(m => m.id === memberUpdates.id);
          if (index !== -1) {
            this.lastFiveMembers[index] = { ...this.lastFiveMembers[index], ...memberUpdates };
          }
        },
        error: (err) => console.error('Erreur mise à jour membre:', err)
      });
  }

  onDeleteMembre(membre: any): void {
    if (confirm(`Supprimer ${membre.nom} ?`)) {
      this.http.delete(`http://localhost:8080/api/membres/${membre.id}`)
        .subscribe({
          next: () => {
            this.lastFiveMembers = this.lastFiveMembers.filter(m => m.id !== membre.id);
          },
          error: (err) => console.error('Erreur suppression membre:', err)
        });
    }
  }

  // Gestion des événements
  supprimerEvenement(event: any): void {
    if (confirm(`Supprimer "${event.titre}" ?`)) {
      this.http.delete(`http://localhost:8080/api/events/${event.id}`)
        .subscribe({
          next: () => {
            this.nextFiveEvents = this.nextFiveEvents.filter(e => e.id !== event.id);
            this.totalEvents--;
          },
          error: (err) => console.error('Erreur suppression événement:', err)
        });
    }
  }

  mettreAJourEvenement(eventUpdates: any): void {
    this.http.put(`http://localhost:8080/api/events/${eventUpdates.id}`, eventUpdates)
      .subscribe({
        next: () => {
          const index = this.nextFiveEvents.findIndex(e => e.id === eventUpdates.id);
          if (index !== -1) {
            this.nextFiveEvents[index] = { ...this.nextFiveEvents[index], ...eventUpdates };
          }
        },
        error: (err) => console.error('Erreur mise à jour événement:', err)
      });
  }
}

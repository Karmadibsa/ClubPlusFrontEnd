// dashboard.component.ts
import {Component, inject} from '@angular/core';
import * as Highcharts from 'highcharts';
import {HighchartsChartModule} from 'highcharts-angular';
import {NgForOf} from '@angular/common';
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {MembreRowComponent} from '../../../component/membre/membre-row/membre-row.component';
import {SidebarComponent} from '../../../component/sidebar/sidebar.component';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  imports: [
    HighchartsChartModule,
    NgForOf,
    EventRowComponent,
    MembreRowComponent,
    SidebarComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // Propriétés pour les statistiques
  totalEvents = 0;
  upcomingEventsCount = 0;
  averageParticipation = 0;
  // Configuration Highcharts
  Highcharts: typeof Highcharts = Highcharts;

  membersChartOptions: Highcharts.Options = {
    title: {text: 'Évolution des inscriptions sur les 12 derniers mois'},
    series: [{
      type: 'line',
      data: [65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56, 55, 40,]
    }]
  };

  eventsChartOptions: Highcharts.Options = {
    title: {text: 'Satisfaction des participants'},
    xAxis: {
      categories: ['Ambiance', 'Propreté', 'Organisation', 'Fairplay/Niveau des joueurs']
    },
    yAxis: {
      title: {text: 'Notes'}
    },
    series: [{
      type: 'bar',
      data: [
        {name: 'Ambiance', y: 12},
        {name: 'Propreté', y: 15},
        {name: 'Organisation', y: 8},
        {name: 'Fairplay/Niveau des joueurs', y: 10}
      ]
    }]
  };

  http = inject(HttpClient)
  evenements: Evenement[] = []
  membres: Membre[] = []

  ngOnInit() {
    this.http.get<Evenement[]>("http://localhost:8080/api/events")
      .subscribe(listeevents => this.evenements = listeevents)
    this.http.get<Membre[]>("http://localhost:8080/api/membres")
      .subscribe(listemembres => this.membres = listemembres)
  }

}


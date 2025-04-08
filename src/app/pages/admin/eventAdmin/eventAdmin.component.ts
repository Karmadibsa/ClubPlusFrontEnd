import {Component} from '@angular/core'; // <-- Import correct
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {NgForOf, NgIf} from '@angular/common';
import {FilterEventComponent} from '../../../component/event/filter-event/filter-event.component';
import {SidebarComponent} from '../../../component/sidebar/sidebar.component';
import {EditEventComponent} from '../../../component/event/edit-event/edit-event.component';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-event',
  templateUrl: './eventAdmin.component.html',
  imports: [
    EventRowComponent,
    NgForOf,
    FilterEventComponent,
    SidebarComponent,
    EditEventComponent,
    NgIf
  ],
  styleUrls: ['./eventAdmin.component.scss']
})
export class EventAdminComponent {
  evenements: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerEvenements();
  }

  chargerEvenements(): void {
    this.http.get<any[]>('http://localhost:8080/api/events')
      .subscribe({
        next: (data) => {
          this.evenements = data;
          console.log('Événements chargés:', data);
        },
        error: (err) => console.error('Erreur de chargement des événements:', err)
      });
  }

  supprimerEvenement(evenement: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${evenement.titre}" ?`)) {
      this.http.delete(`http://localhost:8080/api/events/${evenement.id}`)
        .subscribe({
          next: () => {
            this.evenements = this.evenements.filter(e => e.id !== evenement.id);
            console.log('Événement supprimé avec succès');
          },
          error: (err) => console.error('Erreur de suppression:', err)
        });
    }
  }

  mettreAJourEvenement(evenement: any): void {
    this.http.put(`http://localhost:8080/api/events/${evenement.id}`, evenement)
      .subscribe({
        next: () => {
          console.log('Événement mis à jour avec succès');
          this.chargerEvenements(); // Recharger tous les événements
        },
        error: (err) => console.error('Erreur de mise à jour:', err)
      });
  }
}

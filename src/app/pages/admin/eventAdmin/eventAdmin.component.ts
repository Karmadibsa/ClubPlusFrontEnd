import {Component} from '@angular/core'; // <-- Import correct
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {NgForOf, NgIf} from '@angular/common';
import {FilterEventComponent} from '../../../component/event/filter-event/filter-event.component';
import {SidebarComponent} from '../../../component/navigation/sidebar/sidebar.component';
import {EditEventComponent} from '../../../component/event/edit-event/edit-event.component';
import {HttpClient} from '@angular/common/http';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-event',
  templateUrl: './eventAdmin.component.html',
  imports: [
    EventRowComponent,
    NgForOf,
    FilterEventComponent,
    SidebarComponent,
    EditEventComponent,
    NgIf,
    LucideAngularModule
  ],
  styleUrls: ['./eventAdmin.component.scss']
})
export class EventAdminComponent {
  evenements: any[] = [];
  isModalVisible = false; // Contrôle la visibilité de la modal
  evenementEnCours: any = {}; // Stocke l'événement en cours d'édition ou de création

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

  /**
   * Ouvre la modal pour créer un nouvel événement
   */
  ouvrirModalCreation(): void {
    this.evenementEnCours = {}; // Initialise un nouvel objet vide pour un nouvel événement
    this.isModalVisible = true; // Affiche la modal
  }

  /**
   * Ferme la modal
   */
  fermerModal(): void {
    this.isModalVisible = false; // Cache la modal
  }

  /**
   * Sauvegarde l'événement (création ou modification)
   */
  sauvegarderEvenement(evenement: any): void {
    if (evenement.id) {
      // Si l'événement a un ID, il s'agit d'une modification
      this.mettreAJourEvenement(evenement);
    } else {

      const jwt = localStorage.getItem("jwt")
      if(jwt){
      this.http.post('http://localhost:8080/api/events', {headers : {Authorization : "Bearer" + localStorage.getItem("jwt")}}, evenement).subscribe({
        next: (nouvelEvenement) => {
          console.log('Événement créé avec succès:', nouvelEvenement);
          this.evenements.push(nouvelEvenement); // Ajoute le nouvel événement à la liste
          this.fermerModal();
        },
        error: (err) => console.error('Erreur lors de la création de l\'événement:', err)
      });
      }
      }
    }
  //     // Sinon, il s'agit d'une création
  //       this.http.post('http://localhost:8080/api/events', {headers : {Authorization : "Bearer" + localStorage.getItem("jwt")}} evenement).subscribe({
  //       next: (nouvelEvenement) => {
  //         console.log('Événement créé avec succès:', nouvelEvenement);
  //         this.evenements.push(nouvelEvenement); // Ajoute le nouvel événement à la liste
  //         this.fermerModal();
  //       },
  //       error: (err) => console.error('Erreur lors de la création de l\'événement:', err)
  //     });
  //   }
  // }


}

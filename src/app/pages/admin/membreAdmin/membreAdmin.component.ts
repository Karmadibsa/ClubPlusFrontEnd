import {Component} from '@angular/core'; // <-- Import correct
import {MembreRowComponent} from '../../../component/membre/membre-row/membre-row.component';
import {NgForOf} from '@angular/common';
import {FilterMembreComponent} from '../../../component/membre/filter-membre/filter-membre.component';
import {SidebarComponent} from '../../../component/sidebar/sidebar.component';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-membre',
  templateUrl: './membreAdmin.component.html',
  imports: [
    MembreRowComponent,
    NgForOf,
    FilterMembreComponent,
    SidebarComponent
  ],
  styleUrls: ['./membreAdmin.component.scss']
})
export class MembreAdminComponent {
  allMembres: any[] = [];
  displayedMembres: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMembres();
  }

  loadMembres(): void {
    this.http.get<any[]>('http://localhost:8080/api/membres')
      .subscribe({
        next: (data) => {
          this.allMembres = data;
          this.displayedMembres = data; // Initialement, tous les membres sont affichés
          console.log('Membres chargés:', data);
        },
        error: (err) => console.error('Erreur de chargement des membres:', err)
      });
  }

  handleFilteredMembres(filteredMembres: any[]): void {
    this.displayedMembres = filteredMembres;
  }

  onEditMembre(memberUpdates: any): void {
    const id = memberUpdates.id;
    // Retirer l'ID car il n'est pas nécessaire dans la requête PATCH
    delete memberUpdates.id;

    console.log('Mise à jour du membre:', id, 'avec modifications:', memberUpdates);

    // Utiliser PATCH au lieu de PUT
    this.http.patch(`http://localhost:8080/api/membres/${id}`, memberUpdates)
      .subscribe({
        next: () => {
          console.log('Membre mis à jour avec succès');
          this.loadMembres(); // Recharger tous les membres
        },
        error: (err) => console.error('Erreur de mise à jour:', err)
      });
  }

  onDeleteMembre(membre: any): void {
    console.log('Membre à supprimer:', membre);
    if (confirm(`Êtes-vous sûr de vouloir supprimer le membre ${membre.nom} ${membre.prenom} ?`)) {
      this.http.delete(`http://localhost:8080/api/membres/${membre.id}`)
        .subscribe({
          next: () => {
            console.log('Membre supprimé avec succès');
            // Mise à jour de la liste locale
            this.allMembres = this.allMembres.filter(m => m.id !== membre.id);
            this.displayedMembres = this.displayedMembres.filter(m => m.id !== membre.id);
          },
          error: (err) => console.error('Erreur de suppression:', err)
        });
    }
  }

}

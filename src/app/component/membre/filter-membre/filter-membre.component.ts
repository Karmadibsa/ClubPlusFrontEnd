import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-filter-membre',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './filter-membre.component.html',
  styleUrls: ['./filter-membre.component.scss']
})
export class FilterMembreComponent {
  searchQuery = ''; // Barre de recherche
  sortDirection: 'asc' | 'desc' = 'asc'; // Tri par défaut

  @Input() membres: any[] = []; // Liste complète des membres
  @Output() filteredMembresChange = new EventEmitter<any[]>(); // Émet les membres filtrés

  // Méthode appelée pour filtrer et trier les membres
  applyFilters(): void {
    const filtered = this.membres
      .filter(membre => {
        const fullName = `${membre.nom.toLowerCase()} ${membre.prenom.toLowerCase()}`;
        return fullName.includes(this.searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        if (this.sortDirection === 'asc') {
          return a.nom.localeCompare(b.nom); // Tri alphabétique croissant
        } else {
          return b.nom.localeCompare(a.nom); // Tri alphabétique décroissant
        }
      });

    this.filteredMembresChange.emit(filtered); // Émet les résultats filtrés et triés
  }

  // Basculer la direction du tri
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(); // Réappliquer les filtres après changement de tri
  }
}

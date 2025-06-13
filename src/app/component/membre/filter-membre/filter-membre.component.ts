import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PaginationComponent } from '../../navigation/pagination/pagination.component';
import { Membre } from '../../../model/membre';

/**
 * Gère la logique de filtrage et de tri d'une liste de membres.
 *
 * Ce composant fournit une interface pour rechercher un membre par nom/prénom
 * et pour trier la liste résultante. Il est conçu pour fonctionner de pair
 * avec un composant de pagination.
 *
 * @example
 * <app-filter-membre
 * [membres]="allMembres"
 * (filteredMembresChange)="updateDisplayedMembres($event)">
 * </app-filter-membre>
 */
@Component({
  selector: 'app-filter-membre',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    PaginationComponent
  ],
  templateUrl: './filter-membre.component.html',
  styleUrls: ['./filter-membre.component.scss']
})
export class FilterMembreComponent {

  /** La liste complète et non filtrée des membres. */
  @Input() membres: Membre[] = [];

  /** Émet la liste des membres filtrée et triée à chaque changement. */
  @Output() filteredMembresChange = new EventEmitter<Membre[]>();

  /** Le terme de recherche lié au champ de saisie. */
  public searchQuery = '';
  /** La direction actuelle du tri par nom. */
  public sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * Applique les critères de recherche et de tri à la liste des membres.
   *
   * Cette méthode est déclenchée par une interaction de l'utilisateur avec
   * les contrôles de filtre.
   */
  public applyFilters(): void {
    const termeRechercheMinuscule = this.searchQuery.toLowerCase().trim();

    const filtered = this.membres.filter(membre => {
      if (!termeRechercheMinuscule) {
        return true; // Si pas de recherche, inclure tous les membres.
      }
      // Recherche insensible à la casse sur "nom prénom" et "prénom nom".
      const nomComplet = `${membre.nom?.toLowerCase() || ''} ${membre.prenom?.toLowerCase() || ''}`.trim();
      const prenomNomComplet = `${membre.prenom?.toLowerCase() || ''} ${membre.nom?.toLowerCase() || ''}`.trim();
      return nomComplet.includes(termeRechercheMinuscule) || prenomNomComplet.includes(termeRechercheMinuscule);
    })
      .sort((a, b) => {
        // Tri alphabétique correct qui gère les accents.
        const nomA = a.nom?.toLowerCase() || '';
        const nomB = b.nom?.toLowerCase() || '';

        return this.sortDirection === 'asc'
          ? nomA.localeCompare(nomB)
          : nomB.localeCompare(nomA);
      });

    this.filteredMembresChange.emit(filtered);
  }

  /**
   * Inverse la direction du tri et réapplique les filtres.
   */
  public toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }
}

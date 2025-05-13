import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PaginationComponent } from '../../navigation/pagination/pagination.component';
import {Membre} from '../../../model/membre';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-filter-membre',     // Sélecteur CSS pour utiliser ce composant.
  // Exemple: <app-filter-membre [membres]="listeCompleteMembres" (filteredMembresChange)="onMembresFiltres($event)"></app-filter-membre>
  standalone: true,                 // Indique que c'est un composant autonome.
  imports: [
    ReactiveFormsModule,            // Potentiellement pour une évolution future.
    FormsModule,                    // Essentiel si [(ngModel)] est utilisé pour `searchQuery` dans le template.
    LucideAngularModule,            // Pour les icônes.
    PaginationComponent             // Si le template de ce composant inclut <app-pagination>.
  ],
  templateUrl: './filter-membre.component.html', // Template HTML contenant les contrôles de filtre.
  styleUrls: ['./filter-membre.component.scss']  // Styles SCSS spécifiques.
})
export class FilterMembreComponent {
  /**
   * @property searchQuery
   * @description Le terme de recherche saisi par l'utilisateur pour filtrer par nom/prénom.
   *              Sera probablement lié à un champ <input> via [(ngModel)] dans le template.
   */
  searchQuery = '';

  /**
   * @property sortDirection
   * @description La direction actuelle du tri (par nom).
   *              Peut être 'asc' (ascendant) ou 'desc' (descendant).
   */
  sortDirection: 'asc' | 'desc' = 'asc'; // Tri ascendant par défaut.

  /**
   * @Input() membres: any[]
   * @description La liste complète des membres à filtrer et trier.
   *              Fournie par le composant parent.
   *              NOTE IMPORTANTE : Utiliser `any[]` est une mauvaise pratique.
   *              Il est fortement recommandé de remplacer `any[]` par `Membre[]`
   *              (en important votre interface `Membre` de `../../../model/membre`).
   *              Cela active la vérification de type et améliore la maintenabilité.
   *              Exemple: `@Input() membres: Membre[] = [];`
   */
  @Input() membres: Membre[] = [];

  /**
   * @Output() filteredMembresChange
   * @description Événement émis vers le composant parent chaque fois que les filtres ou le tri
   *              sont appliqués. La valeur émise est le nouveau tableau de membres filtrés et triés.
   *              NOTE IMPORTANTE : De même, typer avec `EventEmitter<Membre[]>` serait mieux.
   *              Exemple: `@Output() filteredMembresChange = new EventEmitter<Membre[]>();`
   */
  @Output() filteredMembresChange = new EventEmitter<Membre[]>();

  /**
   * @method applyFilters
   * @description Fonction principale appelée pour filtrer la liste `membres` en fonction de
   *              `searchQuery` et la trier en fonction de `sortDirection`.
   *              Émet ensuite le résultat via `filteredMembresChange`.
   *              Cette méthode est typiquement appelée lorsque `searchQuery` change
   *              (ex: `(ngModelChange)`) ou lorsque `sortDirection` change (`(click)` sur un bouton de tri).
   */
  applyFilters(): void {

    // 1. Filtrage basé sur `searchQuery`.
    const filtered = this.membres
      .filter(membre => {
        // Crée une chaîne complète "nom prénom" en minuscules pour une recherche insensible à la casse.
        // S'assure que membre.nom et membre.prenom existent.
        const nomComplet = `${membre.nom?.toLowerCase() || ''} ${membre.prenom?.toLowerCase() || ''}`.trim();
        const prenomNomComplet = `${membre.prenom?.toLowerCase() || ''} ${membre.nom?.toLowerCase() || ''}`.trim(); // Pour chercher "prénom nom"

        const termeRechercheMinuscule = this.searchQuery.toLowerCase().trim();

        // Vérifie si le nom complet (dans les deux ordres) inclut le terme de recherche.
        // Si searchQuery est vide, la condition `!termeRechercheMinuscule` serait vraie, mais .includes('') est aussi vrai.
        // Il est plus clair de vérifier si termeRechercheMinuscule est vide en premier.
        if (!termeRechercheMinuscule) {
          return true; // Si pas de terme de recherche, tous les membres passent le filtre.
        }
        return nomComplet.includes(termeRechercheMinuscule) || prenomNomComplet.includes(termeRechercheMinuscule);
      })
      // 2. Tri du résultat filtré.
      .sort((a, b) => {
        // `localeCompare` est utilisé pour un tri alphabétique correct des chaînes,
        // gérant bien les accents et les spécificités linguistiques.
        // S'assure que a.nom et b.nom existent.
        const nomA = a.nom?.toLowerCase() || '';
        const nomB = b.nom?.toLowerCase() || '';

        if (this.sortDirection === 'asc') {
          return nomA.localeCompare(nomB); // Tri ascendant (A-Z).
        } else {
          return nomB.localeCompare(nomA); // Tri descendant (Z-A).
        }
      });

    // 3. Émission du tableau filtré et trié vers le composant parent.
    this.filteredMembresChange.emit(filtered);
  }

  /**
   * @method toggleSortDirection
   * @description Inverse la direction du tri actuelle (`asc` <-> `desc`)
   *              et réapplique immédiatement les filtres et le tri.
   */
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(); // Réappliquer pour trier avec la nouvelle direction et émettre.
  }
}

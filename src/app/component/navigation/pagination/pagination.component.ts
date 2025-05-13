import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-pagination',      // Sélecteur CSS pour utiliser ce composant.
  // Exemple: <app-pagination [currentPage]="..." [totalItems]="..." (pageChange)="...">
  standalone: true,                 // Supposons qu'il soit autonome.
  imports: [
    // CommonModule // Si *ngIf, @if, *ngFor, @for, etc. sont utilisés dans le template HTML.
  ],
  templateUrl: './pagination.component.html', // Template HTML pour l'interface de pagination.
  styleUrl: './pagination.component.scss'    // Styles SCSS spécifiques.
})
// Implémente OnChanges pour réagir aux changements des Inputs 'totalItems' et 'itemsPerPage'.
export class PaginationComponent implements OnChanges {
  // --- INPUTS (Configurés par le parent) ---

  /**
   * @Input() currentPage
   * @description La page actuellement active/sélectionnée.
   *              Initialisée à 1 par défaut.
   */
  @Input() currentPage: number = 1;

  /**
   * @Input() totalItems
   * @description Le nombre total d'éléments à paginer.
   *              Utilisé pour calculer le nombre total de pages.
   *              Initialisé à 0 par défaut.
   */
  @Input() totalItems: number = 0;

  /**
   * @Input() itemsPerPage
   * @description Le nombre d'éléments à afficher par page.
   *              Utilisé pour calculer le nombre total de pages.
   *              Initialisé à 10 par défaut.
   */
  @Input() itemsPerPage: number = 10;

  // --- OUTPUTS (Événements vers le parent) ---

  /**
   * @Output() pageChange
   * @description Événement émis vers le composant parent lorsque l'utilisateur sélectionne
   *              une nouvelle page. La valeur émise est le numéro de la nouvelle page sélectionnée.
   *              Le parent écoutera cet événement pour charger/afficher les données de la nouvelle page.
   */
  @Output() pageChange = new EventEmitter<number>();

  // --- PROPRIÉTÉS INTERNES (Calculées) ---

  /**
   * @property totalPages
   * @description Le nombre total de pages, calculé à partir de `totalItems` et `itemsPerPage`.
   */
  totalPages: number = 0;

  /**
   * @property pages
   * @description Un tableau de numéros de page (ex: [1, 2, 3, 4, 5]) à afficher dans l'interface.
   *              Actuellement, il génère toutes les pages. Pour de nombreuses pages, une logique
   *              plus avancée (ex: afficher "...", "1 ... 5 6 7 ... 20") serait nécessaire.
   */
  pages: number[] = [];

  /**
   * @method ngOnChanges
   * @description Crochet de cycle de vie Angular appelé lorsque les valeurs des propriétés @Input changent.
   *              Utilisé ici pour recalculer la pagination (`totalPages` et `pages`) si
   *              `totalItems` ou `itemsPerPage` sont modifiés par le parent.
   * @param changes Un objet `SimpleChanges` contenant les modifications des @Input.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Vérifie si 'totalItems' ou 'itemsPerPage' ont changé.
    if (changes['totalItems'] || changes['itemsPerPage']) {
      console.log('PaginationComponent: totalItems ou itemsPerPage a changé, recalcul de la pagination.');
      this.calculatePagination();
    }
    // Optionnel: si currentPage change de l'extérieur et est invalide, on pourrait le corriger ici.
    // if (changes['currentPage'] && (this.currentPage < 1 || this.currentPage > this.totalPages)) {
    //   // Gérer le cas où la page courante devient invalide suite à un changement de totalItems, etc.
    //   // Par exemple, si on était à la page 5/5 et que totalItems diminue, on pourrait être à la page 5/3.
    //   // On pourrait vouloir forcer la page à 1 ou à this.totalPages.
    //   // Cependant, le parent est souvent responsable de la mise à jour de currentPage.
    // }
  }

  /**
   * @private calculatePagination
   * @description Méthode privée pour calculer le nombre total de pages (`totalPages`)
   *              et générer le tableau des numéros de page (`pages`) à afficher.
   */
  private calculatePagination(): void {
    // Si pas d'éléments ou pas d'items par page, il n'y a pas de pages.
    if (this.totalItems <= 0 || this.itemsPerPage <= 0) {
      this.totalPages = 0;
      this.pages = [];
      console.log('PaginationComponent: totalItems ou itemsPerPage invalide, pagination réinitialisée.');
      return;
    }

    // Calcule le nombre total de pages. `Math.ceil` arrondit au nombre entier supérieur
    // pour s'assurer que tous les items sont couverts (ex: 11 items / 10 par page = 2 pages).
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Génère un tableau simple de numéros de page, de 1 à `totalPages`.
    // `Array.from({length: this.totalPages}, (_, i) => i + 1)` crée un tableau
    // de longueur `totalPages` et remplit chaque élément avec son index `i` + 1.
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    console.log(`PaginationComponent: Pagination calculée - totalPages: ${this.totalPages}, pages:`, this.pages);

    // Assurer que currentPage reste valide
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      console.log(`PaginationComponent: currentPage (${this.currentPage}) est > totalPages (${this.totalPages}). Réajustement vers la dernière page.`);
      // Si la page actuelle devient supérieure au nouveau nombre total de pages,
      // on pourrait vouloir émettre un changement vers la dernière page valide.
      // this.selectPage(this.totalPages); // Cela émettrait un pageChange.
      // Ou laisser le parent gérer la mise à jour de currentPage.
      // Pour l'instant, on ne fait que calculer. Le parent mettra à jour currentPage.
    }
  }

  /**
   * @method selectPage
   * @description Méthode appelée lorsque l'utilisateur clique sur un numéro de page spécifique.
   *              Vérifie si la page sélectionnée est valide et différente de la page actuelle,
   *              puis émet l'événement `pageChange` avec le nouveau numéro de page.
   * @param page Le numéro de la page sur laquelle l'utilisateur a cliqué.
   */
  selectPage(page: number): void {
    // Vérifie si la page est dans les limites valides et si elle est différente de la page actuelle.
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log(`PaginationComponent: Sélection de la page ${page}. Émission de pageChange.`);
      this.pageChange.emit(page); // Émet le changement de page vers le parent.
      // Le composant parent mettra à jour son propre état de page actuelle,
      // ce qui, via le data binding [currentPage]="...", mettra à jour l'input de ce composant.
    } else {
      console.log(`PaginationComponent: Sélection de page invalide ou inchangée (page: ${page}, currentPage: ${this.currentPage}, totalPages: ${this.totalPages}).`);
    }
  }

  /**
   * @method goToPrevious
   * @description Navigue vers la page précédente si ce n'est pas la première page.
   *              Appelée par un clic sur le bouton "Précédent".
   */
  goToPrevious(): void {
    if (this.currentPage > 1) {
      this.selectPage(this.currentPage - 1);
    }
  }

  /**
   * @method goToNext
   * @description Navigue vers la page suivante si ce n'est pas la dernière page.
   *              Appelée par un clic sur le bouton "Suivant".
   */
  goToNext(): void {
    if (this.currentPage < this.totalPages) {
      this.selectPage(this.currentPage + 1);
    }
  }
}

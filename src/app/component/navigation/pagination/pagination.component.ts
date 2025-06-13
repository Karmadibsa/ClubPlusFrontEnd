import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Gère la logique et l'affichage d'un contrôle de pagination.
 *
 * Ce composant calcule le nombre de pages nécessaires en fonction du nombre total
 * d'éléments et émet un événement lorsque l'utilisateur navigue vers une autre page.
 *
 * @example
 * <app-pagination
 * [currentPage]="currentPage"
 * [totalItems]="totalItems"
 * [itemsPerPage]="10"
 * (pageChange)="onPageChange($event)">
 * </app-pagination>
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    CommonModule // Nécessaire pour @if, @for
  ],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnChanges {

  /** La page actuellement active. */
  @Input() currentPage: number = 1;

  /** Le nombre total d'éléments à paginer. */
  @Input() totalItems: number = 0;

  /** Le nombre d'éléments à afficher par page. */
  @Input() itemsPerPage: number = 10;

  /** Émis avec le nouveau numéro de page lorsque l'utilisateur change de page. */
  @Output() pageChange = new EventEmitter<number>();

  /** Le nombre total de pages, calculé en interne. */
  public totalPages: number = 0;
  /** Le tableau de numéros de page à afficher. */
  public pages: number[] = [];

  /**
   * Recalcule la pagination lorsque les `Inputs` changent.
   * @param changes - L'objet contenant les `@Input` modifiés.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItems'] || changes['itemsPerPage']) {
      this.calculatePagination();
    }
  }

  /**
   * Calcule le nombre total de pages et génère la liste des numéros de page.
   */
  private calculatePagination(): void {
    if (this.totalItems <= 0 || this.itemsPerPage <= 0) {
      this.totalPages = 0;
      this.pages = [];
      return;
    }

    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    // Note: La logique actuelle génère toutes les pages. Voir suggestions pour l'améliorer.
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /**
   * Émet l'événement de changement de page.
   * @param page - Le numéro de la page sélectionnée.
   */
  public selectPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  /**
   * Navigue vers la page précédente.
   */
  public goToPrevious(): void {
    if (this.currentPage > 1) {
      this.selectPage(this.currentPage - 1);
    }
  }

  /**
   * Navigue vers la page suivante.
   */
  public goToNext(): void {
    if (this.currentPage < this.totalPages) {
      this.selectPage(this.currentPage + 1);
    }
  }
}

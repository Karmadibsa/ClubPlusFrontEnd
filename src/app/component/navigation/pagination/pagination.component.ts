import {Component, EventEmitter, inject, Input, Output, SimpleChanges} from '@angular/core';
import {AuthService} from '../../../service/security/auth.service';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10; // Default items per page
  @Output() pageChange = new EventEmitter<number>();

  totalPages: number = 0;
  pages: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    // Recalculer quand les inputs changent
    if (changes['totalItems'] || changes['itemsPerPage']) {
      this.calculatePagination();
    }
  }

  private calculatePagination(): void {
    if (this.totalItems <= 0 || this.itemsPerPage <= 0) {
      this.totalPages = 0;
      this.pages = [];
      return;
    }
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    // Générer les numéros de page (simple pour l'instant, peut être amélioré)
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  selectPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToPrevious(): void {
    if (this.currentPage > 1) {
      this.selectPage(this.currentPage - 1);
    }
  }

  goToNext(): void {
    if (this.currentPage < this.totalPages) {
      this.selectPage(this.currentPage + 1);
    }
  }
}

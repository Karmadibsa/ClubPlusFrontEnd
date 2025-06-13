import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { Evenement } from '../../../model/evenement';
import { AuthService } from '../../../service/security/auth.service';

/**
 * Gère la logique de filtrage et de tri d'une liste d'événements.
 *
 * Ce composant fournit une interface utilisateur pour filtrer les événements
 * par texte, date, et autres critères. Il reçoit une liste complète d'événements
 * et émet une nouvelle liste filtrée et triée à chaque modification des filtres.
 *
 * @example
 * <app-filter-event
 * [events]="allEvents"
 * (filteredEventsChange)="updateDisplayedEvents($event)">
 * </app-filter-event>
 */
@Component({
  selector: 'app-filter-event',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    CommonModule
  ],
  templateUrl: './filter-event.component.html',
  styleUrls: ['./filter-event.component.scss']
})
export class FilterEventComponent implements OnChanges {

  /** La liste source et complète des événements à filtrer. */
  @Input() events: Evenement[] = [];

  /** Émet la liste d'événements filtrée et triée à chaque changement. */
  @Output() filteredEventsChange = new EventEmitter<Evenement[]>();

  // --- Propriétés liées aux contrôles de filtre via ngModel ---
  public searchQuery = '';
  public startDateLocal: string | null = null;
  public endDateLocal: string | null = null;
  public filterAvailablePlaces = false;
  public filterWithFriends = false;
  public sortDirection: 'asc' | 'desc' = 'asc';

  public readonly auth = inject(AuthService);

  /**
   * Réapplique les filtres si la liste source `events` est modifiée.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      this.applyFilters();
    }
  }

  /**
   * Applique tous les filtres et le tri à la liste d'événements.
   *
   * Cette méthode centrale est déclenchée par toute interaction de l'utilisateur
   * avec les contrôles de filtre. Elle reconstruit la liste affichée et l'émet.
   */
  public applyFilters(): void {
    // Conversion des dates de filtre pour une comparaison fiable.
    const startFilterDate = this.startDateLocal ? new Date(this.startDateLocal) : null;
    if (startFilterDate) {
      startFilterDate.setHours(0, 0, 0, 0);
    }

    const endFilterDate = this.endDateLocal ? new Date(this.endDateLocal) : null;
    if (endFilterDate) {
      endFilterDate.setHours(23, 59, 59, 999);
    }

    let filtered = this.events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      const searchMatch = !this.searchQuery ||
        event.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const startMatch = !startFilterDate || eventStart >= startFilterDate;
      const endMatch = !endFilterDate || eventEnd <= endFilterDate;

      const availableMatch = !this.filterAvailablePlaces || (event.placeReserve ?? 0) < (event.placeTotal ?? 0);

      const friendsMatch = !this.filterWithFriends || (event.amiParticipants && event.amiParticipants.length > 0);

      return searchMatch && startMatch && endMatch && availableMatch && friendsMatch;
    });

    // Tri de la liste filtrée.
    filtered.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    this.filteredEventsChange.emit(filtered);
  }

  /**
   * Inverse la direction du tri et réapplique les filtres.
   */
  public toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }
}

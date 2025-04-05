import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-filter-event',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './filter-event.component.html',
  styleUrls: ['./filter-event.component.scss']
})
export class FilterEventComponent {
  sortDirection: 'asc' | 'desc' = 'asc';
  searchQuery = '';
  startDate = '';
  startTime = '';
  endDate = '';
  endTime = '';
  filterWithFriends = false;
  filterAvailablePlaces = true;

  @Input() events: any[] = [];
  @Output() filteredEventsChange = new EventEmitter<any[]>();

  // Renommée en applyFilters() pour plus de clarté
  applyFilters(): void {
    const filtered = this.events
      .filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Calcul du nombre max de places
        const maxPlaces = event.categories?.reduce((sum: number, cat: any) => {
          return sum + (cat?.places ?? 0);
        }, 0) ?? 0;

        // Calcul du nombre de participants
        const participantsCount = event.participants?.length ?? 0;

        return (
          (!this.searchQuery || event.title.toLowerCase().includes(this.searchQuery.toLowerCase())) &&
          (!this.startDate || eventStart >= new Date(this.startDate)) &&
          (!this.endDate || eventEnd <= new Date(this.endDate)) &&
          // Condition modifiée pour les amis (maintenant participants)
          (!this.filterWithFriends || participantsCount > 0) &&
          // Condition modifiée pour comparer le nombre de participants avec maxPlaces
          (!this.filterAvailablePlaces || participantsCount < maxPlaces)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.start).getTime();
        const dateB = new Date(b.start).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });

    this.filteredEventsChange.emit(filtered);
  }


  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(); // Appel de la méthode qui émet les résultats
  }
}

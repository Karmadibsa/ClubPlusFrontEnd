import {Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormsModule} from '@angular/forms'; // Nécessaire pour [(ngModel)]
import {LucideAngularModule} from 'lucide-angular';
import {CommonModule} from '@angular/common'; // Peut être utile pour des pipes ou directives
import {Evenement} from '../../../model/evenement';
import {AuthService} from '../../../service/security/auth.service'; // Assurez-vous que le chemin est correct

@Component({
  selector: 'app-filter-event',
  standalone: true, // Confirmer que c'est bien standalone
  imports: [
    FormsModule,          // Pour [(ngModel)]
    LucideAngularModule,  // Pour les icônes
    CommonModule          // Pour d'éventuels pipes/directives internes
  ],
  templateUrl: './filter-event.component.html',
  styleUrls: ['./filter-event.component.scss']
})
export class FilterEventComponent implements OnChanges { // Implémenter OnChanges
  auth = inject(AuthService)

  // --- Inputs & Outputs ---
  @Input() events: Evenement[] = []; // Reçoit la liste complète depuis le parent
  @Output() filteredEventsChange = new EventEmitter<Evenement[]>(); // Émet la liste filtrée/triée

  // --- État interne pour les filtres et le tri ---
  searchQuery = '';
  startDateLocal: string | null = null;
  endDateLocal: string | null = null;
  filterAvailablePlaces = false; // Ou true si c'est le défaut souhaité
  filterWithFriends = false;     // Ce filtre est complexe côté client, voir note
  sortDirection: 'asc' | 'desc' = 'asc'; // Direction de tri par défaut

  /**
   * Réagit aux changements de la liste d'événements fournie par le parent.
   * Utile si la liste originale est rechargée dans le parent.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      // Quand la liste source change, on réapplique les filtres courants
      this.applyFilters();
    }
  }

  /**
   * Fonction principale qui filtre et trie la liste 'events'
   * en fonction de l'état actuel des contrôles de filtre.
   * Émet le résultat via 'filteredEventsChange'.
   */
  applyFilters(): void {

    // 1. Conversion des dates/heures locales en objets Date pour la comparaison
    // new Date() interprète correctement le format "YYYY-MM-DDTHH:MM"
    let startFilterDate: Date | null = null;
    if (this.startDateLocal) {
      // La chaîne de type="date" est YYYY-MM-DD. new Date() l'interprète comme heure locale 00:00:00.
      const tempDate = new Date(this.startDateLocal);
      // Assurer que c'est bien le début de la journée (fuseau horaire local)
      startFilterDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 0, 0, 0, 0);
    }

    let endFilterDate: Date | null = null;
    if (this.endDateLocal) {
      const tempDate = new Date(this.endDateLocal);
      // Pour inclure toute la journée de fin, mettre l'heure à la fin de cette journée.
      endFilterDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 23, 59, 59, 999);
    }

    // 2. Filtrage de la liste source 'this.events'
    let filtered = this.events.filter(event => {
      // Conversion des dates de l'événement en objets Date
      // Important : S'assurer que event.start/end sont bien des chaînes ISO valides
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Condition Texte
      const searchMatch = !this.searchQuery ||
        event.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

      // Condition Date/Heure de Début
      const startMatch = !startFilterDate || eventStart >= startFilterDate;

      // Condition Date/Heure de Fin
      const endMatch = !endFilterDate || eventEnd <= endFilterDate;

      // Condition Places Disponibles
      let availableMatch = true; // Vrai par défaut (si filtre inactif)
      if (this.filterAvailablePlaces) {
        // Utilise les champs pré-calculés de l'API si possible (plus fiable)
        if (event.placeTotal !== undefined && event.placeReserve !== undefined) {
          availableMatch = event.placeReserve < event.placeTotal;
        } else {
          // Sinon, fallback sur le calcul via catégories (moins fiable si placeReserve manque)
          const maxPlaces = event.categories?.reduce((sum, cat) => sum + (cat.placeDisponible ?? 0), 0) ?? 0;
          const participants = event.placeReserve ?? 0; // On suppose que placeReserve est le nb de participants
          availableMatch = participants < maxPlaces;
          if (maxPlaces === 0) availableMatch = false; // S'il n'y a jamais eu de place
        }
      }

      // Condition "Avec Amis" (simplification côté client)
      // NOTE: Un vrai filtre "avec mes amis participant" nécessite des infos complexes,
      // souvent mieux géré côté serveur. Ici, on filtre juste si l'événement a des réservations.
      const friendsMatch = !this.filterWithFriends ||
        (Array.isArray(event.amiParticipants) && event.amiParticipants.length > 0);

      // Retourne vrai seulement si TOUTES les conditions actives sont remplies
      return searchMatch && startMatch && endMatch && availableMatch && friendsMatch;
    });

    // 3. Tri de la liste filtrée
    filtered.sort((a, b) => {
      const dateA = new Date(a.start).getTime();
      const dateB = new Date(b.start).getTime();
      return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // 4. Émission du résultat vers le parent (EventAdminComponent)
    this.filteredEventsChange.emit(filtered);
  }

  /**
   * Inverse la direction du tri et réapplique les filtres/tri.
   */
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(); // Réappliquer pour trier et émettre
  }

  /**
   * Optionnel: Réinitialise tous les champs de filtre à leur état par défaut
   * et réapplique les filtres pour afficher la liste initiale triée.
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.startDateLocal = null;
    this.endDateLocal = null;
    this.filterAvailablePlaces = false;
    this.filterWithFriends = false;
    this.sortDirection = 'asc';
    this.applyFilters(); // Appliquer le reset
  }
}

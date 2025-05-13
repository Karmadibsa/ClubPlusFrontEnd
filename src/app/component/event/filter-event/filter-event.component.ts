import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { Evenement } from '../../../model/evenement';
import { AuthService } from '../../../service/security/auth.service'; // Assurez-vous que le chemin est correct.

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-filter-event',  // Sélecteur CSS pour utiliser ce composant.
  // Exemple: <app-filter-event [events]="tousMesEvenements" (filteredEventsChange)="onFiltreChange($event)"></app-filter-event>
  standalone: true,             // Indique que c'est un composant autonome.
  imports: [
    FormsModule,                // Requis pour la liaison de données bidirectionnelle [(ngModel)].
    LucideAngularModule,        // Pour les icônes.
    CommonModule                // Pour des pipes (ex: | date) ou directives (*ngIf) si utilisées dans le template.
  ],
  templateUrl: './filter-event.component.html', // Template HTML contenant les champs de filtre.
  styleUrls: ['./filter-event.component.scss']  // Styles SCSS spécifiques.
})
// Implémente OnChanges pour réagir aux changements de l'Input 'events'.
export class FilterEventComponent implements OnChanges {
  // Injection d'AuthService (bien qu'il ne soit pas utilisé dans la logique de filtrage actuelle,
  // il pourrait être utilisé pour des filtres basés sur l'utilisateur, ex: "mes événements").
  auth = inject(AuthService);

  // --- INPUTS & OUTPUTS ---

  /**
   * @Input() events: Evenement[]
   * @description La liste complète des événements à filtrer/trier.
   *              Cette liste est fournie par le composant parent.
   *              Initialisée à un tableau vide pour éviter les erreurs si non fournie immédiatement.
   */
  @Input() events: Evenement[] = [];

  /**
   * @Output() filteredEventsChange
   * @description Événement émis vers le composant parent chaque fois que les filtres ou le tri
   *              sont appliqués. La valeur émise est le nouveau tableau `Evenement[]` filtré et trié.
   *              Le nom `filteredEventsChange` est une convention Angular qui peut permettre
   *              une liaison bidirectionnelle `[(filteredEvents)]` si le parent le souhaite,
   *              bien que ce ne soit pas l'usage le plus courant pour un tableau.
   */
  @Output() filteredEventsChange = new EventEmitter<Evenement[]>();

  // --- ÉTAT INTERNE POUR LES FILTRES ET LE TRI ---
  // Ces propriétés seront liées aux champs du formulaire dans le template HTML via [(ngModel)].

  /**
   * @property searchQuery
   * @description Terme de recherche textuel saisi par l'utilisateur.
   */
  searchQuery = '';

  /**
   * @property startDateLocal
   * @description Date de début pour le filtre de période (format "YYYY-MM-DD" venant d'un input type="date").
   *              `null` si aucune date de début n'est sélectionnée.
   */
  startDateLocal: string | null = null;

  /**
   * @property endDateLocal
   * @description Date de fin pour le filtre de période (format "YYYY-MM-DD").
   *              `null` si aucune date de fin n'est sélectionnée.
   */
  endDateLocal: string | null = null;

  /**
   * @property filterAvailablePlaces
   * @description Booléen indiquant si l'on doit filtrer pour n'afficher que les événements
   *              ayant des places disponibles.
   */
  filterAvailablePlaces = false; // Ou `true` si c'est le défaut souhaité.

  /**
   * @property filterWithFriends
   * @description Booléen indiquant si l'on doit filtrer pour n'afficher que les événements
   *              où des amis de l'utilisateur participent.
   *              Comme noté, ce filtre est complexe à implémenter purement côté client sans
   *              des données d'amitié complètes. La version actuelle est une simplification.
   */
  filterWithFriends = false;

  /**
   * @property sortDirection
   * @description Direction du tri des événements (par date de début).
   *              Peut être 'asc' (ascendant) ou 'desc' (descendant).
   */
  sortDirection: 'asc' | 'desc' = 'asc'; // Tri ascendant par défaut.

  /**
   * @method ngOnChanges
   * @description Crochet de cycle de vie Angular appelé lorsque les valeurs des propriétés @Input changent.
   *              Ici, il est utilisé pour réappliquer les filtres si la liste source `events`
   *              est modifiée par le composant parent (ex: rechargement des données depuis l'API).
   * @param changes Un objet `SimpleChanges` contenant les modifications des @Input.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Vérifie si c'est la propriété 'events' qui a changé.
    if (changes['events']) {
      // Si la liste source des événements a changé, il est logique de réappliquer
      // les filtres et le tri actuels pour mettre à jour la liste affichée.
      console.log('FilterEventComponent: La liste @Input events a changé, réapplication des filtres.');
      this.applyFilters();
    }
  }

  /**
   * @method applyFilters
   * @description Fonction principale qui exécute la logique de filtrage et de tri.
   *              Elle prend la liste `this.events` (l'originale), applique tous les filtres actifs,
   *              trie le résultat, puis émet la liste résultante via `filteredEventsChange`.
   *              Cette méthode est typiquement appelée lorsque l'utilisateur modifie une valeur
   *              de filtre dans le template (ex: via un `(ngModelChange)` ou un `(click)`).
   */
  applyFilters(): void {
    console.log('FilterEventComponent: Application des filtres avec les valeurs suivantes:', {
      searchQuery: this.searchQuery,
      startDateLocal: this.startDateLocal,
      endDateLocal: this.endDateLocal,
      filterAvailablePlaces: this.filterAvailablePlaces,
      filterWithFriends: this.filterWithFriends,
      sortDirection: this.sortDirection
    });

    // 1. Conversion des dates de filtre (chaînes "YYYY-MM-DD") en objets Date pour la comparaison.
    //    `new Date(dateString)` interprète "YYYY-MM-DD" comme le début de cette journée (00:00:00)
    //    dans le fuseau horaire local de l'utilisateur.
    let startFilterDate: Date | null = null;
    if (this.startDateLocal) {
      const tempStartDate = new Date(this.startDateLocal);
      // Assure que le filtre commence bien au tout début de la journée sélectionnée.
      startFilterDate = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate(), 0, 0, 0, 0);
    }

    let endFilterDate: Date | null = null;
    if (this.endDateLocal) {
      const tempEndDate = new Date(this.endDateLocal);
      // Assure que le filtre se termine bien à la toute fin de la journée sélectionnée
      // pour inclure tous les événements de ce jour-là.
      endFilterDate = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate(), 23, 59, 59, 999);
    }

    // 2. Filtrage de la liste source `this.events` en utilisant la méthode `filter` des tableaux.
    let filtered = this.events.filter(event => {
      // Conversion des dates de l'événement (qui sont des chaînes ISO) en objets Date pour la comparaison.
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Condition de correspondance pour la recherche textuelle (insensible à la casse).
      const searchMatch = !this.searchQuery || // Si pas de recherche, tous correspondent.
        event.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

      // Condition de correspondance pour la date de début du filtre.
      // Si pas de date de début de filtre, tous correspondent. Sinon, la date de l'événement doit être >=.
      const startMatch = !startFilterDate || eventStart >= startFilterDate;

      // Condition de correspondance pour la date de fin du filtre.
      // Si pas de date de fin de filtre, tous correspondent. Sinon, la date de l'événement doit être <=.
      const endMatch = !endFilterDate || eventEnd <= endFilterDate;

      // Condition de correspondance pour les places disponibles.
      let availableMatch = true; // Vrai par défaut (si le filtre n'est pas actif).
      if (this.filterAvailablePlaces) {
        // Préférer les champs `placeTotal` et `placeReserve` de l'événement s'ils existent
        // (car ils sont probablement calculés de manière plus fiable par le backend).
        if (event.placeTotal !== undefined && event.placeReserve !== undefined) {
          availableMatch = (event.placeReserve || 0) < event.placeTotal;
        } else {
          // Fallback : Calculer à partir des catégories (peut être moins précis si les données sont incomplètes).
          // Note : `placeDisponible` sur une catégorie est `capacite - placeReserveDeLaCategorie`.
          // Il serait plus simple de sommer `cat.capacite` pour `placeTotal` de l'événement
          // et d'utiliser `event.placeReserve` (nombre total de réservations pour l'événement).
          // La logique actuelle pour `maxPlaces` utilisant `placeDisponible` est un peu confuse.
          // Supposons pour l'instant que le but est de vérifier `event.placeReserve < totalCapaciteDesCategories`.
          const totalCapacityFromCategories = event.categories?.reduce((sum, cat) => sum + (cat.capacite ?? 0), 0) ?? 0;
          availableMatch = (event.placeReserve || 0) < totalCapacityFromCategories;
          if (totalCapacityFromCategories === 0) availableMatch = false; // S'il n'y a pas de capacité, il n'y a pas de places disponibles.
        }
      }

      // Condition de correspondance pour "Avec Amis".
      // C'est une simplification. Un vrai filtre "avec amis" nécessiterait de connaître
      // les amis de l'utilisateur et les participants de chaque événement.
      // Ici, on vérifie juste si l'événement a une propriété `amiParticipants` non vide.
      const friendsMatch = !this.filterWithFriends ||
        (Array.isArray(event.amiParticipants) && event.amiParticipants.length > 0);

      // L'événement est conservé dans la liste filtrée seulement si TOUTES les conditions actives sont remplies.
      return searchMatch && startMatch && endMatch && availableMatch && friendsMatch;
    });

    // 3. Tri de la liste filtrée en utilisant la méthode `sort` des tableaux.
    filtered.sort((a, b) => {
      const dateA = new Date(a.start).getTime(); // Convertit en timestamp pour une comparaison numérique facile.
      const dateB = new Date(b.start).getTime();
      // Applique la direction de tri.
      return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // 4. Émission du résultat (liste filtrée et triée) vers le composant parent.
    this.filteredEventsChange.emit(filtered);
    console.log('FilterEventComponent: Liste filtrée et triée émise:', filtered);
  }

  /**
   * @method toggleSortDirection
   * @description Inverse la direction de tri actuelle (`asc` <-> `desc`)
   *              et réapplique immédiatement les filtres et le tri.
   */
  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters(); // Réappliquer pour trier avec la nouvelle direction et émettre.
  }

}

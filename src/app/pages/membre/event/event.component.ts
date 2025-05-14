// ----- IMPORTATIONS -----
import {
  ChangeDetectorRef, // Outil pour contrôler manuellement la détection de changements.
  Component,
  inject,           // Fonction moderne pour l'injection de dépendances.
  OnInit,
  OnDestroy         // Ajout de OnDestroy pour la gestion des abonnements.
  // ChangeDetectionStrategy // À importer si vous l'ajoutez au décorateur.
} from '@angular/core';
import { FormsModule } from "@angular/forms"; // Pour [(ngModel)] si utilisé dans le template de ce composant (ou enfants).
import { HttpErrorResponse } from '@angular/common/http'; // Pour typer les erreurs API.
import { Subscription } from 'rxjs';             // Pour gérer la désinscription des Observables.

// Composants Enfants/Associés
import { EventCardComponent } from "../../../component/event/eventcard/eventcard.component"; // Affiche une carte d'événement.
import { FilterEventComponent } from '../../../component/event/filter-event/filter-event.component'; // Pour les filtres et le tri.
import { PaginationComponent } from '../../../component/navigation/pagination/pagination.component'; // Pour la pagination.

// Modèles (Interfaces de données)
import { Evenement } from '../../../model/evenement'; // Interface décrivant un événement.

// Services
import { EventService } from '../../../service/crud/event.service'; // Service pour les opérations sur les événements.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Autres (Icônes)
import { LucideAngularModule } from "lucide-angular"; // Pour les icônes.
// import { CommonModule } from '@angular/common'; // Nécessaire si @if, @for sont utilisés.

/**
 * @Component EventComponent
 * @description
 * Page principale permettant aux utilisateurs (membres) de visualiser la liste des événements disponibles.
 * Affiche les événements sous forme de cartes, permet le filtrage, le tri, et la pagination des événements.
 * Interagit avec des composants enfants pour la filtration (`FilterEventComponent`), l'affichage
 * des cartes (`EventCardComponent`), et la pagination (`PaginationComponent`).
 *
 * @example
 * <app-event></app-event> <!-- Typiquement utilisé comme composant de route, ex: '/app/event' -->
 */
@Component({
  selector: 'app-event',         // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,             // Indique que c'est un composant autonome.
  imports: [                    // Dépendances nécessaires pour le template.
    FormsModule,                // Pour [(ngModel)] si utilisé par les filtres ou autres.
    EventCardComponent,         // Pour afficher chaque événement.
    LucideAngularModule,        // Pour les icônes.
    FilterEventComponent,       // Pour les contrôles de filtre et de tri.
    PaginationComponent,        // Pour la navigation entre les pages d'événements.
    // CommonModule,            // À ajouter si @if, @for, ou pipes de CommonModule sont utilisés.
  ],
  templateUrl: './event.component.html', // Chemin vers le fichier HTML du composant.
  styleUrls: ['./event.component.scss']  // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisager pour des optimisations de performance.
})
export class EventComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy.

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service pour effectuer les opérations CRUD liées aux événements.
   */
  private eventService = inject(EventService);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) à l'utilisateur.
   */
  private notification = inject(SweetAlertService);
  /**
   * @private
   * @description Service Angular pour contrôler manuellement la détection de changements.
   * Crucial si `ChangeDetectionStrategy.OnPush` est utilisé.
   */
  private cdr = inject(ChangeDetectorRef);

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Evenement[]} allEvents
   * @description Tableau stockant TOUS les événements récupérés de l'API.
   * Sert de source de vérité pour les opérations de filtrage et de tri.
   * @default []
   */
  allEvents: Evenement[] = [];
  /**
   * @property {Evenement[]} filteredEvents
   * @description Tableau stockant les événements après application des filtres (texte, date, etc.) et du tri.
   * C'est cette liste qui est utilisée pour la pagination.
   * @default []
   */
  filteredEvents: Evenement[] = [];
  /**
   * @property {Evenement[]} paginatedEvents
   * @description Tableau stockant la tranche d'événements (un sous-ensemble de `filteredEvents`)
   * à afficher pour la page de pagination actuelle. Ces événements sont passés aux `EventCardComponent`.
   * @default []
   */
  paginatedEvents: Evenement[] = [];

  // Propriétés pour la pagination
  /**
   * @property {number} currentPage
   * @description Le numéro de la page actuellement affichée dans la pagination.
   * @default 1
   */
  currentPage: number = 1;
  /**
   * @property {number} itemsPerPage
   * @description Le nombre d'événements (cartes) à afficher par page.
   * Ajuster en fonction de la mise en page souhaitée (ex: 8 ou 9 pour une grille 3xN).
   * @default 8
   */
  itemsPerPage: number = 8;

  // Autres états
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si le chargement initial des données des événements est en cours.
   * @default false
   */
  isLoading = false;
  /**
   * @private
   * @property {Subscription | null} eventsSubscription
   * @description Référence à l'abonnement pour le chargement des événements.
   * Permet de se désabonner proprement dans `ngOnDestroy`.
   * @default null
   */
  private eventsSubscription: Subscription | null = null;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Déclenche le chargement initial de la liste des événements.
   * @see {@link loadEvents}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("EventComponent (page membre): Initialisation.");
    this.loadEvents();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de `eventsSubscription` pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("EventComponent (page membre): Destruction, désinscription de eventsSubscription.");
    this.eventsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadEvents
   * @description Charge la liste complète des événements depuis `EventService`
   * (en utilisant `getAllEventsWithFriend()` qui inclut potentiellement des informations sur la participation d'amis).
   * Réinitialise les listes d'événements et la pagination.
   * Gère l'état `isLoading` et déclenche la détection de changements.
   * @returns {void}
   */
  loadEvents(): void {
    this.isLoading = true;
    // Réinitialise les listes et la pagination avant de charger.
    this.allEvents = [];
    this.filteredEvents = [];
    this.paginatedEvents = [];
    this.currentPage = 1;
    this.cdr.detectChanges(); // Met à jour l'UI pour montrer l'état de chargement.

    console.log("EventComponent (page membre): Début du chargement des événements (avec infos amis).");
    this.eventsSubscription = this.eventService.getAllEventsWithFriend().subscribe({
      next: (listeevents: Evenement[]) => {
        // *** Logique de mise à jour de l'UI après chargement ***
        this.isLoading = false;       // Met isLoading à false d'abord.
        this.cdr.detectChanges();     // Force la détection pour que l'UI (ex: spinner) disparaisse.
                                      // Ceci est fait avant d'assigner de grandes listes pour
                                      // améliorer la réactivité perçue de l'UI.

        this.allEvents = listeevents; // Stocke la liste source complète.
        // Initialement, la liste filtrée est une copie de la liste complète.
        this.filteredEvents = [...this.allEvents];
        this.updatePaginatedEvents(); // Calcule et affiche la première page.
                                      // `updatePaginatedEvents` appelle aussi `detectChanges`.
        console.log(`EventComponent (page membre): ${this.allEvents.length} événements chargés.`);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.allEvents = []; // Assure des listes vides en cas d'erreur.
        this.filteredEvents = [];
        this.paginatedEvents = [];
        console.error('EventComponent (page membre): Erreur lors du chargement des événements:', err);
        this.notification.show(err.message || "Une erreur est survenue lors du chargement des événements.", "error");
        this.cdr.detectChanges(); // Met à jour l'UI pour l'état d'erreur.
      }
    });
  }

  // --- GESTION DES FILTRES ---
  /**
   * @method handleFilteredEventsChange
   * @description Gère l'événement `filteredEventsChange` émis par `FilterEventComponent`.
   * Met à jour `filteredEvents`, réinitialise à la première page, et met à jour la vue paginée.
   * @param {Evenement[]} filteredList - La nouvelle liste d'événements filtrée et triée.
   * @returns {void}
   */
  handleFilteredEventsChange(filteredList: Evenement[]): void {
    console.log(`EventComponent (page membre): Liste filtrée/triée reçue (${filteredList.length} éléments).`);
    this.filteredEvents = filteredList;
    this.currentPage = 1; // Important: réinitialiser à la page 1 après un filtre/tri.
    this.updatePaginatedEvents();
  }

  // --- GESTION DE LA PAGINATION ---
  /**
   * @method updatePaginatedEvents
   * @description Calcule la tranche d'événements à afficher (`paginatedEvents`)
   * basée sur `filteredEvents`, `currentPage`, et `itemsPerPage`.
   * Déclenche une détection de changements.
   * @returns {void}
   */
  updatePaginatedEvents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEvents = this.filteredEvents.slice(startIndex, endIndex);
    console.log(`EventComponent (page membre): Affichage de la page ${this.currentPage}. Indices de ${startIndex} à ${Math.min(endIndex, this.filteredEvents.length) -1}. (${this.paginatedEvents.length} cartes affichées)`);
    this.cdr.detectChanges(); // Met à jour l'affichage avec la nouvelle tranche d'événements.
  }

  /**
   * @method onPageChange
   * @description Gère l'événement `pageChange` émis par `PaginationComponent`.
   * Met à jour `currentPage` et recalcule la vue paginée.
   * @param {number} newPage - Le nouveau numéro de page.
   * @returns {void}
   */
  onPageChange(newPage: number): void {
    const totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);
    if (newPage >= 1 && newPage !== this.currentPage && newPage <= totalPages) {
      console.log(`EventComponent (page membre): Changement de page vers ${newPage}.`);
      this.currentPage = newPage;
      this.updatePaginatedEvents();
    } else if (newPage > totalPages && totalPages > 0 && this.currentPage !== totalPages) {
      console.log(`EventComponent (page membre): Page ${newPage} invalide (max ${totalPages}). Redirection vers la dernière page.`);
      this.currentPage = totalPages;
      this.updatePaginatedEvents();
    }
  }
}

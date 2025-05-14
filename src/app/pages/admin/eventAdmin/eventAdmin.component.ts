 // ----- IMPORTATIONS -----
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

// Composants
import { EventRowComponent } from '../../../component/event/event-row/event-row.component';
import { CreateEventButtonComponent } from '../../../component/event/create-event-button/create-event-button.component';
import { FilterEventComponent } from '../../../component/event/filter-event/filter-event.component';
import { PaginationComponent } from '../../../component/navigation/pagination/pagination.component';

// Modèles
import { Evenement } from '../../../model/evenement';

// Autres
import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component EventAdminComponent
 * @description
 * Page principale pour l'administration et la gestion des événements.
 * Ce composant permet de visualiser la liste des événements, de les filtrer,
 * de les trier, de les paginer, de créer de nouveaux événements, de modifier
 * des événements existants (via des modales gérées par les composants enfants)
 * et de désactiver des événements.
 *
 * Il utilise la stratégie de détection de changements `OnPush` pour des raisons de performance.
 *
 * @example
 * <app-event-admin></app-event-admin>
 */
@Component({
  selector: 'app-event-admin',
  standalone: true,
  imports: [
    CommonModule,
    EventRowComponent,
    LucideAngularModule,
    CreateEventButtonComponent,
    FilterEventComponent,
    PaginationComponent,
  ],
  templateUrl: './eventAdmin.component.html',
  styleUrls: ['./eventAdmin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventAdminComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  /**
   * @private
   * @description Service pour effectuer les opérations CRUD sur les événements.
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
   * Nécessaire avec la stratégie `ChangeDetectionStrategy.OnPush`.
   */
  private cdr = inject(ChangeDetectorRef);

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Evenement[]} allEvenements
   * @description Tableau stockant tous les événements récupérés de l'API.
   * Sert de source de vérité pour les opérations de filtrage et de tri.
   * @default []
   */
  allEvenements: Evenement[] = [];
  /**
   * @property {Evenement[]} filteredEvenements
   * @description Tableau stockant les événements après application des filtres
   * (texte, date, etc.) et du tri, basé sur `allEvenements`.
   * C'est cette liste qui est utilisée pour la pagination.
   * @default []
   */
  filteredEvenements: Evenement[] = [];
  /**
   * @property {Evenement[]} paginatedEvenements
   * @description Tableau stockant la tranche d'événements (un sous-ensemble de `filteredEvenements`)
   * à afficher pour la page de pagination actuelle.
   * @default []
   */
  paginatedEvenements: Evenement[] = [];

  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si un chargement de données (appel API principal) est en cours.
   * Utilisé pour afficher un indicateur de chargement dans l'interface utilisateur.
   * @default false
   */
  isLoading = false;

  /**
   * @private
   * @property {Subscription | null} eventsSubscription
   * @description Référence à l'abonnement principal pour le chargement des événements.
   * Permet de se désabonner proprement dans `ngOnDestroy` pour éviter les fuites de mémoire.
   * @default null
   */
  private eventsSubscription: Subscription | null = null;

  // Propriétés pour la pagination
  /**
   * @property {number} currentPage
   * @description Le numéro de la page actuellement affichée dans la pagination.
   * Commence à 1.
   * @default 1
   */
  currentPage: number = 1;
  /**
   * @property {number} itemsPerPage
   * @description Le nombre d'éléments (événements) à afficher par page de pagination.
   * @default 10
   */
  itemsPerPage: number = 10;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular.
   * Appelé une fois après l'initialisation du composant.
   * Déclenche le chargement initial de la liste des événements.
   * @see {@link chargerEvenements}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("EventAdminComponent: Initialisation et chargement des événements.");
    this.chargerEvenements();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular.
   * Appelé juste avant que le composant ne soit détruit.
   * Se désabonne de `eventsSubscription` pour prévenir les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("EventAdminComponent: Destruction, désinscription de eventsSubscription.");
    this.eventsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method chargerEvenements
   * @description Charge la liste complète des événements depuis `EventService`.
   * Réinitialise les listes d'événements (`allEvenements`, `filteredEvenements`, `paginatedEvenements`)
   * et l'état de la pagination à leurs valeurs initiales avant de charger les nouvelles données.
   * Met à jour l'état `isLoading` pendant l'opération.
   * @returns {void}
   */
  chargerEvenements(): void {
    this.isLoading = true;
    this.allEvenements = [];
    this.filteredEvenements = [];
    this.paginatedEvenements = [];
    if (this.currentPage !== 1) this.currentPage = 1; // Réinitialise la page si ce n'est pas la première.
    this.cdr.detectChanges(); // Met à jour l'UI pour l'état de chargement.

    console.log("EventAdminComponent: Début du chargement des événements depuis le service.");
    this.eventsSubscription = this.eventService.getAllEvents().subscribe({
      next: (data: Evenement[]) => {
        this.allEvenements = data;
        this.filteredEvenements = [...this.allEvenements]; // Initialise la liste filtrée.
        this.updatePaginatedEvents(); // Calcule et affiche la première page.
        this.isLoading = false;
        console.log(`EventAdminComponent: ${this.allEvenements.length} événements chargés avec succès.`);
        this.cdr.detectChanges(); // Met à jour l'UI avec les données.
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('EventAdminComponent: Erreur lors du chargement des événements:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors du chargement des événements.', 'error');
        this.cdr.detectChanges(); // Met à jour l'UI pour l'état d'erreur.
      }
    });
  }

  // --- GESTION DES FILTRES ---
  /**
   * @method handleFilteredEventsChange
   * @description Gère l'événement `filteredEventsChange` émis par le composant enfant `FilterEventComponent`.
   * Met à jour la propriété `filteredEvenements` avec la liste filtrée et triée reçue.
   * Réinitialise la pagination à la première page et met à jour la vue paginée.
   * @param {Evenement[]} filteredList - La nouvelle liste d'événements après application des filtres et du tri.
   * @returns {void}
   */
  handleFilteredEventsChange(filteredList: Evenement[]): void {
    console.log(`EventAdminComponent: Liste filtrée/triée reçue (${filteredList.length} éléments).`);
    this.filteredEvenements = filteredList;
    this.currentPage = 1; // Important: réinitialiser à la page 1 après un filtre.
    this.updatePaginatedEvents();
  }

  // --- GESTION DE LA PAGINATION ---
  /**
   * @method updatePaginatedEvents
   * @description Calcule la tranche d'événements à afficher (`paginatedEvenements`)
   * basée sur la liste `filteredEvenements`, la page actuelle (`currentPage`),
   * et le nombre d'éléments par page (`itemsPerPage`).
   * Déclenche une détection de changements pour mettre à jour la vue.
   * @returns {void}
   */
  updatePaginatedEvents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEvenements = this.filteredEvenements.slice(startIndex, endIndex);
    console.log(`EventAdminComponent: Affichage de la page ${this.currentPage}. Indices de ${startIndex} à ${Math.min(endIndex, this.filteredEvenements.length) -1}. (${this.paginatedEvenements.length} éléments affichés)`);
    this.cdr.detectChanges();
  }

  /**
   * @method onPageChange
   * @description Gère l'événement `pageChange` émis par le composant enfant `PaginationComponent`.
   * Met à jour la propriété `currentPage` et recalcule la tranche d'événements à afficher.
   * @param {number} newPage - Le nouveau numéro de page sélectionné par l'utilisateur.
   * @returns {void}
   */
  onPageChange(newPage: number): void {
    // Calcule le nombre total de pages basé sur la liste filtrée.
    const totalPages = Math.ceil(this.filteredEvenements.length / this.itemsPerPage);
    // Vérifie si la nouvelle page est valide et différente de la page actuelle.
    if (newPage >= 1 && newPage !== this.currentPage && newPage <= totalPages) {
      console.log(`EventAdminComponent: Changement de page demandé vers la page ${newPage}.`);
      this.currentPage = newPage;
      this.updatePaginatedEvents();
    } else if (newPage > totalPages && totalPages > 0 && this.currentPage !== totalPages) {
      // Si la nouvelle page demandée est au-delà du nombre total de pages existantes
      // (ex: après un filtre réduisant le nombre total d'items), on va à la dernière page disponible.
      console.log(`EventAdminComponent: Page ${newPage} invalide (max ${totalPages}). Redirection vers la dernière page.`);
      this.currentPage = totalPages;
      this.updatePaginatedEvents();
    }
  }

  // --- GESTION DES ACTIONS SUR LES ÉVÉNEMENTS ---
  /**
   * @method handleDeleteEventRequest
   * @description Gère l'événement `deleteRequest` émis par un composant enfant `EventRowComponent`.
   * Appelle `EventService` pour effectuer une désactivation logique (soft delete) de l'événement.
   * Met à jour localement les listes d'événements après succès pour un retour visuel immédiat.
   * @param {Evenement} eventToDelete - L'objet `Evenement` à désactiver.
   * @returns {void}
   */
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    console.log(`EventAdminComponent: Demande de désactivation pour l'événement ID ${eventToDelete.id} ("${eventToDelete.nom}").`);
    // La confirmation utilisateur (ex: via SweetAlert) est généralement gérée dans le composant
    // qui initie l'action (EventRowComponent) ou juste avant l'appel API ici.
    // Si EventRowComponent ne le fait pas, il faudrait ajouter une confirmation ici.
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé avec succès.`, 'success');
        // Met à jour les listes locales pour refléter le changement sans recharger toute la page.
        this.allEvenements = this.allEvenements.filter(e => e.id !== eventToDelete.id);
        this.filteredEvenements = this.filteredEvenements.filter(e => e.id !== eventToDelete.id);
        // Vérifier si la page actuelle devient vide après suppression
        if (this.paginatedEvenements.length === 1 && this.currentPage > 1 && this.filteredEvenements.length % this.itemsPerPage === 0) {
          this.currentPage--; // Reculer d'une page si la page actuelle est devenue vide
        }
        this.updatePaginatedEvents(); // Met à jour la vue paginée.
      },
      error: (err: HttpErrorResponse) => {
        console.error(`EventAdminComponent: Erreur lors de la désactivation de l'événement ID ${eventToDelete.id}:`, err);
        this.notification.show(err.message || 'Une erreur est survenue lors de la désactivation de l\'événement.', 'error');
      }
    });
  }

  /**
   * @method handleEventCreatedOrUpdated
   * @description Gère les événements de création ou de mise à jour d'un événement.
   * Émis par `CreateEventButtonComponent` (après la création réussie d'un nouvel événement via sa modale)
   * ou par `EventRowComponent` (après la modification réussie d'un événement via sa modale d'édition).
   * Recharge la liste complète des événements pour assurer la cohérence des données affichées.
   * @param {Evenement} event - L'événement qui a été créé ou mis à jour.
   * @returns {void}
   */
  handleEventCreatedOrUpdated(event: Evenement): void {
    // Détermine si c'était une création ou une mise à jour pour le message.
    const action = this.allEvenements.some(e => e.id === event.id) ? 'mis à jour' : 'créé';
    console.log(`EventAdminComponent: Événement ${action} ("${event.nom}"). Rechargement de la liste.`);
    this.notification.show(`L'événement "${event.nom}" a été ${action} avec succès. La liste est mise à jour.`, 'info');
    this.chargerEvenements(); // Recharge TOUTE la liste des événements.
  }
}

import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { EventCardComponent } from "../../../component/event/eventcard/eventcard.component";
import { FilterEventComponent } from '../../../component/event/filter-event/filter-event.component';
import { PaginationComponent } from '../../../component/navigation/pagination/pagination.component';

import { Evenement } from '../../../model/evenement';

import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { LucideAngularModule } from "lucide-angular";

/**
 * @Component EventComponent
 * @description Page de visualisation des événements disponibles pour les membres.
 * Affiche les événements sous forme de cartes, permet le filtrage, le tri et la pagination.
 */
@Component({
  selector: 'app-event',
  standalone: true,
  imports: [
    FormsModule,
    EventCardComponent,
    LucideAngularModule,
    FilterEventComponent,
    PaginationComponent,
    // CommonModule, // À ajouter si @if, @for, ou pipes de CommonModule sont utilisés.
  ],
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private eventService = inject(EventService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);

  // --- ÉTAT DU COMPOSANT ---
  /** Tous les événements récupérés de l'API. */
  allEvents: Evenement[] = [];
  /** Événements après application des filtres et du tri. */
  filteredEvents: Evenement[] = [];
  /** Tranche d'événements à afficher pour la page actuelle. */
  paginatedEvents: Evenement[] = [];

  /** Numéro de la page actuellement affichée. */
  currentPage: number = 1;
  /** Nombre d'événements à afficher par page. */
  itemsPerPage: number = 8;

  /** Indique si le chargement des événements est en cours. */
  isLoading = false;
  private eventsSubscription: Subscription | null = null; // Gère la désinscription de l'abonnement.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Lance le chargement initial des événements.
   */
  ngOnInit(): void {
    console.log("EventComponent (page membre): Initialisation.");
    this.loadEvents();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne `eventsSubscription`.
   */
  ngOnDestroy(): void {
    console.log("EventComponent (page membre): Destruction, désinscription de eventsSubscription.");
    this.eventsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadEvents
   * @description Charge la liste complète des événements depuis `EventService`.
   * Réinitialise les listes et la pagination.
   */
  loadEvents(): void {
    this.isLoading = true;
    this.allEvents = [];
    this.filteredEvents = [];
    this.paginatedEvents = [];
    this.currentPage = 1;
    this.cdr.detectChanges();

    console.log("EventComponent (page membre): Début du chargement des événements (avec infos amis).");
    this.eventsSubscription = this.eventService.getAllEventsWithFriend().subscribe({
      next: (listeevents: Evenement[]) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.allEvents = listeevents;
        this.filteredEvents = [...this.allEvents];
        this.updatePaginatedEvents();

        console.log(this.paginatedEvents);
        console.log(`EventComponent (page membre): ${this.allEvents.length} événements chargés.`);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.allEvents = [];
        this.filteredEvents = [];
        this.paginatedEvents = [];
        console.error('EventComponent (page membre): Erreur lors du chargement des événements:', err);
        this.notification.show(err.message || "Une erreur est survenue lors du chargement des événements.", "error");
        this.cdr.detectChanges();
      }
    });
  }

  // --- GESTION DES FILTRES ---
  /**
   * @method handleFilteredEventsChange
   * @description Gère la liste filtrée/triée reçue du `FilterEventComponent`.
   * @param filteredList La nouvelle liste d'événements filtrée et triée.
   */
  handleFilteredEventsChange(filteredList: Evenement[]): void {
    console.log(`EventComponent (page membre): Liste filtrée/triée reçue (${filteredList.length} éléments).`);
    this.filteredEvents = filteredList;
    this.currentPage = 1;
    this.updatePaginatedEvents();
  }

  // --- GESTION DE LA PAGINATION ---
  /**
   * @method updatePaginatedEvents
   * @description Calcule la tranche d'événements à afficher pour la page courante.
   */
  updatePaginatedEvents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEvents = this.filteredEvents.slice(startIndex, endIndex);
    console.log(`EventComponent (page membre): Affichage de la page ${this.currentPage}. Indices de ${startIndex} à ${Math.min(endIndex, this.filteredEvents.length) -1}. (${this.paginatedEvents.length} cartes affichées)`);
    this.cdr.detectChanges();
  }

  /**
   * @method onPageChange
   * @description Gère le changement de page demandé par le `PaginationComponent`.
   * @param newPage Le nouveau numéro de page.
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

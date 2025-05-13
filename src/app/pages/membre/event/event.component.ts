import {ChangeDetectorRef, Component, inject} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {EventCardComponent} from "../../../component/event/eventcard/eventcard.component";
import {LucideAngularModule} from "lucide-angular";
import {HttpErrorResponse} from '@angular/common/http';
import {Evenement} from '../../../model/evenement';
import {EventService} from '../../../service/model/event.service';
import {Subscription} from 'rxjs';
import {FilterEventComponent} from '../../../component/event/filter-event/filter-event.component';
import {PaginationComponent} from '../../../component/navigation/pagination/pagination.component';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  imports: [
    FormsModule,
    EventCardComponent,
    LucideAngularModule,
    FilterEventComponent,
    PaginationComponent,
  ],
  styleUrls: ['./event.component.scss']
})
export class EventComponent {
  // --- Injections ---
  private eventService = inject(EventService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);

  // --- États pour les listes d'événements ---
  allEvents: Evenement[] = [];       // Liste complète originale
  filteredEvents: Evenement[] = [];  // Liste après filtrage/tri
  paginatedEvents: Evenement[] = []; // Liste pour affichage (page actuelle)

  // --- États pour la Pagination ---
  currentPage: number = 1;
  itemsPerPage: number = 8; // Combien d'EventCards par page (ajustez si besoin, 9 est bien pour une grille 3x3)

  // --- Autres États ---
  isLoading = false;
  private eventsSubscription: Subscription | null = null;


  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
  }

  /**
   * Charge les événements, initialise les listes et la pagination.
   */
  loadEvents(): void {
    this.isLoading = true;
    // Réinitialiser toutes les listes et la pagination
    this.allEvents = [];
    this.filteredEvents = [];
    this.paginatedEvents = [];
    this.currentPage = 1;
    this.cdr.detectChanges();

    this.eventsSubscription = this.eventService.getAllEventsWithFriend().subscribe({
      next: (listeevents: Evenement[]) => {
        // *** 1. Mettre isLoading à false AVANT detectChanges ***
        this.isLoading = false;
        // *** 2. Forcer la détection pour ENLEVER l'état de chargement ***
        this.cdr.detectChanges();
        // **********************************************************

        this.allEvents = listeevents;
        // Pas besoin d'un autre detectChanges ici si le précédent a bien tourné

        this.filteredEvents = [...this.allEvents]; // Initialiser après que l'UI soit sortie du chargement
        this.updatePaginatedEvents(); // Calcule et affiche la première page (qui a son propre detectChanges)
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.allEvents = []; // Assurer listes vides en cas d'erreur
        this.filteredEvents = [];
        this.paginatedEvents = [];
        console.error('Erreur chargement événements membre:', err);
        this.notification.show(err.message || "Erreur lors du chargement des événements.", "error");
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Met à jour la liste filteredEvents et réinitialise la pagination.
   * Appelée par l'output (filteredEventsChange) de FilterEventComponent.
   * @param filteredList La liste des événements filtrée/triée.
   */
  handleFilteredEventsChange(filteredList: Evenement[]): void {
    this.filteredEvents = filteredList;
    this.currentPage = 1; // Revenir à la première page après un filtre/tri
    this.updatePaginatedEvents(); // Mettre à jour les cartes affichées
  }

  /**
   * Calcule et met à jour la liste paginatedEvents pour affichage.
   */
  updatePaginatedEvents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEvents = this.filteredEvents.slice(startIndex, endIndex);
    this.cdr.detectChanges(); // Mettre à jour l'affichage
  }

  /**
   * Gère le changement de page depuis le composant Pagination.
   * @param newPage Le nouveau numéro de page.
   */
  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.updatePaginatedEvents(); // Mettre à jour les cartes pour la nouvelle page
    }
  }
}



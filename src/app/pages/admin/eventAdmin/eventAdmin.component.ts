import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { EventRowComponent } from '../../../component/event/event-row/event-row.component';
import { CreateEventButtonComponent } from '../../../component/event/create-event-button/create-event-button.component';
import { FilterEventComponent } from '../../../component/event/filter-event/filter-event.component';
import { PaginationComponent } from '../../../component/navigation/pagination/pagination.component';

import { Evenement } from '../../../model/evenement';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component EventAdminComponent
 * @description Page principale pour la gestion des événements.
 * Permet de visualiser, filtrer, paginer, créer, modifier et désactiver des événements.
 * Utilise la stratégie de détection de changements `OnPush` pour des performances optimisées.
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
  private eventService = inject(EventService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);

  // --- ÉTAT DU COMPOSANT ---
  allEvenements: Evenement[] = [];
  filteredEvenements: Evenement[] = [];
  paginatedEvenements: Evenement[] = [];

  isLoading = false;

  private eventsSubscription: Subscription | null = null; // Gère la désinscription de l'abonnement.

  // Propriétés de pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation du composant. Lance le chargement initial des événements.
   */
  ngOnInit(): void {
    console.log("EventAdminComponent: Initialisation et chargement des événements.");
    this.chargerEvenements();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne `eventsSubscription`.
   */
  ngOnDestroy(): void {
    console.log("EventAdminComponent: Destruction, désinscription de eventsSubscription.");
    this.eventsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method chargerEvenements
   * @description Charge la liste complète des événements depuis `EventService`.
   * Réinitialise les listes et l'état de la pagination.
   */
  chargerEvenements(): void {
    this.isLoading = true;
    this.allEvenements = [];
    this.filteredEvenements = [];
    this.paginatedEvenements = [];
    if (this.currentPage !== 1) this.currentPage = 1;
    this.cdr.detectChanges(); // Met à jour l'UI avec l'état de chargement.

    console.log("EventAdminComponent: Début du chargement des événements depuis le service.");
    this.eventsSubscription = this.eventService.getAllEvents().subscribe({
      next: (data: Evenement[]) => {
        this.allEvenements = data;
        this.filteredEvenements = [...this.allEvenements];
        this.updatePaginatedEvents();
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
   * @description Gère la liste filtrée/triée reçue du `FilterEventComponent`.
   * @param filteredList La nouvelle liste d'événements filtrée et triée.
   */
  handleFilteredEventsChange(filteredList: Evenement[]): void {
    console.log(`EventAdminComponent: Liste filtrée/triée reçue (${filteredList.length} éléments).`);
    this.filteredEvenements = filteredList;
    this.currentPage = 1; // Réinitialise la pagination après un filtre.
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
    this.paginatedEvenements = this.filteredEvenements.slice(startIndex, endIndex);
    console.log(`EventAdminComponent: Affichage de la page ${this.currentPage}. Indices de ${startIndex} à ${Math.min(endIndex, this.filteredEvenements.length) -1}. (${this.paginatedEvenements.length} éléments affichés)`);
    this.cdr.detectChanges();
  }

  /**
   * @method onPageChange
   * @description Gère le changement de page demandé par le `PaginationComponent`.
   * @param newPage Le nouveau numéro de page.
   */
  onPageChange(newPage: number): void {
    const totalPages = Math.ceil(this.filteredEvenements.length / this.itemsPerPage);
    if (newPage >= 1 && newPage !== this.currentPage && newPage <= totalPages) {
      console.log(`EventAdminComponent: Changement de page demandé vers la page ${newPage}.`);
      this.currentPage = newPage;
      this.updatePaginatedEvents();
    } else if (newPage > totalPages && totalPages > 0 && this.currentPage !== totalPages) {
      console.log(`EventAdminComponent: Page ${newPage} invalide (max ${totalPages}). Redirection vers la dernière page.`);
      this.currentPage = totalPages;
      this.updatePaginatedEvents();
    }
  }

  // --- GESTION DES ACTIONS SUR LES ÉVÉNEMENTS ---
  /**
   * @method handleDeleteEventRequest
   * @description Gère la désactivation d'un événement.
   * Appelle `EventService.softDeleteEvent` et met à jour les listes localement.
   * @param eventToDelete L'événement à désactiver.
   */
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    console.log(`EventAdminComponent: Demande de désactivation pour l'événement ID ${eventToDelete.id} ("${eventToDelete.nom}").`);
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé avec succès.`, 'success');
        this.allEvenements = this.allEvenements.filter(e => e.id !== eventToDelete.id);
        this.filteredEvenements = this.filteredEvenements.filter(e => e.id !== eventToDelete.id);
        if (this.paginatedEvenements.length === 1 && this.currentPage > 1 && this.filteredEvenements.length % this.itemsPerPage === 0) {
          this.currentPage--;
        }
        this.updatePaginatedEvents();
      },
      error: (err: HttpErrorResponse) => {
        console.error(`EventAdminComponent: Erreur lors de la désactivation de l'événement ID ${eventToDelete.id}:`, err);
        this.notification.show(err.message || 'Une erreur est survenue lors de la désactivation de l\'événement.', 'error');
      }
    });
  }

  /**
   * @method handleEventCreatedOrUpdated
   * @description Gère la création ou la mise à jour d'un événement.
   * Recharge la liste complète des événements pour assurer la cohérence des données.
   * @param event L'événement qui a été créé ou mis à jour.
   */
  handleEventCreatedOrUpdated(event: Evenement): void {
    const action = this.allEvenements.some(e => e.id === event.id) ? 'mis à jour' : 'créé';
    console.log(`EventAdminComponent: Événement ${action} ("${event.nom}"). Rechargement de la liste.`);
    this.notification.show(`L'événement "${event.nom}" a été ${action} avec succès. La liste est mise à jour.`, 'info');
    this.chargerEvenements();
  }
}

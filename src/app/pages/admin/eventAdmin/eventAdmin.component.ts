// ----- IMPORTATIONS -----
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common'; // Pour @if, @for si tu migres, ou NgIf/NgForOf
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

// Services
import {EventService} from '../../../service/crud/event.service'; // Service pour les événements
import {AuthService} from '../../../service/security/auth.service'; // Pour l'ID du club/user
// Composants
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {CreateEventButtonComponent} from '../../../component/event/create-event-button/create-event-button.component';

// Modèles
import {Evenement} from '../../../model/evenement'; // Assure-toi que ce modèle existe et est correct
// Autres
import {LucideAngularModule} from 'lucide-angular';
import {FilterEventComponent} from '../../../component/event/filter-event/filter-event.component';
import {PaginationComponent} from '../../../component/navigation/pagination/pagination.component';
import {SweetAlertService} from '../../../service/sweet-alert.service';


@Component({
  selector: 'app-event',
  standalone: true, // Important si tu utilises cette approche
  imports: [
    CommonModule, // Contient NgIf, NgForOf OU les nouveaux @if, @for
    EventRowComponent,
    LucideAngularModule,
    // Assure-toi que le nom est correct
    CreateEventButtonComponent,
    FilterEventComponent,
    PaginationComponent,
  ],
  templateUrl: './eventAdmin.component.html',
  styleUrls: ['./eventAdmin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Recommandé pour les performances
})
export class EventAdminComponent implements OnInit, OnDestroy {

  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);

  allEvenements: Evenement[] = [];
  filteredEvenements: Evenement[] = [];
  paginatedEvenements: Evenement[] = [];

  isLoading = false;
  // Variables pour la modale de CRÉATION gérée par EventAdminComponent
  isCreateEventModalVisible = false;
  // selectedEventForEditModal n'est plus nécessaire si EventRow gère sa propre édition.
  // Si EventAdmin gère aussi une modale d'édition (par ex. depuis un autre contexte), il faudrait le garder.

  private eventsSubscription: Subscription | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 10;

  ngOnInit(): void {
    this.chargerEvenements();
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
  }

  chargerEvenements(): void {
    this.isLoading = true;
    this.allEvenements = [];
    this.filteredEvenements = [];
    this.paginatedEvenements = [];
    if (this.currentPage !== 1) this.currentPage = 1;
    this.cdr.detectChanges();

    console.log("EventAdmin: Début du chargement des événements...");
    this.eventsSubscription = this.eventService.getAllEvents().subscribe({
      next: (data: Evenement[]) => {
        this.allEvenements = data;
        this.filteredEvenements = [...this.allEvenements];
        this.updatePaginatedEvents();
        this.isLoading = false;
        console.log('EventAdmin: Événements chargés:', this.allEvenements.length);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('EventAdmin: Erreur de chargement:', err);
        this.notification.show(err.message || 'Erreur de chargement des événements.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- AJOUT : Méthode pour gérer la liste filtrée ---
  /**
   * Reçoit la liste filtrée/triée depuis FilterEventComponent.
   * Met à jour la liste filtrée, réinitialise la page et met à jour la pagination.
   * @param filteredList La liste des événements après application des filtres et du tri.
   */
  handleFilteredEventsChange(filteredList: Evenement[]): void {
    console.log("Liste filtrée/triée reçue:", filteredList.length, "éléments");
    this.filteredEvenements = filteredList;
    this.currentPage = 1; // Réinitialiser à la première page lors d'un changement de filtre/tri
    this.updatePaginatedEvents(); // Mettre à jour les éléments affichés
  }

  // --- AJOUT : Méthode pour mettre à jour la vue paginée ---
  /**
   * Calcule et met à jour la liste `paginatedEvenements`
   * basée sur `filteredEvenements`, `currentPage` et `itemsPerPage`.
   */
  updatePaginatedEvents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    // Utiliser slice pour extraire la bonne portion de la liste filtrée
    this.paginatedEvenements = this.filteredEvenements.slice(startIndex, endIndex);
    console.log(`Affichage page ${this.currentPage}, index ${startIndex} à ${endIndex - 1}`);
    this.cdr.detectChanges(); // Mettre à jour l'affichage
  }

  // --- AJOUT : Méthode pour gérer le changement de page ---
  /**
   * Appelée lorsque l'utilisateur change de page via le composant Pagination.
   * @param newPage Le nouveau numéro de page sélectionné.
   */
  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage !== this.currentPage) {
      console.log("Changement de page vers:", newPage);
      this.currentPage = newPage;
      this.updatePaginatedEvents(); // Mettre à jour les éléments affichés pour la nouvelle page
    }
  }

  // --- Gestion de la suppression (appelée par EventRowComponent) ---
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé.`, 'success');
        // Optionnel: recharger tout ou juste mettre à jour localement
        // Pour respecter "recharger que si modif", on met à jour localement ici:
        this.allEvenements = this.allEvenements.filter(e => e.id !== eventToDelete.id);
        this.filteredEvenements = this.filteredEvenements.filter(e => e.id !== eventToDelete.id);
        this.updatePaginatedEvents();
      },
      error: (err: HttpErrorResponse) => { /* ... */ }
    });
  }

  // --- GESTION DE LA MODALE DE CRÉATION GLOBALE ---
  // Appelée par le bouton "Ajouter un événement" (app-create-event-button)
  ouvrirModalCreationGlobale(): void {
    this.isCreateEventModalVisible = true; // Ouvre la modale de création
    console.log("EventAdmin: Ouverture modale pour création globale.");
    this.cdr.detectChanges();
  }

  // Appelée par l'événement (close) de la modale de création globale
  handleCloseModalCreationGlobale(): void {
    this.isCreateEventModalVisible = false;
    console.log("EventAdmin: Fermeture modale de création globale.");
    this.cdr.detectChanges();
  }
  // Appelée par l'événement (saveSuccess) de la modale de création globale
  handleSaveSuccessModalCreationGlobale(newEvent: Evenement): void {
    console.log("EventAdmin: Nouvel événement créé via modale globale:", newEvent);
    this.handleCloseModalCreationGlobale(); // Fermer la modale
    this.notification.show(`Événement "${newEvent.nom}" créé avec succès.`, 'success');
    console.log("EventAdmin: Lancement du rechargement après création globale.");
    this.chargerEvenements(); // Recharger la liste des événements
  }

  // --- GESTION DE LA MODIFICATION D'UN ÉVÉNEMENT (signalée par EventRowComponent) ---
  // Appelée par l'événement (eventUpdated) de app-event-row
  handleEventRowUpdated(updatedEvent: Evenement): void {
    console.log("EventAdmin: Mise à jour d'événement signalée par une ligne:", updatedEvent);
    this.notification.show(`Événement "${updatedEvent.nom}" mis à jour. Rechargement de la liste...`, 'info');
    console.log("EventAdmin: Lancement du rechargement après modification signalée par une ligne.");
    this.chargerEvenements(); // Recharger TOUTE la liste des événements
  }
}


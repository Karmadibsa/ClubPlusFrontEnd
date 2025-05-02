// ----- IMPORTATIONS -----
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common'; // Pour @if, @for si tu migres, ou NgIf/NgForOf
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

// Services
import {EventService} from '../../../service/model/event.service'; // Service pour les événements
import {AuthService} from '../../../service/security/auth.service'; // Pour l'ID du club/user
import {NotificationService} from '../../../service/model/notification.service'; // Pour les notifications
// Composants
import {EventRowComponent} from '../../../component/event/event-row/event-row.component';
import {CreateEventButtonComponent} from '../../../component/event/create-event-button/create-event-button.component';

// Modèles
import {Evenement} from '../../../model/evenement'; // Assure-toi que ce modèle existe et est correct
// Autres
import {LucideAngularModule} from 'lucide-angular';
import {FilterEventComponent} from '../../../component/event/filter-event/filter-event.component';
import {PaginationComponent} from '../../../component/navigation/pagination/pagination.component';


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
    PaginationComponent
  ],
  templateUrl: './eventAdmin.component.html',
  styleUrls: ['./eventAdmin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Recommandé pour les performances
})
export class EventAdminComponent implements OnInit, OnDestroy {

  // --- Injection des Services ---
  private eventService = inject(EventService);
  private authService = inject(AuthService); // Nécessaire si la modale ne récupère pas l'ID elle-même
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef); // Nécessaire avec OnPush

  // --- AJOUT/MODIFICATION : État pour listes d'événements ---
  allEvenements: Evenement[] = []; // Liste complète originale non filtrée
  filteredEvenements: Evenement[] = []; // Liste après filtrage/tri (utilisée pour la pagination)
  paginatedEvenements: Evenement[] = []; // Liste pour affichage dans le tableau (page actuelle)

  // --- État du Composant ---
  isLoading = false;
  isEditEventModalVisible = false;
  selectedEventForEditModal: Evenement | undefined = undefined; // Pour création ou modification
  private eventsSubscription: Subscription | null = null; // Pour gérer la désinscription
  isReservationModalVisible = false;
  selectedEventIdForReservationModal: number | null = null;
  selectedEventTitleForReservationModal: string = '';
  // --- AJOUT : État pour la Pagination ---
  currentPage: number = 1;
  itemsPerPage: number = 10; // Ou une autre valeur par défaut


  ngOnInit(): void {

    this.chargerEvenements();

  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe(); // Nettoyage
  }

  // --- MODIFICATION : chargerEvenements ---
  chargerEvenements(): void {
    this.isLoading = true;
    // Réinitialiser toutes les listes et la pagination
    this.allEvenements = [];
    this.filteredEvenements = [];
    this.paginatedEvenements = [];
    this.currentPage = 1;
    this.cdr.detectChanges();

    this.eventsSubscription = this.eventService.getAllEvents().subscribe({
      next: (data: Evenement[]) => {
        this.allEvenements = data;
        // Initialement, la liste filtrée est la même que la liste complète
        this.filteredEvenements = [...this.allEvenements];
        // Mettre à jour la vue paginée initiale
        this.updatePaginatedEvents();
        this.isLoading = false;
        console.log('Événements chargés:', this.allEvenements.length);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Erreur de chargement des événements:', err);
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


  // --- MODIFICATION : Gestion Suppression ---
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    // ... (confirmation optionnelle) ...
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé.`, 'valid');
        // **Important: Mettre à jour les DEUX listes principales**
        this.allEvenements = this.allEvenements.filter(e => e.id !== eventToDelete.id);
        this.filteredEvenements = this.filteredEvenements.filter(e => e.id !== eventToDelete.id);
        // Recalculer la pagination (peut changer le nombre total de pages ou la page actuelle)
        // Vérifier si la page actuelle devient invalide après suppression
        const maxPage = Math.ceil(this.filteredEvenements.length / this.itemsPerPage);
        if (this.currentPage > maxPage && maxPage > 0) {
          this.currentPage = maxPage; // Aller à la dernière page valide
        } else if (maxPage === 0) {
          this.currentPage = 1; // Si la liste est vide
        }
        this.updatePaginatedEvents(); // Mettre à jour la vue paginée
        // cdr.detectChanges() est appelé dans updatePaginatedEvents
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur de désactivation:', err);
        this.notification.show(err.message || 'Erreur lors de la désactivation.', 'error');
      }
    });
  }

  // --- Gestion de la Modale ---

  /**
   * Ouvre la modale en mode CRÉATION.
   * Appelée par le clic sur (createClicked) du composant app-create-event-button.
   */
  ouvrirModalCreation(): void {
    this.selectedEventForEditModal = undefined; // Important pour indiquer le mode création à la modale
    this.isEditEventModalVisible = true;
    this.cdr.detectChanges(); // Met à jour l'UI pour afficher la modale
  }

  /**
   * Ouvre la modale en mode MODIFICATION.
   * Appelée par l'événement (modifier) émis par app-event-row.
   * @param eventToEdit L'événement à modifier.
   */
  ouvrirModalModification(eventToEdit: Evenement): void {
    this.selectedEventForEditModal = eventToEdit; // Passe l'événement existant à la modale
    this.isEditEventModalVisible = true;
    this.cdr.detectChanges(); // Met à jour l'UI pour afficher la modale
  }

  /**
   * Ferme la modale.
   * Appelée par l'événement (close) émis par app-edit-event.
   */
  handleCloseModal(): void {
    this.isEditEventModalVisible = false;
    this.selectedEventForEditModal = undefined; // Nettoie l'événement en cours
    this.cdr.detectChanges(); // Met à jour l'UI pour cacher la modale
  }

  // --- MODIFICATION : Gestion Sauvegarde ---
  handleSaveEventSuccess(savedEvent: Evenement): void {
    console.log('Sauvegarde réussie pour l\'événement:', savedEvent);
    this.handleCloseEditModal();

    this.chargerEvenements();

    this.notification.show(`Événement "${savedEvent.nom}" sauvegardé avec succès.`, 'valid');
  }


  /** Ouvre la modale pour modifier un événement existant */
  handleOpenEditModal(eventToEdit: Evenement): void {
    console.log("Ouverture modale d'édition demandée pour:", eventToEdit);
    this.selectedEventForEditModal = eventToEdit; // Mémorise l'événement
    this.isEditEventModalVisible = true; // Affiche la modale
    this.cdr.detectChanges(); // Nécessaire avec OnPush
  }


  /**
   * Gère la fermeture de la modale d'édition/création d'événement.
   * Appelée lorsque la modale émet l'événement (close).
   */
  handleCloseEditModal(): void {
    console.log("Fermeture de la modale d'édition/création demandée.");
    this.isEditEventModalVisible = false; // Cache la modale
    this.selectedEventForEditModal = undefined; // Réinitialise l'événement sélectionné (bonne pratique)

    // Si tu utilises ChangeDetectionStrategy.OnPush:
    this.cdr.detectChanges();
  }

  /**
   * Ouvre la modale pour voir les réservations.
   * Appelée par l'événement (viewReservationsRequest) émis par app-event-row.
   * @param eventData Les données { id, title } émises par l'enfant.
   */
  handleViewReservationsRequest(eventData: { id: number, title: string }): void {
    console.log('EventAdmin: handleViewReservationsRequest appelé avec:', eventData); // <-- LOG 3 (Vous devriez le voir)
    this.selectedEventIdForReservationModal = eventData.id;
    this.selectedEventTitleForReservationModal = eventData.title;

    this.isReservationModalVisible = true; // <- La ligne critique

    console.log('EventAdmin: isReservationModalVisible est maintenant:', this.isReservationModalVisible); // <-- LOG 4 (Le voyez-vous ?)
    this.cdr.detectChanges(); // Important avec OnPush
  }


  /**
   * Ferme la modale de visualisation des réservations.
   * Appelée par l'événement (closeModal) émis par app-reservation-modal.
   */
  handleCloseReservationModal(): void {
    console.log('EventAdmin: Fermeture de la modale de réservation');
    this.isReservationModalVisible = false; // Cache la modale
    this.selectedEventIdForReservationModal = null; // Réinitialise les données
    this.selectedEventTitleForReservationModal = '';
    this.cdr.detectChanges(); // Important avec OnPush
  }
}


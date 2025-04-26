// ----- IMPORTATIONS -----
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Pour @if, @for si tu migres, ou NgIf/NgForOf
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { EventService } from '../../../service/event.service';             // Service pour les événements
import { AuthService } from '../../../service/security/auth.service';       // Pour l'ID du club/user
import { NotificationService } from '../../../service/notification.service'; // Pour les notifications

// Composants
import { EventRowComponent } from '../../../component/event/event-row/event-row.component';
import { SidebarComponent } from '../../../component/navigation/sidebar/sidebar.component';
import { EditEventModalComponent } from '../../../component/event/edit-event/edit-event.component'; // Le nom semble être EditEventComponent basé sur tes imports
import { CreateEventButtonComponent } from '../../../component/event/create-event-button/create-event-button.component';

// Modèles
import { Evenement } from '../../../model/evenement'; // Assure-toi que ce modèle existe et est correct

// Autres
import { LucideAngularModule } from 'lucide-angular';
import {
  ReservationEventModalComponent
} from '../../../component/event/reservation-event-modal/reservation-event-modal.component'; // Si utilisé dans le template


@Component({
  selector: 'app-event',
  standalone: true, // Important si tu utilises cette approche
  imports: [
    CommonModule, // Contient NgIf, NgForOf OU les nouveaux @if, @for
    SidebarComponent,
    EventRowComponent,
    LucideAngularModule,
    EditEventModalComponent, // Assure-toi que le nom est correct
    CreateEventButtonComponent,
    ReservationEventModalComponent
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

  // --- État du Composant ---
  evenements: Evenement[] = []; // Utilise le type Evenement
  isLoading = false;
  isEditEventModalVisible = false;
  selectedEventForEditModal: Evenement | undefined = undefined; // Pour création ou modification
  private eventsSubscription: Subscription | null = null; // Pour gérer la désinscription
  isReservationModalVisible = false;
  selectedEventIdForReservationModal: number | null = null;
  selectedEventTitleForReservationModal: string = '';

  ngOnInit(): void {
    this.chargerEvenements();
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe(); // Nettoyage
  }

  chargerEvenements(): void {
    this.isLoading = true;
    this.evenements = []; // Vide la liste pendant le chargement
    this.cdr.detectChanges(); // Met à jour l'UI pour montrer le chargement

    // Assure-toi que this.eventService.getAllEvents() (ou la méthode appelée)
    // fait bien GET /api/events?status=all dans le EventService.
    this.eventsSubscription = this.eventService.getAllEvents().subscribe({
      next: (data: Evenement[]) => { // Utilise le type Evenement[]
        this.evenements = data;
        this.isLoading = false;
        console.log('Événements chargés:', data);
        this.cdr.detectChanges(); // Met à jour l'UI avec les données
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Erreur de chargement des événements:', err);
        // Utilise le message d'erreur retourné par le handleError du service si possible
        this.notification.show(err.message || 'Erreur de chargement des événements.', 'error');
        this.cdr.detectChanges(); // Met à jour l'UI pour enlever l'état de chargement
      }
    });
  }

  /**
   * Gère la demande de suppression émise par EventRowComponent.
   */
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    // Optionnel: Ajouter une confirmation plus robuste (ex: modale de confirmation)
    // const confirmation = confirm(`Êtes-vous sûr de vouloir désactiver l'événement "${eventToDelete.nom}" ?`);
    // if (!confirmation) return;

    // Utilise EventService pour la suppression (soft delete)
    this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
      next: () => {
        this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé.`, 'valid');
        // Met à jour la liste locale SANS recharger toute la page
        this.evenements = this.evenements.filter(e => e.id !== eventToDelete.id);
        this.cdr.detectChanges(); // Met à jour l'affichage
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

  /**
   * Gère la sauvegarde réussie (création ou modification) émise par la modale.
   * Appelée par l'événement (saveSuccess) émis par app-edit-event.
   * @param savedEvent L'événement qui a été créé ou mis à jour.
   */
  handleSaveSuccess(savedEvent: Evenement): void {
    const isUpdate = this.evenements.some(e => e.id === savedEvent.id);

    if (isUpdate) {
      // --- Mise à jour de l'élément dans la liste ---
      this.evenements = this.evenements.map(event =>
        event.id === savedEvent.id ? savedEvent : event // Remplace l'ancien par le nouveau
      );
      console.log('Événement mis à jour dans la liste locale.');
    } else {
      // --- Ajout du nouvel élément à la liste ---
      // Optionnel: Trier la liste ou simplement ajouter au début/fin
      this.evenements = [savedEvent, ...this.evenements]; // Ajoute au début
      console.log('Nouvel événement ajouté à la liste locale.');
    }

    this.handleCloseModal(); // Ferme la modale après succès
    // La notification est déjà gérée dans la modale, pas besoin ici en général.
    this.cdr.detectChanges(); // Met à jour l'affichage de la liste
  }

  /** Ouvre la modale pour modifier un événement existant */
  handleOpenEditModal(eventToEdit: Evenement): void {
    console.log("Ouverture modale d'édition demandée pour:", eventToEdit);
    this.selectedEventForEditModal = eventToEdit; // Mémorise l'événement
    this.isEditEventModalVisible = true; // Affiche la modale
    this.cdr.detectChanges(); // Nécessaire avec OnPush
  }

  /**
   * Gère la sauvegarde réussie d'un événement depuis la modale.
   * Appelée lorsque la modale émet l'événement (saveSuccess).
   * @param savedEvent L'événement qui vient d'être créé ou mis à jour.
   */
  handleSaveEventSuccess(savedEvent: Evenement): void {
    console.log('Sauvegarde réussie depuis la modale pour l\'événement:', savedEvent);

    // 1. Fermer la modale
    this.handleCloseEditModal(); // Réutilise la logique de fermeture

    // 2. Mettre à jour la liste des événements affichée (nextFiveEvents)
    // C'est l'étape la plus importante pour voir le résultat !
    // Option A: Recharger simplement toute la liste (plus simple, mais peut causer un léger clignotement)
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) {
      console.log("Rechargement des données du dashboard après sauvegarde...");
      // Tu pourrais vouloir une méthode plus ciblée juste pour recharger les événements
      this.chargerEvenements();
    } else {
      this.notification.show("Erreur: ID du club non trouvé pour recharger les données.", "error");
    }

    // Option B: Mettre à jour la liste 'nextFiveEvents' manuellement (plus complexe)
    //    - Si c'était une création, vérifier si le nouvel événement doit apparaître dans les 5 prochains.
    //    - Si c'était une mise à jour, trouver l'événement dans la liste et le remplacer.
    //    - Nécessiterait probablement un appel ciblé à this.eventService.getNextEvents() ou une logique de tri/filtrage.
    //    - N'oublie pas this.cdr.detectChanges() si tu choisis cette option et utilises OnPush.

    // 3. Afficher une notification de succès
    this.notification.show(`Événement "${savedEvent.nom}" sauvegardé avec succès.`, 'valid');
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


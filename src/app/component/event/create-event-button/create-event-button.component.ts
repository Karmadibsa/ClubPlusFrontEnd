import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Evenement } from '../../../model/evenement';
import { EditEventModalComponent } from '../edit-event/edit-event.component';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-create-event-button',
  imports: [
    LucideAngularModule,
    EditEventModalComponent
  ],
  standalone: true,
  templateUrl: './create-event-button.component.html',
  styleUrl: './create-event-button.component.scss'
})
/**
 * Gère l'affichage d'un bouton pour ouvrir une modale de création d'événement.
 * Ce composant orchestre le cycle de vie de la modale et notifie son parent
 * lorsqu'un événement est créé avec succès.
 */
export class CreateEventButtonComponent {
  /** Émis avec le nouvel événement après sa création réussie dans la modale. */
  @Output() eventCreated = new EventEmitter<Evenement>();

  // --- Services injectés ---
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);

  /** Détermine si la modale de création est actuellement visible. */
  isModalVisible = false;

  /** Stocke l'ID du club à passer à la modale pour la création. */
  clubIdForModal: number | null = null;

  /**
   * Ouvre la modale de création après avoir vérifié que l'utilisateur
   * est bien associé à un club.
   */
  openCreateModal(): void {
    this.clubIdForModal = this.authService.getManagedClubId();

    // Sécurité : ne pas ouvrir la modale si aucun club n'est géré par l'utilisateur.
    if (this.clubIdForModal === null) {
      console.error("Tentative d'ouverture de la modale de création sans ID de club.");
      this.notification.show("Impossible de créer un événement : club non trouvé.", "error");
      return;
    }

    this.isModalVisible = true;
    // Force la détection de changements, particulièrement utile si la stratégie est OnPush.
    this.cdr.detectChanges();
  }

  /** Gère la fermeture de la modale (sans sauvegarde). */
  handleModalClose(): void {
    this.isModalVisible = false;
    this.cdr.detectChanges();
  }

  /**
   * Gère la sauvegarde réussie depuis la modale.
   * Ferme la modale et propage l'événement nouvellement créé au composant parent.
   * @param newEvent L'événement qui vient d'être créé.
   */
  handleModalSaveSuccess(newEvent: Evenement): void {
    this.handleModalClose();
    this.eventCreated.emit(newEvent);
  }
}

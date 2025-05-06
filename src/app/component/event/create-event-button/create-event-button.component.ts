import {ChangeDetectorRef, Component, EventEmitter, inject, Output} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {Dialog, DialogRef} from '@angular/cdk/dialog';
import {Evenement} from '../../../model/evenement';
import {EditEventModalComponent} from '../edit-event/edit-event.component';
import {AuthService} from '../../../service/security/auth.service';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-create-event-button',
  imports: [
    LucideAngularModule,
    EditEventModalComponent
  ],
  templateUrl: './create-event-button.component.html',
  styleUrl: './create-event-button.component.scss'
})
export class CreateEventButtonComponent {
  // Événement émis APRES la création réussie d'un événement via la modale
  @Output() eventCreated = new EventEmitter<Evenement>();

  private authService = inject(AuthService);
  private notification = inject(SweetAlertService); // Si besoin de notifier depuis le bouton
  private cdr = inject(ChangeDetectorRef);

  isModalVisible = false; // Contrôle la visibilité de la modale déclarée dans le template
  clubIdForModal: number | null = null;

  // Méthode appelée par le (click) du bouton dans le template de CreateEventButtonComponent
  openCreateModal(): void {
    this.clubIdForModal = this.authService.getManagedClubId();
    if (this.clubIdForModal === null) {
      console.error("CreateEventButton: Club ID non trouvé, impossible d'ouvrir la modale de création.");
      this.notification.show("Impossible d'ouvrir la création d'événement: ID du club manquant.", "error");
      return;
    }
    this.isModalVisible = true;
    this.cdr.detectChanges(); // S'assurer que la vue est mise à jour si OnPush est utilisé ailleurs
  }

  // Appelée par l'événement (close) de <app-edit-event> dans le template du bouton
  handleModalClose(): void {
    this.isModalVisible = false;
    this.cdr.detectChanges();
  }

  // Appelée par l'événement (saveSuccess) de <app-edit-event> dans le template du bouton
  handleModalSaveSuccess(newEvent: Evenement): void {
    console.log('CreateEventButton: Modale a sauvegardé avec succès:', newEvent);
    this.handleModalClose(); // Fermer la modale
    this.eventCreated.emit(newEvent); // Émettre l'événement créé vers le parent (EventAdminComponent)
  }
}

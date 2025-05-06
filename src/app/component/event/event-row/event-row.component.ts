import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {DatePipe} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {EditEventModalComponent} from '../edit-event/edit-event.component';
import {Evenement} from '../../../model/evenement';
import {ParticipationEventModalComponent} from '../participation-event-modal/participation-event-modal.component';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: '[app-event-row]',
  templateUrl: './event-row.component.html',
  imports: [
    DatePipe,
    LucideAngularModule,

    EditEventModalComponent,
    ParticipationEventModalComponent
  ],
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {
  private swalService = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);

  @Input() evenement!: Evenement;
  @Output() deleteRequest = new EventEmitter<Evenement>(); // Pour la suppression

  // Événement émis lorsque cet événement spécifique de la ligne a été modifié avec succès
  @Output() eventUpdated = new EventEmitter<Evenement>();

  isModalEditVisible = false; // Contrôle la modale d'édition de CETTE ligne
  isParticipationModalVisible = false; // Contrôle la modale de participation de CETTE ligne

  // Ouvre la modale d'édition pour l'événement de cette ligne
  ouvrirModalEditionDeLigne(): void {
    this.isModalEditVisible = true;
    this.cdr.detectChanges();
  }

  // Ferme la modale d'édition de cette ligne
  fermerModalEditionDeLigne(): void {
    this.isModalEditVisible = false;
    this.cdr.detectChanges();
  }

  // Appelée lorsque la modale d'édition (instanciée dans ce template) émet saveSuccess
  handleSaveSuccessEditionDeLigne(evenementModifie: Evenement): void {
    console.log('EventRow: Édition réussie pour', evenementModifie);
    this.fermerModalEditionDeLigne(); // Fermer la modale de CETTE ligne
    this.eventUpdated.emit(evenementModifie); // Notifier EventAdminComponent que l'événement a été mis à jour
  }

  // --- Gestion Modale Participation (inchangée) ---
  ouvrirModalParticipation(): void {
    if (this.evenement) {
      this.isParticipationModalVisible = true;
      this.cdr.detectChanges();
    }
  }

  handleCloseParticipationModal(): void {
    this.isParticipationModalVisible = false;
    this.cdr.detectChanges();
  }

  // --- Demande de suppression (inchangée) ---
  requestDelete(): void {
    this.swalService.confirmAction(
      'Désactiver cet événement ?',
      `Êtes-vous sûr de vouloir désactiver l'événement "${this.evenement.nom}" ?`,
      () => {
        this.deleteRequest.emit(this.evenement);
      },
      'Oui, désactiver'
    );
  }
}

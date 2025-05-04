import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
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

  @Input() evenement!: Evenement;
  @Output() deleteRequest = new EventEmitter<Evenement>(); // RENOMMÉ de 'supprimer'. Utilisez Evenement.
  @Output() modifier = new EventEmitter<any>();

  isModalEditVisible = false;
  isParticipationModalVisible = false;

  ouvrirModalEdit(): void {
    this.isModalEditVisible = true;
  }

  fermerModalEdit(): void {
    this.isModalEditVisible = false;
  }

  sauvegarderEvenement(evenementModifie: any): void {
    this.modifier.emit(evenementModifie);
    this.fermerModalEdit();
  }

  // --- Gestion Modale Participation ---
  // Appelée par le clic sur le bouton "Voir Réservations"
  ouvrirModalParticipation(): void {
    console.log('EventRow: ouverture Modale Participation pour event ID:', this.evenement?.id); // Log de débogage
    if (this.evenement) { // Vérification ajoutée pour robustesse
      this.isParticipationModalVisible = true;
    } else {
      console.error("EventRow: Données 'evenement' non disponibles pour ouvrir la modale.");
    }
  }

  // Appelée par l'événement (closeModal) de app-participation-event-modal
  handleCloseParticipationModal(): void {
    this.isParticipationModalVisible = false;
  }

  /**
   * Appelée lorsque l'utilisateur clique sur le bouton "Supprimer" de CETTE ligne.
   * Émet un événement `deleteRequest` vers le composant parent avec l'événement à supprimer.
   */
  requestDelete(): void {
    console.log("Initiation demande de suppression pour :", this.evenement);

    // --- Remplacement de confirm() ---
    this.swalService.confirmAction(
      'Désactiver cet événement ?', // Titre
      `Êtes-vous sûr de vouloir désactiver l'événement "${this.evenement.nom}" ?`, // Texte

      // --- Callback si confirmé ---
      () => {
        // --- Émettre l'événement seulement si confirmé ---
        console.log('Confirmation reçue, émission de deleteRequest pour', this.evenement);
        this.deleteRequest.emit(this.evenement);
        // -----------------------------------------------
      }
      // --- Fin Callback ---
      , 'Oui, désactiver' // Texte bouton confirmer (optionnel)
      // , 'Annuler' // Texte bouton annuler (optionnel)
    );
    // ------------------------------
  }
}

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {EditEventModalComponent} from '../edit-event/edit-event.component';
import {Evenement} from '../../../model/evenement';
import {ParticipationEventModalComponent} from '../participation-event-modal/participation-event-modal.component';

@Component({
  selector: '[app-event-row]',
  templateUrl: './event-row.component.html',
  imports: [
    DatePipe,
    LucideAngularModule,

    NgForOf,
    NgIf,
    EditEventModalComponent,
    ParticipationEventModalComponent
  ],
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {
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
    console.log("Demande de suppression émise pour :", this.evenement);
    const confirmation = confirm(`Désactiver "${this.evenement.nom}" ?`);
    if (confirmation) {
      this.deleteRequest.emit(this.evenement);
    }
    // Émet l'événement vers le parent (DashboardComponent) qui contiendra la logique
    // d'appel API et de confirmation.
    // this.deleteRequest.emit(this.evenement);
  }

}

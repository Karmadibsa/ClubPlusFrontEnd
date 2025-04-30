import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {EditEventModalComponent} from '../edit-event/edit-event.component';
import {Evenement} from '../../../model/evenement';

@Component({
  selector: '[app-event-row]',
  templateUrl: './event-row.component.html',
  imports: [
    DatePipe,
    LucideAngularModule,

    NgForOf,
    NgIf,
    EditEventModalComponent
  ],
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {
  @Input() evenement: any;
  @Output() deleteRequest = new EventEmitter<Evenement>(); // RENOMMÉ de 'supprimer'. Utilisez Evenement.
  @Output() modifier = new EventEmitter<any>();
  @Output() viewReservationsRequest = new EventEmitter<{ id: number, title: string }>();

  isModalVisible = false;

  ouvrirModal(): void {
    this.isModalVisible = true;
  }

  fermerModal(): void {
    this.isModalVisible = false;
  }

  sauvegarderEvenement(evenementModifie: any): void {
    this.modifier.emit(evenementModifie);
    this.fermerModal();
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

// Dans event-row.component.ts
  onRequestViewReservations(): void {
    console.log('EventRow: Bouton Voir Réservations cliqué pour event ID:', this.evenement.id); // Log 1
    const eventData = {
      id: this.evenement.id,
      title: this.evenement.nom
    };
    console.log('EventRow: Émission de viewReservationsRequest avec:', eventData); // Log 2
    this.viewReservationsRequest.emit(eventData);
  }

}

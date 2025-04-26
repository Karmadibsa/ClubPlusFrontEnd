import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {EditEventModalComponent} from '../edit-event/edit-event.component';

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
  @Output() deleteRequest = new EventEmitter<any>(); // RENOMMÉ de 'supprimer'. Utilisez Evenement.
  @Output() modifier = new EventEmitter<any>();

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
    // Émet l'événement vers le parent (DashboardComponent) qui contiendra la logique
    // d'appel API et de confirmation.
    this.deleteRequest.emit(this.evenement);
  }
}

import {Component, Input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {MatCardModule} from "@angular/material/card";
import {LucideAngularModule} from 'lucide-angular';
import {ReservationModalComponent} from '../reservation-modal/reservation-modal.component';
import {Evenement} from '../../../model/evenement';

@Component({
  selector: 'app-event-card',
  imports: [
    DatePipe,
    MatCardModule,
    LucideAngularModule,
    ReservationModalComponent,

  ],
  templateUrl: './eventcard.component.html',
  styleUrls: ['./eventcard.component.scss']

})
export class EventCardComponent {
  // Utiliser le type Evenement et l'initialiser ou utiliser `!`
  @Input() event!: Evenement; // Ou event: Evenement | null = null;

  // État local pour la visibilité
  isReservationModalVisible = false;

  // Plus besoin de MatDialog

  openReservationModal(): void {
    if (!this.event) return; // Ne rien faire si event n'est pas défini
    this.isReservationModalVisible = true;
  }

  handleCloseReservationModal(): void {
    this.isReservationModalVisible = false;
  }

  handleReserveSuccess(response: any): void {
    // Mettre à jour l'affichage de la carte si nécessaire
    // Exemple: incrémenter placeReserve (si l'API ne renvoie pas l'état à jour)
    // ou idéalement, émettre un événement au parent pour rafraîchir la liste complète
  }
}



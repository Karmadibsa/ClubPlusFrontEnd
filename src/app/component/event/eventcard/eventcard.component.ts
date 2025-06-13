import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatePipe } from "@angular/common";
import { LucideAngularModule } from 'lucide-angular';
import { ReservationModalComponent } from '../reservation-modal/reservation-modal.component';
import { Evenement } from '../../../model/evenement';

/**
 * Affiche les informations d'un événement sous la forme d'une carte visuelle.
 *
 * Ce composant est responsable de l'affichage des détails d'un seul événement
 * et gère l'ouverture/fermeture de sa propre modale de réservation.
 *
 * @example
 * <app-event-card [event]="monEvent" (reservationSuccess)="(...)"></app-event-card>
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [
    DatePipe,
    LucideAngularModule,
    ReservationModalComponent
    // MatCardModule n'est pas utilisé dans le template fourni.
  ],
  templateUrl: './eventcard.component.html',
  styleUrls: ['./eventcard.component.scss']
})
export class EventCardComponent {

  /** L'objet Evenement à afficher. Requis. */
  @Input() event!: Evenement;

  /** Émis avec les données de la réservation après un succès. */
  @Output() reservationSuccess = new EventEmitter<any>();

  /** Contrôle la visibilité de la modale de réservation. */
  public isReservationModalVisible = false;

  // =================================================================================================
  // == GESTION DE LA MODALE
  // =================================================================================================

  /**
   * Ouvre la modale de réservation pour l'événement de cette carte.
   */
  public openReservationModal(): void {
    if (!this.event) {
      return;
    }
    this.isReservationModalVisible = true;
  }

  /**
   * Ferme la modale de réservation.
   * Cette méthode est déclenchée par l'événement (close) de la modale.
   */
  public handleCloseReservationModal(): void {
    this.isReservationModalVisible = false;
  }

  /**
   * Gère le succès de la réservation depuis la modale.
   * Ferme la modale et propage les données de la réservation au composant parent.
   * @param reservationData - Les données retournées par la modale après le succès.
   */
  public handleReserveSuccess(reservationData: any): void {
    this.isReservationModalVisible = false;
    this.reservationSuccess.emit(reservationData);
  }
}

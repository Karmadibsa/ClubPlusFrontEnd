import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common'; // CommonModule (qui exporte DatePipe) sera importé.
import { QrCodeModalComponent } from "../qr-code-modal/qr-code-modal.component";
import { Reservation } from '../../../model/reservation';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: '[app-reservation-row]',
  standalone: true,
  imports: [
    LucideAngularModule,
    DatePipe,
    QrCodeModalComponent
  ],
  templateUrl: './reservation-row.component.html',
  styleUrls: ['./reservation-row.component.scss']
})
export class ReservationRowComponent {
  // --- INPUTS ---

  /**
   * @Input() reservation!: Reservation
   * @description L'objet `Reservation` à afficher dans cette ligne.
   */
  @Input() reservation!: Reservation;

  // --- OUTPUTS (Actions déléguées au parent) ---

  /**
   * @Output() generatePDF
   * @description Événement émis vers le composant parent lorsque l'utilisateur demande
   */
  @Output() generatePDF = new EventEmitter<Reservation>();

  /**
   * @Output() deleteReservation
   * @description Événement émis vers le composant parent lorsque l'utilisateur demande
   */
  @Output() deleteReservation = new EventEmitter<Reservation>();

  // --- ÉTAT LOCAL POUR LA MODALE QR CODE ---

  /**
   * @property isQrModalOpen
   * @description Booléen qui contrôle la visibilité de la modale `QrCodeModalComponent`
   *              spécifique à CETTE réservation.
   */
  isQrModalOpen = false;

  // --- MÉTHODES DE GESTION DE LA MODALE QR CODE ---

  /**
   * @method openQrCodeModalHandler
   * @description Ouvre la modale `QrCodeModalComponent` pour afficher le QR code de cette réservation.
   *              Généralement appelée par un clic sur un bouton "Afficher QR Code" dans le template.
   */
  openQrCodeModalHandler(): void {
    // Vérification de sécurité : s'assurer que `reservation` est bien défini.
    if (!this.reservation) {
      console.warn("ReservationRowComponent: Tentative d'ouverture de la modale QR code sans données de réservation.");
      return;
    }
    console.log(`ReservationRowComponent: Ouverture de la modale QR code pour la réservation ID ${this.reservation.reservationUuid}`);
    this.isQrModalOpen = true;
    // this.cdr.detectChanges(); // À ajouter si ChangeDetectionStrategy.OnPush est utilisé.
  }

  /**
   * @method closeQrModalHandler
   * @description Ferme la modale `QrCodeModalComponent`.
   */
  closeQrModalHandler(): void {
    console.log(`ReservationRowComponent: Fermeture de la modale QR code pour la réservation ID ${this.reservation?.reservationUuid}`);
    this.isQrModalOpen = false;
    // this.cdr.detectChanges(); // À ajouter si ChangeDetectionStrategy.OnPush est utilisé.
  }

  // --- MÉTHODES POUR LES AUTRES ACTIONS (ÉMISSION VERS LE PARENT) ---

  /**
   * @method onGeneratePDF
   * @description Émet l'événement `generatePDF` avec l'objet `reservation` de cette ligne.
   */
  onGeneratePDF(): void {
    if (!this.reservation) {
      console.warn("ReservationRowComponent: Tentative de génération de PDF sans données de réservation.");
      return;
    }
    console.log(`ReservationRowComponent: Demande de génération de PDF pour la réservation ID ${this.reservation.reservationUuid}`);
    this.generatePDF.emit(this.reservation);
  }

  /**
   * @method onDelete
   * @description Émet l'événement `deleteReservation` avec l'objet `reservation` de cette ligne.
   */
  onDelete(): void {
    if (!this.reservation) {
      console.warn("ReservationRowComponent: Tentative de suppression sans données de réservation.");
      return;
    }
    console.log(`ReservationRowComponent: Demande de suppression pour la réservation ID ${this.reservation.reservationUuid}`);
    this.deleteReservation.emit(this.reservation);
  }
}

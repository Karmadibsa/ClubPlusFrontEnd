import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe} from '@angular/common';
import {QrCodeModalComponent} from "../qr-code-modal/qr-code-modal.component";
import {Reservation} from '../../../model/reservation';

@Component({
  selector: '[app-reservation-row]',
  standalone: true,
  templateUrl: './reservation-row.component.html',
  imports: [
    LucideAngularModule,
    DatePipe,
    QrCodeModalComponent
  ],
  styleUrls: ['./reservation-row.component.scss']
})
export class ReservationRowComponent {
// Utiliser un type précis et l'opérateur '!' si on est sûr qu'il sera fourni
  @Input() reservation!: Reservation;

  // Outputs pour les actions nécessitant une logique parent (API calls)
  @Output() generatePDF = new EventEmitter<Reservation>();
  @Output() deleteReservation = new EventEmitter<Reservation>();

  // État local pour la visibilité de la modale QR Code
  isQrModalOpen = false;
  // Pas besoin de selectedTicket séparé si reservation contient tout

  // Méthode appelée par le clic sur le bouton QR Code
  openQrCodeModalHandler(): void {
    if (!this.reservation) return; // Sécurité
    console.log("Ouverture QR Modal pour résa:", this.reservation.id);

    this.isQrModalOpen = true;
  }

  // Méthode appelée par l'output (close) de la modale QR Code
  closeQrModalHandler(): void {
    this.isQrModalOpen = false;
  }

  // Méthodes pour les autres actions qui émettent vers le parent
  onGeneratePDF(): void {
    if (!this.reservation) return;
    this.generatePDF.emit(this.reservation);
  }

  onDelete(): void {
    if (!this.reservation) return;
    this.deleteReservation.emit(this.reservation);
  }
}


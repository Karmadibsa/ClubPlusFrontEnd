import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common'; // CommonModule (qui exporte DatePipe) sera importé.
import { QrCodeModalComponent } from "../qr-code-modal/qr-code-modal.component";
import { Reservation } from '../../../model/reservation';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: '[app-reservation-row]', // Sélecteur d'attribut.
  // Utilisation : <tr app-reservation-row [reservation]="maReservation"></tr>
  standalone: true,                   // Indique que c'est un composant autonome.
  imports: [
    LucideAngularModule,              // Pour les icônes.
    DatePipe,                         // Ou `CommonModule` qui inclut DatePipe.
    QrCodeModalComponent              // Pour pouvoir utiliser <app-qr-code-modal> dans le template.
  ],
  templateUrl: './reservation-row.component.html', // Template HTML pour afficher une ligne de réservation.
  styleUrls: ['./reservation-row.component.scss']  // Styles SCSS spécifiques à cette ligne.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Pourrait être ajouté si nécessaire et géré avec cdr.detectChanges()
})
export class ReservationRowComponent {
  // --- INPUTS ---

  /**
   * @Input() reservation!: Reservation
   * @description L'objet `Reservation` à afficher dans cette ligne.
   *              Le `!` (definite assignment assertion) indique à TypeScript que cette propriété
   *              sera toujours fournie par le composant parent avant d'être utilisée.
   *              Le typage précis avec `Reservation` est une bonne pratique.
   */
  @Input() reservation!: Reservation;

  // --- OUTPUTS (Actions déléguées au parent) ---

  /**
   * @Output() generatePDF
   * @description Événement émis vers le composant parent lorsque l'utilisateur demande
   *              la génération d'un PDF pour cette réservation.
   *              Le parent se chargera de la logique de génération du PDF.
   *              La valeur émise est l'objet `Reservation` concerné.
   */
  @Output() generatePDF = new EventEmitter<Reservation>();

  /**
   * @Output() deleteReservation
   * @description Événement émis vers le composant parent lorsque l'utilisateur demande
   *              la suppression (ou l'annulation) de cette réservation.
   *              Le parent se chargera de l'appel API et de la confirmation.
   *              La valeur émise est l'objet `Reservation` concerné.
   */
  @Output() deleteReservation = new EventEmitter<Reservation>();

  // --- ÉTAT LOCAL POUR LA MODALE QR CODE ---

  /**
   * @property isQrModalOpen
   * @description Booléen qui contrôle la visibilité de la modale `QrCodeModalComponent`
   *              spécifique à CETTE réservation.
   */
  isQrModalOpen = false;

  // Le commentaire "Pas besoin de selectedTicket séparé si reservation contient tout" est pertinent.
  // L'objet `this.reservation` contient déjà toutes les informations nécessaires.

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
   *              Cette méthode est appelée lorsque la modale enfant (`QrCodeModalComponent`)
   *              émet son propre événement `close`.
   *              Dans le template de `ReservationRowComponent`:
   *              `<app-qr-code-modal (close)="closeQrModalHandler()"></app-qr-code-modal>`
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
   *              Le composant parent sera responsable de la logique de génération du PDF.
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
   *              Le composant parent sera responsable de la logique de suppression/annulation
   *              (y compris la confirmation utilisateur via SweetAlert, par exemple).
   */
  onDelete(): void {
    if (!this.reservation) {
      console.warn("ReservationRowComponent: Tentative de suppression sans données de réservation.");
      return;
    }
    console.log(`ReservationRowComponent: Demande de suppression pour la réservation ID ${this.reservation.reservationUuid}`);
    this.deleteReservation.emit(this.reservation);
    // Note: La confirmation (ex: SweetAlert) est généralement gérée par le composant
    // qui effectue réellement l'action (le parent ici), car c'est lui qui fera l'appel API.
    // Si la confirmation devait se faire ici, il faudrait injecter SweetAlertService.
  }

  // Pas de `ChangeDetectorRef` (cdr) injecté ou utilisé explicitement dans ce code.
  // Si ce composant ou ses parents utilisent `ChangeDetectionStrategy.OnPush`, il faudrait
  // injecter `cdr` et appeler `cdr.detectChanges()` après avoir modifié `isQrModalOpen`.
  // Exemple (à ajouter si nécessaire) :
  // private cdr = inject(ChangeDetectorRef);
  // ... et dans openQrCodeModalHandler() / closeQrModalHandler() :
  // this.cdr.detectChanges();
}

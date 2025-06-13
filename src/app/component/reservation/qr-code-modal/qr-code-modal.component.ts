import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { QRCodeComponent } from 'angularx-qrcode';
import {Reservation} from '../../../model/reservation'; // Assurez-vous que cette bibliothèque est installée et configurée.

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    QRCodeComponent
  ],
  templateUrl: './qr-code-modal.component.html',
  styleUrls: ['./qr-code-modal.component.scss']
})
export class QrCodeModalComponent {
  // --- INPUTS (Fournis par le composant parent) ---

  /**
   * @Input() isOpen
   * @description Booléen qui contrôle la visibilité de la modale.
   *              Le parent définit cette propriété à `true` pour afficher la modale.
   */
  @Input() isOpen: boolean = false;

  /**
   * @Input() ticketInfo: any | null
   * @description Les informations du ticket ou de la réservation à afficher à côté du QR code.
   */
  @Input() ticketInfo: Reservation | null = null;

  /**
   * @Input() qrData
   * @description La chaîne de caractères qui sera encodée dans le QR code.
   */
  @Input() qrData: string = '';

  // --- OUTPUTS (Événements vers le parent) ---

  /**
   * @Output() close
   * @description Événement émis vers le composant parent lorsque la modale doit être fermée
   */
  @Output() close = new EventEmitter<void>();

  // --- MÉTHODES ---

  /**
   * @method onClose
   * @description Émet l'événement `close` pour demander au composant parent de fermer cette modale.
   */
  onClose(): void {
    console.log('QrCodeModalComponent: Demande de fermeture.');
    this.close.emit();
  }

  /**
   * @method stopPropagation
   * @description Empêche la propagation d'un événement (typiquement un clic) vers les éléments parents.
   * @param event L'objet événement DOM.
   */
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

}

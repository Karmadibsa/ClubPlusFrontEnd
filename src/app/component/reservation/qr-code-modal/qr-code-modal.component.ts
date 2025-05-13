import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { QRCodeComponent } from 'angularx-qrcode';
import {Reservation} from '../../../model/reservation'; // Assurez-vous que cette bibliothèque est installée et configurée.

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-qr-code-modal',   // Sélecteur CSS pour utiliser ce composant.
  // Exemple: <app-qr-code-modal [isOpen]="..." [qrData]="..." (close)="...">
  standalone: true,                 // Indique que c'est un composant autonome.
  imports: [
    CommonModule,                   // Pour @if ou *ngIf dans le template.
    LucideAngularModule,            // Pour les icônes (ex: bouton de fermeture).
    QRCodeComponent                 // Nécessaire pour utiliser la balise <qrcode> dans le template.
  ],
  templateUrl: './qr-code-modal.component.html', // Template HTML de la modale.
  styleUrls: ['./qr-code-modal.component.scss']  // Styles SCSS spécifiques.
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
   *              Le type `any` est utilisé ici, mais il serait préférable de le remplacer
   *              par un type plus spécifique si la structure de `ticketInfo` est connue
   *              (par exemple, une interface `TicketDetails` ou votre modèle `Reservation`).
   *              Initialisé à `null`.
   *              **Note du code source** : "Doit correspondre à l'objet reservation".
   *              Donc, idéalement, ce devrait être `@Input() ticketInfo: Reservation | null = null;`
   *              (en important `Reservation` depuis `../../../model/reservation`).
   */
  @Input() ticketInfo: Reservation | null = null;

  /**
   * @Input() qrData
   * @description La chaîne de caractères qui sera encodée dans le QR code.
   *              Cela pourrait être un ID de réservation, une URL, ou toute autre donnée
   *              pertinente pour le scan du QR code.
   *              Initialisée à une chaîne vide.
   */
  @Input() qrData: string = '';

  // --- OUTPUTS (Événements vers le parent) ---

  /**
   * @Output() close
   * @description Événement émis vers le composant parent lorsque la modale doit être fermée
   *              (par exemple, clic sur un bouton "Fermer" ou sur l'overlay).
   *              Le nom de l'output a été normalisé en `close` (au lieu de `closeModal`).
   */
  @Output() close = new EventEmitter<void>();

  // --- MÉTHODES ---

  /**
   * @method onClose
   * @description Émet l'événement `close` pour demander au composant parent de fermer cette modale.
   *              Généralement appelée par un clic sur un bouton de fermeture ou sur l'overlay de la modale.
   */
  onClose(): void {
    console.log('QrCodeModalComponent: Demande de fermeture.');
    this.close.emit();
  }

  /**
   * @method stopPropagation
   * @description Empêche la propagation d'un événement (typiquement un clic) vers les éléments parents.
   *              Utilisé sur le contenu principal de la modale pour éviter qu'un clic
   *              à l'intérieur ne déclenche la méthode `onClose()` si celle-ci est attachée
   *              à un clic sur l'overlay parent.
   * @param event L'objet événement DOM.
   */
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

}

import { Component, Input } from '@angular/core';
import { DatePipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { LucideAngularModule } from 'lucide-angular';
import { ReservationModalComponent } from '../reservation-modal/reservation-modal.component';
import { Evenement } from '../../../model/evenement';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-event-card',      // Sélecteur CSS pour utiliser ce composant.
  // Exemple: <app-event-card [event]="monEvenement"></app-event-card>

  // standalone: true, // Supposons qu'il soit autonome pour la gestion des imports.
  imports: [
    // DatePipe: Doit être importé pour être utilisé dans le template. Si ce composant est autonome,
    //           importer CommonModule (qui exporte DatePipe) est une pratique courante.
    //           Sinon, le NgModule qui déclare ce composant doit importer CommonModule ou DatePipe.
    DatePipe,                   // Ou `CommonModule`
    MatCardModule,              // Nécessaire pour utiliser <mat-card> et ses directives associées.
    LucideAngularModule,        // Pour les icônes <lucide-icon>.
    ReservationModalComponent,  // Pour pouvoir utiliser <app-reservation-modal> dans le template.
  ],
  standalone: true, // Assumons qu'il est autonome.

  templateUrl: './eventcard.component.html', // Chemin vers le template HTML de la carte d'événement.
  styleUrls: ['./eventcard.component.scss']  // Chemin vers les styles SCSS spécifiques à cette carte.
})
export class EventCardComponent {
  /**
   * @Input() event!: Evenement
   * @description L'objet `Evenement` dont les détails seront affichés sur cette carte.
   *              Le `!` (definite assignment assertion) indique à TypeScript que cette propriété
   *              sera toujours fournie par le composant parent avant toute utilisation.
   *              Alternativement, vous pourriez l'initialiser à `null` (ex: `event: Evenement | null = null;`)
   *              et gérer ce cas dans le template et le code.
   */
  @Input() event!: Evenement;

  /**
   * @property isReservationModalVisible
   * @description État local pour contrôler la visibilité de la modale `ReservationModalComponent`.
   *              `true` si la modale doit être affichée, `false` sinon.
   */
  isReservationModalVisible = false;

  // Le commentaire "Plus besoin de MatDialog" est pertinent si vous aviez précédemment
  // utilisé MatDialog (le service de dialogue d'Angular Material) pour ouvrir la modale
  // et que vous passez maintenant à une approche où la modale est un composant enfant
  // directement inclus dans le template et affiché conditionnellement.

  /**
   * @method openReservationModal
   * @description Ouvre la modale de réservation pour l'événement affiché sur cette carte.
   *              Généralement appelée par un clic sur un bouton "Réserver" dans le template
   *              de `eventcard.component.html`.
   */
  openReservationModal(): void {
    // 1. Vérification de sécurité : ne rien faire si la propriété `event` n'est pas définie.
    //    Bien que `event!` suggère qu'elle sera toujours là, une vérification défensive
    //    est une bonne pratique, surtout si l'initialisation alternative `event: Evenement | null = null`
    //    était utilisée.
    if (!this.event) {
      console.warn("EventCardComponent: Impossible d'ouvrir la modale de réservation car 'event' est indéfini.");
      return;
    }

    this.isReservationModalVisible = true;
  }

  /**
   * @method handleCloseReservationModal
   * @description Gère l'événement de fermeture émis par `ReservationModalComponent`.
   *              Appelée lorsque la modale est fermée par l'utilisateur (ex: clic sur "Annuler"
   *              ou icône de fermeture dans la modale).
   *              Dans le template de `EventCardComponent`:
   *              `<app-reservation-modal (closeModal)="handleCloseReservationModal()"></app-reservation-modal>`
   *              (Le nom de l'Output dans ReservationModalComponent pourrait être `close` ou `closeModal`).
   */
  handleCloseReservationModal(): void {
    this.isReservationModalVisible = false; // Cache la modale.
  }

  /**
   * @method handleReserveSuccess
   * @description Gère l'événement de succès de réservation émis par `ReservationModalComponent`.
   *              Appelée lorsque l'utilisateur a complété avec succès une réservation via la modale.
   * @param response La donnée émise par la modale lors du succès de la réservation.
   *                 Le type `any` est utilisé ici ; il serait préférable de le remplacer par le type
   *                 spécifique de la réponse (ex: la réservation créée, ou un message de succès).
   */
  handleReserveSuccess(response: any): void {
    console.log("EventCardComponent: Réservation réussie via la modale.", response);
    this.isReservationModalVisible = false; // Ferme la modale après le succès.
  }
}

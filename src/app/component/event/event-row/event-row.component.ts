import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common'; // CommonModule (qui exporte DatePipe) sera importé via `imports` si le composant est autonome.
import { LucideAngularModule } from 'lucide-angular';
import { EditEventModalComponent } from '../edit-event/edit-event.component';
import { Evenement } from '../../../model/evenement';
import { ParticipationEventModalComponent } from '../participation-event-modal/participation-event-modal.component';
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: '[app-event-row]', // Sélecteur d'attribut.
  // Utilisation : <tr app-event-row [evenement]="monEvent"></tr>
  //               <div app-event-row [evenement]="monEvent"></div>

  // standalone: true, // Supposons qu'il soit autonome pour la gestion des imports.
  imports: [
    // DatePipe doit être importé si utilisé dans le template.
    // CommonModule (qui exporte DatePipe, *ngIf, *ngFor) est souvent importé.
    // Pour utiliser DatePipe directement dans le template, il faut que CommonModule soit importé.
    // Si DatePipe est utilisé uniquement dans le .ts (via injection), il faut le mettre dans `providers`.
    // Mais ici, il est plus probable qu'il soit utilisé dans le template.
    // **Correction :** DatePipe est un pipe. S'il est utilisé dans le template, il doit être
    // importé par un module que ce composant importe (si autonome), ou par le NgModule
    // qui déclare ce composant. Si ce composant est autonome, il faut importer CommonModule.
    DatePipe,                   // Ou `CommonModule` qui inclut DatePipe
    LucideAngularModule,        // Pour les icônes
    EditEventModalComponent,    // Pour <app-edit-event> dans le template
    ParticipationEventModalComponent // Pour <app-participation-event-modal> dans le template
  ],
  standalone: true, // Assumons qu'il est autonome

  templateUrl: './event-row.component.html', // Template HTML pour afficher une ligne d'événement.
  styleUrls: ['./event-row.component.scss']  // Styles SCSS spécifiques à cette ligne.
})
export class EventRowComponent {
  // Injection des services.
  private swalService = inject(SweetAlertService); // Pour les confirmations de suppression.
  private cdr = inject(ChangeDetectorRef);           // Pour la détection de changements manuelle.

  /**
   * @Input() evenement!: Evenement
   * @description L'objet `Evenement` à afficher dans cette ligne.
   *              Le `!` (definite assignment assertion) indique à TypeScript que cette propriété
   *              sera toujours fournie par le composant parent via data binding
   *              avant d'être utilisée.
   */
  @Input() evenement!: Evenement;

  /**
   * @Output() deleteRequest
   * @description Événement émis vers le composant parent lorsque l'utilisateur demande
   *              la suppression (désactivation) de l'événement de cette ligne.
   *              Le parent (ex: une liste d'événements) écoutera cet événement pour
   *              effectuer l'appel API de suppression et mettre à jour la liste.
   *              La valeur émise est l'objet `Evenement` à supprimer.
   */
  @Output() deleteRequest = new EventEmitter<Evenement>();

  /**
   * @Output() eventUpdated
   * @description Événement émis vers le composant parent lorsque l'événement de cette ligne
   *              a été modifié avec succès via la modale d'édition.
   *              La valeur émise est l'objet `Evenement` mis à jour.
   *              Le parent peut l'utiliser pour rafraîchir l'affichage de cet événement.
   */
  @Output() eventUpdated = new EventEmitter<Evenement>();

  /**
   * @property isModalEditVisible
   * @description Contrôle la visibilité de la modale `EditEventModalComponent` spécifique à CET événement.
   *              Chaque ligne d'événement aura sa propre instance potentielle de modale d'édition.
   */
  isModalEditVisible = false;

  /**
   * @property isParticipationModalVisible
   * @description Contrôle la visibilité de la modale `ParticipationEventModalComponent`
   *              spécifique à CET événement.
   */
  isParticipationModalVisible = false;

  // --- Gestion Modale Édition spécifique à cette Ligne ---

  /**
   * @method ouvrirModalEditionDeLigne
   * @description Ouvre la modale `EditEventModalComponent` pour l'événement de cette ligne.
   *              Appelée par un bouton "Modifier" dans le template de `event-row.component.html`.
   */
  ouvrirModalEditionDeLigne(): void {
    this.isModalEditVisible = true; // Rend la modale d'édition visible.
    // `cdr.detectChanges()` est utilisé pour s'assurer que la vue est mise à jour
    // immédiatement, surtout si la stratégie de détection de changements OnPush est utilisée
    // par ce composant ou ses parents.
    this.cdr.detectChanges();
  }

  /**
   * @method fermerModalEditionDeLigne
   * @description Ferme la modale `EditEventModalComponent`.
   *              Appelée lorsque la modale d'édition émet un événement `close`.
   */
  fermerModalEditionDeLigne(): void {
    this.isModalEditVisible = false; // Cache la modale d'édition.
    this.cdr.detectChanges();
  }

  /**
   * @method handleSaveSuccessEditionDeLigne
   * @description Gère l'événement `saveSuccess` émis par la modale `EditEventModalComponent`
   *              lorsque l'événement de cette ligne a été sauvegardé avec succès.
   * @param evenementModifie L'objet `Evenement` mis à jour retourné par la modale.
   */
  handleSaveSuccessEditionDeLigne(evenementModifie: Evenement): void {
    console.log('EventRow: Édition réussie pour l_événement avec ID', evenementModifie.id, 'Nouvelles données:', evenementModifie);
    this.fermerModalEditionDeLigne(); // Ferme la modale d'édition.

    // Émet l'événement `eventUpdated` vers le composant parent.
    // Le parent (par exemple, EventAdminComponent qui gère la liste des événements)
    // peut alors mettre à jour ses propres données avec `evenementModifie`.
    this.eventUpdated.emit(evenementModifie);
  }

  // --- Gestion Modale Participation (similaire à la gestion d'édition) ---

  /**
   * @method ouvrirModalParticipation
   * @description Ouvre la modale `ParticipationEventModalComponent` pour l'événement de cette ligne.
   */
  ouvrirModalParticipation(): void {
    if (this.evenement) { // Vérifie que l'événement est défini avant d'ouvrir la modale.
      this.isParticipationModalVisible = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * @method handleCloseParticipationModal
   * @description Ferme la modale `ParticipationEventModalComponent`.
   */
  handleCloseParticipationModal(): void {
    this.isParticipationModalVisible = false;
    this.cdr.detectChanges();
  }

  // --- Logique de Demande de Suppression ---

  /**
   * @method requestDelete
   * @description Déclenche une demande de suppression (désactivation) pour l'événement de cette ligne.
   *              Affiche une boîte de dialogue de confirmation (SweetAlert) avant d'émettre
   *              l'événement `deleteRequest` vers le parent.
   */
  requestDelete(): void {
    // Utilise SweetAlertService pour une confirmation utilisateur.
    this.swalService.confirmAction(
      'Désactiver cet événement ?', // Titre de la confirmation
      `Êtes-vous sûr de vouloir désactiver l'événement "${this.evenement.nom}" ?`, // Message
      () => { // Callback exécutée si l'utilisateur confirme ("Oui, désactiver")
        // Émet l'événement `deleteRequest` avec l'objet `evenement` de cette ligne.
        // Le composant parent se chargera de faire l'appel API réel pour la suppression.
        this.deleteRequest.emit(this.evenement);
      },
      'Oui, désactiver' // Texte du bouton de confirmation
      // Optionnel: Ajouter un texte pour le bouton d'annulation si nécessaire pour le service swal.
    );
  }
}

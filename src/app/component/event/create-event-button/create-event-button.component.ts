import { ChangeDetectorRef, Component, EventEmitter, inject, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Evenement } from '../../../model/evenement';
import { EditEventModalComponent } from '../edit-event/edit-event.component';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-create-event-button', // Sélecteur CSS pour utiliser ce composant.
                                       // Exemple: <app-create-event-button (eventCreated)="onNewEvent($event)"></app-create-event-button>

  imports: [
    LucideAngularModule,        // Pour les icônes dans le bouton.
    EditEventModalComponent     // Pour pouvoir utiliser <app-edit-event-modal> dans le template.
  ],
  standalone: true, // Ajout pour clarifier l'utilisation de `imports` (si c'est le cas)

  templateUrl: './create-event-button.component.html', // Template HTML (probablement un bouton et la modale).
  styleUrl: './create-event-button.component.scss'    // Styles SCSS spécifiques.
})
export class CreateEventButtonComponent {
  /**
   * @Output() eventCreated
   * @description Événement émis vers le composant parent APRÈS la création réussie d'un nouvel événement
   *              via la modale `EditEventModalComponent`.
   *              Le parent peut s'abonner à cet événement pour réagir (ex: rafraîchir une liste d'événements).
   *              La valeur émise est l'objet `Evenement` nouvellement créé.
   */
  @Output() eventCreated = new EventEmitter<Evenement>();

  // Injection des services nécessaires via la fonction `inject`.
  private authService = inject(AuthService);         // Pour obtenir l'ID du club géré.
  private notification = inject(SweetAlertService);  // Pour afficher des notifications.
  private cdr = inject(ChangeDetectorRef);           // Pour la détection de changements manuelle.

  /**
   * @property isModalVisible
   * @description Booléen qui contrôle la visibilité de la modale `EditEventModalComponent`
   *              (qui est probablement déclarée et conditionnellement affichée dans le template HTML
   *              de `CreateEventButtonComponent` en utilisant `*ngIf="isModalVisible"`).
   */
  isModalVisible = false;

  /**
   * @property clubIdForModal
   * @description Stocke l'ID du club qui sera passé à la modale `EditEventModalComponent`.
   *              Cet ID est nécessaire pour savoir à quel club l'événement créé appartiendra.
   *              Initialisé à `null`.
   */
  clubIdForModal: number | null = null;

  /**
   * @method openCreateModal
   * @description Méthode appelée lorsque l'utilisateur clique sur le bouton "Créer un événement"
   *              (ou un nom similaire) dans le template de ce composant.
   *              Elle prépare et affiche la modale de création d'événement.
   */
  openCreateModal(): void {
    // 1. Récupération de l'ID du club géré par l'utilisateur actuellement connecté
    //    via `AuthService`. Cet ID est crucial pour la création de l'événement.
    this.clubIdForModal = this.authService.getManagedClubId();

    // 2. Vérification si l'ID du club a été trouvé.
    if (this.clubIdForModal === null) {
      // Si aucun ID de club n'est trouvé (ex: l'utilisateur n'est pas un manager de club),
      // on affiche une erreur et on n'ouvre pas la modale.
      console.error("CreateEventButton: Club ID non trouvé, impossible d'ouvrir la modale de création.");
      this.notification.show("Impossible d'ouvrir la création d'événement: ID du club manquant.", "error");
      return; // Sortie anticipée de la méthode.
    }

    // 3. Si l'ID du club est valide, on rend la modale visible.
    this.isModalVisible = true;

    // 4. Déclenchement manuel de la détection de changements (optionnel mais peut être utile).
    //    Si le composant parent ou ce composant utilise la stratégie de détection de changements `OnPush`,
    //    Angular pourrait ne pas mettre à jour la vue immédiatement après le changement de `isModalVisible`.
    //    `this.cdr.detectChanges()` force Angular à vérifier et mettre à jour la vue.
    //    Si la stratégie par défaut (`Default`) est utilisée, ce n'est généralement pas nécessaire.
    this.cdr.detectChanges();
  }

  /**
   * @method handleModalClose
   * @description Méthode appelée lorsque la modale `EditEventModalComponent` émet un événement
   *              indiquant qu'elle a été fermée (par exemple, par un clic sur un bouton "Fermer"
   *              ou sur une icône de fermeture dans la modale).
   *              Dans le template de `CreateEventButtonComponent` :
   *              `<app-edit-event-modal (close)="handleModalClose()"></app-edit-event-modal>`
   */
  handleModalClose(): void {
    this.isModalVisible = false; // Cache la modale.
    this.cdr.detectChanges();    // Déclenche la détection de changements si nécessaire.
  }

  /**
   * @method handleModalSaveSuccess
   * @description Méthode appelée lorsque la modale `EditEventModalComponent` émet un événement
   *              indiquant qu'un événement a été créé/sauvegardé avec succès.
   *              La modale émet l'objet `Evenement` nouvellement créé.
   *              Dans le template de `CreateEventButtonComponent` :
   *              `<app-edit-event-modal (saveSuccess)="handleModalSaveSuccess($event)"></app-edit-event-modal>`
   *
   * @param newEvent L'objet `Evenement` qui vient d'être créé par la modale.
   */
  handleModalSaveSuccess(newEvent: Evenement): void {
    console.log('CreateEventButton: Modale a sauvegardé avec succès:', newEvent);
    this.handleModalClose(); // Ferme la modale après la sauvegarde.

    // 1. Émission de l'événement `eventCreated` vers le composant parent.
    //    Le composant parent (qui utilise `<app-create-event-button>`) peut ainsi
    //    être notifié qu'un nouvel événement a été créé et prendre des mesures
    //    (ex: rafraîchir une liste d'événements, afficher une notification de succès).
    this.eventCreated.emit(newEvent);
  }
}

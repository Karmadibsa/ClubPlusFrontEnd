import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common'; // CommonModule (qui exporte DatePipe) sera importé.
import { RoleType } from '../../../model/role';
import { AuthService } from '../../../service/security/auth.service';
import { FormsModule } from '@angular/forms';
import { Membre } from '../../../model/membre';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-membre-detail-modal', // Sélecteur CSS pour utiliser ce composant.
  standalone: true,                    // Indique que c'est un composant autonome.
  imports: [
    LucideAngularModule,                // Pour les icônes.
    DatePipe,                           // Ou `CommonModule` qui inclut DatePipe.
    FormsModule                         // Pour [(ngModel)] sur le <select> des rôles.
  ],
  templateUrl: './membre-detail-modal.component.html', // Template HTML de la modale.
  styleUrl: './membre-detail-modal.component.scss'    // Styles SCSS spécifiques.
})
// Implémente OnChanges pour réagir aux changements des @Input 'membre' et 'isVisible'.
export class MembreDetailModalComponent implements OnChanges {

  // Injection de AuthService pour vérifier les permissions de l'utilisateur courant.
  authService = inject(AuthService);

  // --- INPUTS & OUTPUTS ---

  /**
   * @Input() isVisible
   * @description Contrôle la visibilité de la modale depuis le composant parent.
   */
  @Input() isVisible: boolean = false;

  /**
   * @Input() membre
   * @description L'objet `Membre` dont les détails sont affichés et dont le rôle peut être modifié.
   *              Peut être `null` si aucun membre n'est sélectionné pour affichage.
   */
  @Input() membre: Membre | null = null;

  /**
   * @Output() close
   * @description Événement émis vers le parent lorsque la modale demande à être fermée.
   */
  @Output() close = new EventEmitter<void>();

  /**
   * @Output() saveRole
   * @description Événement émis vers le parent lorsqu'un changement de rôle pour le membre
   *              est demandé (après confirmation par l'utilisateur).
   *              La valeur émise est un objet contenant `membreId` et `newRole`.
   *              Le parent se chargera de faire l'appel API pour modifier le rôle.
   */
  @Output() saveRole = new EventEmitter<{ membreId: number, newRole: RoleType }>();

  // --- PROPRIÉTÉS INTERNES ---

  /**
   * @property selectedRole
   * @description Le rôle actuellement sélectionné dans la liste déroulante (ou autre contrôle de sélection)
   *              pour le membre affiché.
   *              Lié via `[(ngModel)]` dans le template. Initialisé à `null`.
   */
  selectedRole: RoleType | null = null;

  /**
   * @property initialRole
   * @description Stocke le rôle initial du membre lors de l'ouverture de la modale ou du changement
   *              de membre. Utilisé pour déterminer si un changement a réellement été effectué
   *              et pour potentiellement réinitialiser la sélection.
   */
  initialRole: RoleType | null = null;

  // Les commentaires "Pas besoin de isCurrentUserAdmin" et "ngOnInit()" sont pertinents :
  // Il est préférable d'utiliser `authService.role` directement dans le template (ou via un getter)
  // pour vérifier les permissions, plutôt que de stocker un booléen `isCurrentUserAdmin`
  // qui pourrait devenir désynchronisé. `ngOnInit` n'est pas strictement nécessaire ici si
  // la logique principale est dans `ngOnChanges`.

  /**
   * @method ngOnChanges
   * @description Crochet de cycle de vie Angular appelé lorsque les @Input changent.
   *              Utilisé ici pour :
   *              1. Initialiser/Réinitialiser `selectedRole` et `initialRole` lorsque l'Input `membre`
   *                 change ou lorsque la modale devient visible avec un membre.
   *              2. Réinitialiser les rôles si la modale est fermée (`isVisible` devient `false`).
   * @param changes Un objet `SimpleChanges` contenant les modifications des @Input.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Condition pour mettre à jour les rôles si le membre change ou si la modale devient visible
    // ET qu'un membre est effectivement fourni.
    if (this.membre && (changes['membre'] || (changes['isVisible'] && changes['isVisible'].currentValue === true))) {
      // S'assure que le membre a bien une propriété 'role'.
      // Si `this.membre.role` pouvait être undefined, il faudrait le gérer (ex: `this.membre.role as RoleType | null`).
      // Mais si `Membre.role` est de type `RoleType`, c'est déjà bien typé.
      this.initialRole = this.membre.role;
      this.selectedRole = this.membre.role; // Pré-sélectionne le rôle actuel du membre.
      console.log('MembreDetailModal: ngOnChanges - Membre chargé/modifié. ID:', this.membre.id, 'Rôle initial/sélectionné:', this.initialRole);
    }

    // Condition pour réinitialiser l'état si la modale est fermée.
    // Utile pour que la modale soit "propre" à la prochaine ouverture.
    if (changes['isVisible'] && !changes['isVisible'].currentValue) { // Si isVisible devient false
      console.log('MembreDetailModal: ngOnChanges - Modale fermée, réinitialisation des rôles.');
      this.selectedRole = null;
      this.initialRole = null;
    }
  }

  /**
   * @method triggerSaveRole
   * @description Appelée lorsque l'utilisateur clique sur le bouton "Enregistrer" (ou "Modifier le rôle").
   *              Vérifie si un rôle a été sélectionné, s'il est différent du rôle initial,
   *              et si un membre est bien chargé. Si oui, émet l'événement `saveRole`.
   */
  triggerSaveRole(): void {
    // Vérifie les conditions avant d'émettre.
    if (this.membre && this.selectedRole && this.selectedRole !== this.initialRole) {
      console.log(`MembreDetailModal: Émission de l'événement saveRole - Membre ID: ${this.membre.id}, Nouveau Rôle: ${this.selectedRole}`);
      // Émet les informations nécessaires au parent pour qu'il effectue la mise à jour.
      this.saveRole.emit({ membreId: this.membre.id, newRole: this.selectedRole });
      // Optionnel : Fermer la modale après avoir émis l'événement de sauvegarde.
      // Cela dépend si le parent veut gérer la fermeture après la confirmation de l'API.
      // Si la modale doit se fermer immédiatement :
      // this.closeModal();
    } else if (this.selectedRole === this.initialRole) {
      console.log("MembreDetailModal: Aucun changement de rôle détecté. Fermeture de la modale.");
      // Si aucun changement, on peut simplement fermer la modale sans émettre saveRole.
      this.closeModal();
    } else {
      console.warn("MembreDetailModal: Tentative de sauvegarde de rôle invalide. Membre:", this.membre, "Rôle sélectionné:", this.selectedRole);
      // Potentiellement afficher une notification si l'état est invalide pour une sauvegarde.
    }
  }

  /**
   * @method closeModal
   * @description Émet l'événement `close` pour demander au parent de fermer la modale.
   */
  closeModal(): void {
    console.log("MembreDetailModal: Émission de l'événement close.");
    this.close.emit();
  }

  /**
   * @getter isSaveDisabled
   * @description Propriété calculée (getter) utilisée pour déterminer si le bouton
   *              "Enregistrer" doit être désactivé.
   *              Le bouton est désactivé si aucun rôle n'est sélectionné OU si le rôle
   *              sélectionné est le même que le rôle initial (aucun changement).
   * @returns {boolean} `true` si le bouton doit être désactivé, `false` sinon.
   */
  get isSaveDisabled(): boolean {
    return !this.selectedRole || this.selectedRole === this.initialRole;
  }
}

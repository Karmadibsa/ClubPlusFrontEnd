import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe } from '@angular/common'; // CommonModule (qui exporte DatePipe) sera importé.
import { Membre } from '../../../model/membre';
import { RoleType } from '../../../model/role';
import { MembreDetailModalComponent } from '../membre-detail-modal/membre-detail-modal.component';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: '[app-membre-row]',    // Sélecteur d'attribut.
  // Utilisation : <tr app-membre-row [membre]="monMembre"></tr>
  standalone: true,                 // Supposons qu'il soit autonome.
  imports: [
    LucideAngularModule,            // Pour les icônes.
    DatePipe,                       // Ou `CommonModule` qui inclut DatePipe.
    MembreDetailModalComponent      // Pour pouvoir utiliser <app-membre-detail-modal> dans le template.
  ],
  templateUrl: './membre-row.component.html', // Template HTML pour afficher une ligne de membre.
  styleUrls: ['./membre-row.component.scss']  // Styles SCSS spécifiques à cette ligne.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Si vous utilisez cette stratégie.
})
export class MembreRowComponent {
  // Injection de ChangeDetectorRef, utile si la stratégie OnPush est utilisée.
  private cdr = inject(ChangeDetectorRef);

  /**
   * @Input() membre!: Membre
   * @description L'objet `Membre` à afficher dans cette ligne.
   *              Le `!` (definite assignment assertion) indique que cette propriété
   *              sera toujours fournie par le composant parent.
   */
  @Input() membre!: Membre;

  /**
   * @Output() roleChangeRequested
   * @description Événement émis vers le composant parent lorsque l'utilisateur a demandé
   *              un changement de rôle via la modale `MembreDetailModalComponent` et que
   *              cette modale a émis son événement `saveRole`.
   *              Ce composant `MembreRowComponent` agit comme un intermédiaire pour relayer
   *              cette demande au parent de plus haut niveau (ex: un composant Dashboard ou GestionMembres).
   *              La valeur émise est un objet `{ membreId: number, newRole: RoleType }`.
   */
  @Output() roleChangeRequested = new EventEmitter<{ membreId: number, newRole: RoleType }>();

  /**
   * @property isModalVisible
   * @description État local pour contrôler la visibilité de la modale `MembreDetailModalComponent`
   *              spécifique à CETTE ligne de membre.
   */
  isModalVisible = false;

  /**
   * @method openDetailsModal
   * @description Ouvre la modale `MembreDetailModalComponent` pour le membre de cette ligne.
   *              Généralement appelée par un clic sur un bouton "Détails" ou "Modifier Rôle"
   *              dans le template de `membre-row.component.html`.
   */
  openDetailsModal(): void {
    // Vérifie que la propriété `membre` est bien définie avant d'ouvrir la modale.
    if (this.membre) {
      console.log(`MembreRow: Ouverture de la modale de détails pour le membre: ${this.membre.prenom} ${this.membre.nom} (ID: ${this.membre.id})`);
      this.isModalVisible = true; // Rend la modale visible.
      // `cdr.detectChanges()` force la mise à jour de la vue.
      // C'est particulièrement utile si ce composant ou ses parents utilisent
      // la stratégie de détection de changements `OnPush`, pour s'assurer
      // que le `*ngIf` (ou `@if`) qui affiche la modale est réévalué immédiatement.
      this.cdr.detectChanges();
    } else {
      console.warn("MembreRow: Tentative d'ouverture de la modale de détails, mais la propriété 'membre' est indéfinie.");
    }
  }

  /**
   * @method handleCloseModal
   * @description Ferme la modale `MembreDetailModalComponent`.
   *              Cette méthode est appelée lorsque la modale enfant (`MembreDetailModalComponent`)
   *              émet son propre événement `close`.
   *              Dans le template de `MembreRowComponent`:
   *              `<app-membre-detail-modal (close)="handleCloseModal()"></app-membre-detail-modal>`
   */
  handleCloseModal(): void {
    console.log(`MembreRow: Fermeture de la modale de détails pour le membre: ${this.membre?.prenom} ${this.membre?.nom}`);
    this.isModalVisible = false; // Cache la modale.
    this.cdr.detectChanges();    // Met à jour la vue.
  }

  /**
   * @method handleSaveRoleFromModal
   * @description Gère l'événement `saveRole` émis par la modale `MembreDetailModalComponent`.
   *              Lorsque la modale indique qu'un changement de rôle doit être sauvegardé,
   *              cette méthode relaie simplement cette information (l'objet événement)
   *              au composant parent de `MembreRowComponent` via l'Output `roleChangeRequested`.
   *              Elle ferme également la modale.
   *
   * @param event L'objet de données émis par `MembreDetailModalComponent`, contenant
   *              `{ membreId: number, newRole: RoleType }`.
   */
  handleSaveRoleFromModal(event: { membreId: number, newRole: RoleType }): void {
    console.log(`MembreRow: Événement 'saveRole' reçu de la modale. Membre ID: ${event.membreId}, Nouveau Rôle: ${event.newRole}. Émission vers le composant parent.`);
    // 1. Relaie l'événement et ses données au composant parent.
    //    Le parent (ex: un tableau de bord de gestion des membres) sera responsable
    //    d'appeler le service approprié (ex: MembreService) pour effectuer la modification
    //    du rôle via l'API.
    this.roleChangeRequested.emit(event);

    // 2. Ferme la modale après avoir émis la demande de sauvegarde.
    //    Le parent pourrait aussi choisir de fermer la modale seulement après confirmation
    //    de succès de l'API, mais la fermer ici donne un retour immédiat à l'utilisateur.
    this.handleCloseModal();
  }
}

import {ChangeDetectorRef, Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe} from '@angular/common';
import {Membre} from '../../../model/membre';
import {RoleType} from '../../../model/role';
import {MembreDetailModalComponent} from '../membre-detail-modal/membre-detail-modal.component';

@Component({
  selector: '[app-membre-row]',
  templateUrl: './membre-row.component.html',
  imports: [
    LucideAngularModule,
    DatePipe,
    MembreDetailModalComponent
  ],
  styleUrls: ['./membre-row.component.scss']
})
export class MembreRowComponent {
  private cdr = inject(ChangeDetectorRef); // Injecter ChangeDetectorRef pour OnPush

  @Input() membre!: Membre; // Le membre pour cette ligne (avec '!' car on s'attend à ce qu'il soit toujours fourni)

  // Nouvel Output: émet quand l'utilisateur confirme un changement de rôle dans la modale
  @Output() roleChangeRequested = new EventEmitter<{ membreId: number, newRole: RoleType }>();

  // État local pour contrôler la visibilité de la modale propre à cette ligne
  isModalVisible = false;

  /**
   * Ouvre la modale de détails/rôle pour le membre de CETTE ligne.
   */
  openDetailsModal(): void {
    if (this.membre) {
      console.log(`MembreRow: Ouverture modale pour ${this.membre.prenom} ${this.membre.nom}`);
      this.isModalVisible = true;
      this.cdr.detectChanges(); // Nécessaire pour mettre à jour l'affichage avec OnPush
    } else {
      console.warn("MembreRow: Tentative d'ouverture de modale sans données membre.");
    }
  }

  /**
   * Ferme la modale de détails/rôle. Appelé par l'output (close) de la modale.
   */
  handleCloseModal(): void {
    console.log(`MembreRow: Fermeture modale pour ${this.membre?.prenom}`);
    this.isModalVisible = false;
    this.cdr.detectChanges(); // Mettre à jour l'affichage
  }

  /**
   * Gère l'événement 'saveRole' émis par la modale.
   * Ré-émet l'événement vers le composant parent (Dashboard) pour traitement (appel API).
   * Ferme ensuite la modale.
   * @param event Données émises par la modale : { membreId: number, newRole: RoleType }
   */
  handleSaveRoleFromModal(event: { membreId: number, newRole: RoleType }): void {
    console.log(`MembreRow: Événement saveRole reçu de la modale pour Membre ID ${event.membreId}. Émission vers le parent.`);
    // Remonter l'information au composant parent (Dashboard)
    this.roleChangeRequested.emit(event);
    // Fermer la modale après avoir demandé la sauvegarde
    this.handleCloseModal();
  }
}

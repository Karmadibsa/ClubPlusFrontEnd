import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe, CommonModule } from '@angular/common';
import { Membre } from '../../../model/membre';
import { RoleType } from '../../../model/role';
import { MembreDetailModalComponent } from '../membre-detail-modal/membre-detail-modal.component';

/**
 * Affiche une seule ligne d'un membre dans un tableau.
 *
 * Ce composant est conçu pour être utilisé comme un attribut sur un élément `<tr>`.
 * Il gère l'affichage des informations d'un membre et l'ouverture/fermeture
 * de la modale de détails associée à cette ligne.
 *
 * @example
 * <tr app-membre-row
 * [membre]="monMembre"
 * (roleChangeRequested)="onRoleChange($event)">
 * </tr>
 */
@Component({
  selector: '[app-membre-row]',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MembreDetailModalComponent
  ],
  templateUrl: './membre-row.component.html',
  styleUrls: ['./membre-row.component.scss']
})
export class MembreRowComponent {

  /** L'objet Membre à afficher dans cette ligne. Requis. */
  @Input() membre!: Membre;

  /** Émis lorsqu'un changement de rôle est demandé depuis la modale. */
  @Output() roleChangeRequested = new EventEmitter<{ membreId: number, newRole: RoleType }>();

  /** Contrôle la visibilité de la modale de détails pour cette ligne. */
  public isModalVisible = false;

  private readonly cdr = inject(ChangeDetectorRef);

  /**
   * Ouvre la modale de détails pour le membre de cette ligne.
   */
  public openDetailsModal(): void {
    if (this.membre) {
      this.isModalVisible = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * Gère la demande de fermeture émise par la modale enfant.
   */
  public handleCloseModal(): void {
    this.isModalVisible = false;
    this.cdr.detectChanges();
  }

  /**
   * Relaye la demande de sauvegarde de rôle de la modale vers le composant parent.
   * @param event - L'objet contenant l'ID du membre et le nouveau rôle.
   */
  public handleSaveRoleFromModal(event: { membreId: number, newRole: RoleType }): void {
    this.roleChangeRequested.emit(event);
    this.handleCloseModal();
  }
}

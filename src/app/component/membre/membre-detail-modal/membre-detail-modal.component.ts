import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { DatePipe, CommonModule } from '@angular/common';
import { RoleType } from '../../../model/role';
import { AuthService } from '../../../service/security/auth.service';
import { FormsModule } from '@angular/forms';
import { Membre } from '../../../model/membre';

/**
 * Modale affichant les détails d'un membre et permettant la gestion de son rôle.
 *
 * Ce composant est principalement utilisé pour la consultation d'informations et
 * offre des fonctionnalités de modification de rôle réservées aux administrateurs.
 *
 * @example
 * <app-membre-detail-modal
 * [isVisible]="isDetailModalVisible"
 * [membre]="selectedMembre"
 * (close)="closeDetailModal()"
 * (saveRole)="onRoleSaved($event)">
 * </app-membre-detail-modal>
 */
@Component({
  selector: 'app-membre-detail-modal',
  standalone: true,
  imports: [
    LucideAngularModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './membre-detail-modal.component.html',
  styleUrls: ['./membre-detail-modal.component.scss']
})
export class MembreDetailModalComponent implements OnChanges {

  /** Contrôle la visibilité de la modale. */
  @Input() isVisible: boolean = false;

  /** Le membre dont les détails sont affichés. */
  @Input() membre: Membre | null = null;

  /** Émis lorsque la fermeture de la modale est demandée. */
  @Output() close = new EventEmitter<void>();

  /** Émis avec l'ID du membre et le nouveau rôle à sauvegarder. */
  @Output() saveRole = new EventEmitter<{ membreId: number, newRole: RoleType }>();

  /** Le rôle actuellement sélectionné dans le formulaire. */
  public selectedRole: RoleType | null = null;
  /** Le rôle initial du membre, utilisé pour détecter les changements. */
  private initialRole: RoleType | null = null;

  public readonly authService = inject(AuthService);

  /**
   * Détecte les changements sur les `Input` pour initialiser l'état de la modale.
   * @param changes - L'objet contenant les `@Input` modifiés.
   */
  ngOnChanges(changes: SimpleChanges): void {
    const isOpening = this.membre && (changes['membre'] || (changes['isVisible'] && this.isVisible));
    const isClosing = changes['isVisible'] && !changes['isVisible'].currentValue;

    if (isOpening) {
      this.initialRole = this.membre!.role;
      this.selectedRole = this.membre!.role;
    }

    if (isClosing) {
      this.selectedRole = null;
      this.initialRole = null;
    }
  }

  /**
   * Déclenche l'événement de sauvegarde du rôle si un changement valide a été effectué.
   */
  public triggerSaveRole(): void {
    if (this.isSaveDisabled) {
      if (this.selectedRole === this.initialRole) {
        this.closeModal(); // Pas de changement, on ferme simplement.
      }
      return;
    }

    this.saveRole.emit({ membreId: this.membre!.id, newRole: this.selectedRole! });
  }

  /**
   * Émet l'événement pour demander la fermeture de la modale.
   */
  public closeModal(): void {
    this.close.emit();
  }

  /**
   * Détermine si le bouton de sauvegarde doit être désactivé.
   * @returns {boolean} Vrai si aucun changement n'a été fait ou si la sélection est invalide.
   */
  get isSaveDisabled(): boolean {
    return !this.selectedRole || this.selectedRole === this.initialRole;
  }
}

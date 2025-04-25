import {Component, EventEmitter, inject, Input, Output, SimpleChanges} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe, NgIf} from '@angular/common';
import {RoleType} from '../../../model/role';
import {AuthService} from '../../../service/security/auth.service';

@Component({
  selector: 'app-membre-detail-modal',
  imports: [
    LucideAngularModule,
    NgIf,
    DatePipe
  ],
  templateUrl: './membre-detail-modal.component.html',
  styleUrl: './membre-detail-modal.component.scss'
})
export class MembreDetailModalComponent {
  authService = inject(AuthService)
  @Input() isVisible: boolean = false;
  @Input() membre: Membre | null = null;
  // --- NOUVEL INPUT : Indique si le *visualiseur* est admin ---
  @Input() isViewerAdmin: boolean = false;
  // --------------------------------------------------------
  @Output() close = new EventEmitter<void>();
  // --- NOUVEL OUTPUT : Émet l'ID et le nouveau rôle ---
  @Output() saveRoleChange = new EventEmitter<{ membreId: number, newRole: RoleType }>();
  // ----------------------------------------------------

  selectedRole: RoleType | null = null;
  // public UserRole = RoleType;

  // ngOnChanges(changes: SimpleChanges): void {
  //   // Initialiser/Réinitialiser selectedRole quand le membre change ou la modale s'ouvre
  //   if (changes['membre'] && this.membre) {
  //     this.selectedRole = this.membre.role;
  //   }
  //   if (changes['isVisible'] && !this.isVisible && this.membre) {
  //     // Réinitialise quand la modale se ferme pour éviter les états incohérents
  //     this.selectedRole = this.membre.role;
  //   }
  // }
  //
  // saveRole(): void {
  //   // La vérification des droits est implicite dans canSaveChanges
  //   if (this.membre && this.selectedRole) {
  //     this.saveRoleChange.emit({
  //       membreId: this.membre.id,
  //       newRole: this.selectedRole
  //     });
  //   } else {
  //     console.warn("Sauvegarde du rôle non permise ou données manquantes.");
  //     // Optionnel : Notifier l'utilisateur pourquoi le bouton est désactivé si ce n'est pas clair
  //     if(!this.authService.isCurrentUserAdmin()){
  //       console.log("Raison: l'utilisateur n'est pas admin.");
  //     } else if (!this.membre || this.membre.role === RoleType.ADMIN) {
  //       console.log("Raison: Le rôle de ce membre ne peut pas être modifié.");
  //     } else if (this.selectedRole === this.membre.role) {
  //       console.log("Raison: Le rôle sélectionné est identique au rôle actuel.");
  //     }
  //   }
  // }

  // closeModal(): void {
  //   this.close.emit();
  //   // Réinitialiser aussi ici
  //   if (this.membre) {
  //     this.selectedRole = this.membre.role;
  //   }
  closeModal() {

  }
}


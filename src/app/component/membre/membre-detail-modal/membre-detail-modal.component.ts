import {Component, EventEmitter, inject, Input, Output, SimpleChanges} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe} from '@angular/common';
import {RoleType} from '../../../model/role';
import {AuthService} from '../../../service/security/auth.service';
import {FormsModule} from '@angular/forms';
import {Membre} from '../../../model/membre';

@Component({
  selector: 'app-membre-detail-modal',
  imports: [
    LucideAngularModule,
    DatePipe,
    FormsModule
  ],
  templateUrl: './membre-detail-modal.component.html',
  styleUrl: './membre-detail-modal.component.scss'
})
export class MembreDetailModalComponent {

  authService = inject(AuthService);
  @Input() isVisible: boolean = false;
  @Input() membre: Membre | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saveRole = new EventEmitter<{ membreId: number, newRole: RoleType }>();

  selectedRole: RoleType | null = null;
  initialRole: RoleType | null = null; // Pour stocker le rôle initial

  // Pas besoin de isCurrentUserAdmin, on peut utiliser authService.role directement dans le template
  // isCurrentUserAdmin: boolean = false;

  // ngOnInit(): void {
  //   // this.isCurrentUserAdmin = this.authService.role === 'ROLE_ADMIN'; // Pas nécessaire
  // }

  ngOnChanges(changes: SimpleChanges): void {
    // Si le membre change PENDANT que c'est visible OU si la modale devient visible avec un membre
    if (this.membre && (changes['membre'] || changes['isVisible']?.currentValue === true)) {
      this.initialRole = this.membre.role;
      this.selectedRole = this.membre.role;
      console.log('Modal: ngOnChanges - Membre chargé:', this.membre.id, 'Rôle initial:', this.initialRole);
    }
    // Si la modale est fermée, réinitialiser (bonne pratique)
    if (changes['isVisible'] && !changes['isVisible'].currentValue) {
      this.selectedRole = null;
      this.initialRole = null;
    }
  }

  triggerSaveRole(): void {
    if (this.membre && this.selectedRole && this.selectedRole !== this.initialRole) {
      console.log(`Modal: Émission saveRole - Membre ID: ${this.membre.id}, Nouveau Rôle: ${this.selectedRole}`);
      this.saveRole.emit({membreId: this.membre.id, newRole: this.selectedRole});
      this.closeModal();
    } else {
      console.warn("Modal: Aucun changement de rôle valide à enregistrer.");
    }
  }

  closeModal(): void {
    console.log("Modal: Émission close");
    this.close.emit();
  }

  // Getter pour la condition [disabled]
  get isSaveDisabled(): boolean {
    return !this.selectedRole || this.selectedRole === this.initialRole;
  }

  // Nécessaire pour que le clic dans la modale ne ferme pas l'overlay
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}


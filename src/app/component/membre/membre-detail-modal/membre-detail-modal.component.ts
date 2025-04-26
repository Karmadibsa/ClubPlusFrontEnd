import {Component, EventEmitter, inject, Input, Output, SimpleChanges} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe, NgIf} from '@angular/common';
import {RoleType} from '../../../model/role';
import {AuthService} from '../../../service/security/auth.service';
import {FormsModule} from '@angular/forms';
import {Membre} from '../../../model/membre';

@Component({
  selector: 'app-membre-detail-modal',
  imports: [
    LucideAngularModule,
    NgIf,
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

  // Variable pour vérifier si l'utilisateur connecté est admin
  isCurrentUserAdmin: boolean = false;

  ngOnInit(): void {
    // Vérifier le rôle une seule fois à l'initialisation
    this.isCurrentUserAdmin = this.authService.role === 'ROLE_ADMIN'; // Ou 'ADMIN' selon votre AuthService
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si la visibilité passe à true ou si le membre change PENDANT que c'est visible
    if (this.membre && (changes['isVisible']?.currentValue === true || changes['membre'])) {
      this.initialRole = this.membre.role; // Stocker le rôle initial
      this.selectedRole = this.membre.role; // Initialiser la sélection
      console.log('Modal: ngOnChanges - Membre chargé:', this.membre, 'Rôle initial:', this.initialRole);
    }
    // Si la modale est fermée, on pourrait réinitialiser, mais c'est souvent géré par le parent
    if (changes['isVisible'] && !changes['isVisible'].currentValue) {
      this.selectedRole = null;
      this.initialRole = null;
    }
  }

  triggerSaveRole(): void {
    // Vérifications robustes
    if (this.membre && this.selectedRole && this.selectedRole !== this.initialRole) {
      console.log(`Modal: Émission saveRole - Membre ID: ${this.membre.id}, Nouveau Rôle: ${this.selectedRole}`);
      this.saveRole.emit({ membreId: this.membre.id, newRole: this.selectedRole });
    } else {
      console.warn("Modal: Aucun changement de rôle valide à enregistrer ou membre non défini.");
      // Optionnel : Notification à l'utilisateur
    }
  }

  closeModal(): void {
    console.log("Modal: Émission close");
    this.close.emit();
  }

  // Helper pour la condition [disabled] du bouton Enregistrer
  get isSaveDisabled(): boolean {
    return !this.selectedRole || this.selectedRole === this.initialRole;
  }
}


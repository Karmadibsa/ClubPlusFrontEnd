import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {LucideAngularModule} from "lucide-angular";
import {NgIf} from "@angular/common";
import {AuthService} from '../../../service/auth.service';

@Component({
  selector: 'app-edit-membre',
  imports: [
    FormsModule,
    LucideAngularModule,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './edit-membre.component.html',
  styleUrl: './edit-membre.component.scss'
})
export class EditMembreComponent {
  @Input() isVisible = false;
  @Input() membre: any = {};
  @Output() saveMembre = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  membreCopy: any = {};
  canChangeRole = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Créer une copie profonde pour éviter de modifier l'original
    this.membreCopy = JSON.parse(JSON.stringify(this.membre));

    // Vérifier si l'utilisateur peut modifier les rôles
    this.canChangeRole = this.authService.canChangeRoles();

    // Si on ne peut pas changer le rôle, on s'assure que la valeur reste la même
    if (!this.canChangeRole) {
      this.membreCopy.role = this.membre.role;
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  save(): void {
    // Collecter uniquement les champs modifiés
    const updates: any = {};

    // Vérifier chaque champ pour voir s'il a été modifié
    if (this.membreCopy.nom !== this.membre.nom) {
      updates.nom = this.membreCopy.nom;
    }
    if (this.membreCopy.prenom !== this.membre.prenom) {
      updates.prenom = this.membreCopy.prenom;
    }
    if (this.membreCopy.date_naissance !== this.membre.date_naissance) {
      updates.date_naissance = this.membreCopy.date_naissance;
    }
    if (this.membreCopy.email !== this.membre.email) {
      updates.email = this.membreCopy.email;
    }
    if (this.membreCopy.telephone !== this.membre.telephone) {
      updates.telephone = this.membreCopy.telephone;
    }
    // Vérifiez que cette condition fonctionne correctement
    if (this.canChangeRole && this.membreCopy.role !== this.membre.role) {
      updates.role = this.membreCopy.role;
      console.log('Role will be updated to:', updates.role); // Ajoutez ce log
    }
    if (this.membreCopy.numero_voie !== this.membre.numero_voie) {
      updates.numero_voie = this.membreCopy.numero_voie;
    }
    if (this.membreCopy.rue !== this.membre.rue) {
      updates.rue = this.membreCopy.rue;
    }
    if (this.membreCopy.codepostal !== this.membre.codepostal) {
      updates.codepostal = this.membreCopy.codepostal;
    }
    if (this.membreCopy.ville !== this.membre.ville) {
      updates.ville = this.membreCopy.ville;
    }

    // Ajouter l'ID pour faciliter le traitement dans le composant parent
    updates.id = this.membre.id;

    // Émettre les modifications au composant parent
    this.saveMembre.emit(updates);
    this.closeModal();
  }
}

import { Component, inject, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {SidebarComponent} from '../../../component/sidebar/sidebar.component';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-moncompte',
  standalone: true,
  templateUrl: './moncompte.component.html',
  imports: [
    SidebarComponent,
    ReactiveFormsModule,
    LucideAngularModule
  ],
  styleUrls: ['./moncompte.component.scss']
})
export class MonCompteComponent implements OnInit {
  http = inject(HttpClient);
  infoForm!: FormGroup;
  passwordForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    // Initialisation du formulaire des informations personnelles
    this.infoForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      date_naissance: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      numero_voie: ['', Validators.required],
      rue: ['', Validators.required],
      codepostal: ['', Validators.required],
      ville: ['', Validators.required]
    });

    // Initialisation du formulaire des mots de passe
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    });

    // Récupération des données utilisateur depuis l'API
    this.http.get<any>('http://localhost:8080/api/membres/1').subscribe(user => {
      this.infoForm.patchValue({
        nom: user.nom,
        prenom: user.prenom,
        date_naissance: user.date_naissance,
        email: user.email,
        telephone: user.telephone,
        numero_voie: user.numero_voie,
        rue: user.rue,
        codepostal: user.codepostal,
        ville: user.ville
      });
    });
  }

  updatePersonalInfo() {
    if (this.infoForm.invalid) {
      console.log('Le formulaire des informations personnelles est invalide.');
      return;
    }

    const updatedInfo = this.infoForm.value;
    this.http.patch('http://localhost:8080/api/membres/1', updatedInfo, { responseType: 'text' })
      .subscribe(response => {
        console.log('Informations mises à jour avec succès :', response);
      }, error => {
        console.error('Erreur lors de la mise à jour :', error);
      });
  }


  changePassword() {
    if (this.passwordForm.invalid) {
      console.log('Le formulaire des mots de passe est invalide.');
      return;
    }

    const passwords = this.passwordForm.value;
    if (passwords.new_password !== passwords.confirm_password) {
      console.log('Les mots de passe ne correspondent pas.');
      return;
    }

    this.http.patch('http://localhost:8080/api/auth/change_password', passwords).subscribe(response => {
      console.log('Mot de passe changé avec succès :', response);
    });
  }
}

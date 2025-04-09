import {Component, inject} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {NgIf} from '@angular/common';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Router } from '@angular/router'; // <-- 1. Importer Router


// Custom validator function for password matching
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  // Don't validate if either control is pristine or hasn't been initialized yet
  if (!password || !confirmPassword || password.pristine || confirmPassword.pristine) {
    return null;
  }

  // Return error if passwords don't match
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-inscription-club',
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './inscription-club.component.html',
  styleUrl: './inscription-club.component.scss'
})
export class InscriptionClubComponent {
  registrationForm: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly apiUrl = 'http://localhost:8080/api/club/inscription';

  constructor() {
    this.registrationForm = this.fb.group({}); // Initialisation temporaire
  }

  ngOnInit(): void {
    // Pré-remplissage du formulaire avec les données de test [1]
    this.registrationForm = this.fb.group({
      // --- Club Details ---
      nom: ['Club Test', Validators.required], // [1]
      date_creation: ['2020-01-01', Validators.required], // [1]
      numero_voie: ['123', Validators.required], // [1]
      rue: ['Rue de Test', Validators.required], // [1]
      codepostal: ['75001', Validators.required], // [1]
      ville: ['Paris', Validators.required], // [1]
      telephone: ['0102030405', Validators.required], // [1]
      email: ['test@club.com', [Validators.required, Validators.email]], // [1]

      // --- Admin Details (Nested Group) ---
      admin: this.fb.group({
        nom: ['AdminTest', Validators.required], // [1]
        prenom: ['Jean', Validators.required], // [1]
        date_naissance: ['1990-05-15', Validators.required], // [1]
        // Admin's Address
        numero_voie: ['123', Validators.required], // [1]
        rue: ["Rue de l'Admin", Validators.required], // [1]
        codepostal: ['75001', Validators.required], // [1]
        ville: ['Paris', Validators.required], // [1]
        // Admin's Contact
        telephone: ['0607080910', Validators.required], // [1]
        email: ['admin@test.com', [Validators.required, Validators.email]], // [1]
        // Password Group (nested within admin)
        passwordGroup: this.fb.group({
          password: ['password123', [Validators.required, Validators.minLength(6)]], // [1]
          confirmPassword: ['password123', Validators.required] // [1]
        }, { validators: passwordMatchValidator })
      })
    });
  }

  // Getters pour simplifier l'accès dans le template et gérer la nullité potentielle
  // (C'est une bonne pratique pour éviter les erreurs "Object is possibly 'null'")
  getControl(name: string): AbstractControl | null {
    return this.registrationForm.get(name);
  }

  getAdminControl(name: string): AbstractControl | null {
    return this.registrationForm.get(['admin', name]); // Accès imbriqué
  }

  getAdminPasswordGroup(): AbstractControl | null {
    return this.registrationForm.get(['admin', 'passwordGroup']);
  }

  getAdminPasswordControl(name: string): AbstractControl | null {
    return this.registrationForm.get(['admin', 'passwordGroup', name]);
  }

  onSubmit(): void {
    this.errorMessage = null;

    // *** CORRECTION PRINCIPALE ***
    // Marquer tous les champs comme 'touched' AVANT la vérification de validité [4]
    this.registrationForm.markAllAsTouched();

    if (this.registrationForm.valid && !this.isLoading) {
      this.isLoading = true;
      // Construction du payload (identique à la réponse précédente)
      const formValue = this.registrationForm.getRawValue();
      const payload = { /* ... structure JSON ... */
        nom: formValue.nom,
        date_creation: formValue.date_creation,
        numero_voie: formValue.numero_voie,
        rue: formValue.rue,
        codepostal: formValue.codepostal,
        ville: formValue.ville,
        telephone: formValue.telephone,
        email: formValue.email,
        admin: {
          nom: formValue.admin.nom,
          prenom: formValue.admin.prenom,
          date_naissance: formValue.admin.date_naissance,
          numero_voie: formValue.admin.numero_voie,
          rue: formValue.admin.rue,
          codepostal: formValue.admin.codepostal,
          ville: formValue.admin.ville,
          telephone: formValue.admin.telephone,
          email: formValue.admin.email,
          password: formValue.admin.passwordGroup.password
        }
      };

      console.log('Sending Payload:', JSON.stringify(payload, null, 2));

      // Appel HTTP (identique à la réponse précédente)
      this.http.post<any>(this.apiUrl, payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Inscription réussie!', response);
          alert('Inscription réussie !');
          this.router.navigate(['/connexion']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Erreur lors de l\'inscription:', error);
          this.errorMessage = `Erreur lors de l'inscription: ${error.statusText} (${error.status})`;
          // ... gestion d'erreur détaillée ...
        }
      });

    } else if (!this.isLoading) {
      console.error('Le formulaire est invalide. Veuillez vérifier les champs.');
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
    }
  }
}

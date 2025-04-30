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
import {Router, RouterLink} from '@angular/router';
import {passwordMatchValidator} from '../../../service/validator/password-match.validator';
import {NotificationService} from '../../../service/notification.service'; // <-- 1. Importer Router


@Component({
  selector: 'app-inscription-club',
  imports: [
    FormsModule,
    NgIf,
    ReactiveFormsModule,
    RouterLink
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
  private notification = inject(NotificationService);

  readonly apiUrl = 'http://localhost:8080/api/clubs/inscription';

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
          password: ['password', [Validators.required, Validators.minLength(8)]], // [1]
          confirmPassword: ['password', Validators.required] // [1]
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
      const payload = {
        nom: formValue.nom,
        date_creation: formValue.date_creation,
        numero_voie: formValue.numero_voie,
        rue: formValue.rue,
        codepostal: formValue.codepostal,
        ville: formValue.ville,
        telephone: formValue.telephone,
        email: formValue.email, // Email du club
        admin: {
          nom: formValue.admin.nom,
          prenom: formValue.admin.prenom,
          date_naissance: formValue.admin.date_naissance,
          numero_voie: formValue.admin.numero_voie, // Adresse admin
          rue: formValue.admin.rue,
          codepostal: formValue.admin.codepostal,
          ville: formValue.admin.ville,
          telephone: formValue.admin.telephone, // Tel admin
          email: formValue.admin.email, // Email admin
          // Extraire UNIQUEMENT le mot de passe, pas la confirmation
          password: formValue.admin.passwordGroup.password
        }
      };

      console.log('Sending Payload:', JSON.stringify(payload, null, 2));

      // Appel HTTP (identique à la réponse précédente)
      this.http.post<any>(this.apiUrl, payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Inscription réussie!', response);
          // Utiliser NotificationService pour le succès
          this.notification.show('Club et administrateur inscrits avec succès !', 'valid'); // Utiliser 'success'
          this.router.navigate(['/connexion']); // Rediriger vers la connexion
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Erreur lors de l\'inscription:', error);
          let errorMsg = `Une erreur serveur est survenue (${error.status}). Veuillez réessayer plus tard.`;

          // Gestion détaillée des erreurs (similaire à l'inscription membre)
          if (error.status === 409) { // Conflit (ex: email club ou admin déjà utilisé)
            errorMsg = error.error?.message || error.error || "Un email fourni est peut-être déjà utilisé.";
          } else if (error.status === 400) { // Mauvaise requête (validation backend échouée)
            errorMsg = error.error?.message || error.error || "Données invalides. Vérifiez les informations saisies.";
          } else if (error.error && typeof error.error === 'string') {
            errorMsg = `Erreur ${error.status}: ${error.error}`;
          } else if (error.error && error.error.message) {
            errorMsg = `Erreur ${error.status}: ${error.error.message}`;
          } // Ajouter d'autres cas si nécessaire (403, etc.)

          // Utiliser NotificationService pour l'erreur
          this.notification.show(errorMsg, 'error');
        }
      });
    }
  }}

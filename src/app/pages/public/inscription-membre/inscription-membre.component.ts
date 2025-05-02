import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {NotificationService} from '../../../service/notification.service';
import {Membre} from '../../../model/membre';
import {NgClass} from '@angular/common';
import {PasswordValidators} from '../../../service/validator/password.validator';

@Component({
  selector: 'app-inscription-membre',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgClass
  ],
  templateUrl: './inscription-membre.component.html',
  styleUrl: './inscription-membre.component.scss'
})
export class InscriptionMembreComponent {
  // --- Injections et Propriétés ---
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notification = inject(NotificationService);


  memberRegistrationForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  readonly baseApiUrl = 'http://localhost:8080/api/auth';

  // --- Initialisation ---
  ngOnInit(): void {
    this.memberRegistrationForm = this.fb.group({
      // Champs pour le corps JSON (payload)
      nom: ['TestNom', Validators.required],
      prenom: ['TestPrenom', Validators.required],
      date_naissance: ['2000-01-01', Validators.required],
      numero_voie: ['123', Validators.required],
      rue: ['Rue de Test', Validators.required],
      codepostal: ['75001', Validators.required],
      ville: ['Paris', Validators.required],
      telephone: ['0601020304', Validators.required],
      email: ['test.email@example.com', [Validators.required, Validators.email]],
      // 2. UTILISER LE NOUVEAU VALIDATEUR pour le mot de passe
      password: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity() // Remplace minLength, maxLength, pattern
      ]],
      // 5. METTRE A JOUR valeur initiale de confirmPassword
      confirmPassword: ['', [Validators.required]], // Initialisé à vide
      // Champ séparé pour construire l'URL
      codeClub: ['CLUB-0001', Validators.required]
    }, {
      // 3. UTILISER LE NOUVEAU VALIDATEUR pour la correspondance
      validators: PasswordValidators.passwordMatch('password', 'confirmPassword')
    });
  }

  // --- Getters (utiles pour le template) ---
  get passwordControl() {
    return this.memberRegistrationForm.get('password');
  }

  // 6. AJOUTER un getter pour confirmPassword
  get confirmPasswordControl() {
    return this.memberRegistrationForm.get('confirmPassword');
  }

  // --- Logique de Soumission (pas de changement nécessaire ici) ---
  registerMember(): void {
    this.memberRegistrationForm.markAllAsTouched();

    if (this.memberRegistrationForm.invalid) {
      let errorMsg = "Veuillez remplir correctement tous les champs requis.";
      // La vérification de passwordMismatch reste valide car elle vient du validateur de groupe
      if (this.memberRegistrationForm.errors?.['passwordMismatch']) {
        errorMsg = "Les mots de passe ne correspondent pas.";
      } else if (this.passwordControl?.invalid) {
        // On pourrait affiner mais ce message générique couvre les erreurs de complexité
        errorMsg = "Veuillez vérifier les informations saisies, notamment le mot de passe.";
      }
      this.notification.show(errorMsg, 'error');
      return;
    }

    this.isLoading = true;
    const codeClubValue = this.memberRegistrationForm.get('codeClub')?.value;
    if (!codeClubValue) {
      this.notification.show("Erreur interne : Le code club n'a pas pu être récupéré.", 'error');
      this.isLoading = false;
      return;
    }
    console.log('Code Club extrait:', codeClubValue);

    const fullApiUrl = `${this.baseApiUrl}/inscription?codeClub=${codeClubValue}`;
    console.log('Appel API vers:', fullApiUrl);

    const formValue = { ...this.memberRegistrationForm.value };
    delete formValue.codeClub;
    delete formValue.confirmPassword; // Assurez-vous que confirmPassword est bien supprimé aussi
    const payload: MembrePayload = formValue;
    console.log('Payload JSON envoyé:', JSON.stringify(payload, null, 2));

    this.http.post<Membre>(fullApiUrl, payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Inscription réussie ! Réponse:', response);
        this.notification.show('Membre inscrit avec succès ! Vous pouvez maintenant vous connecter.', 'valid');
        this.router.navigate(['/connexion']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Erreur lors de l\'inscription:', error);
        let errorMsg = `Une erreur serveur est survenue (${error.status}). Veuillez réessayer plus tard.`;

        if (error.status === 404) {
          errorMsg = "Le club spécifié est introuvable ou l'URL d'inscription est incorrecte.";
        } else if (error.status === 409) {
          errorMsg = error.error?.message || error.error || "Cet email est peut-être déjà utilisé.";
        } else if (error.status === 400) {
          // Le backend devrait renvoyer les erreurs de validation (ex: format email, complexité mdp non respectée APRES soumission)
          errorMsg = error.error?.message || error.error?.errors || error.error || "Données invalides. Vérifiez les informations saisies.";
          // Si le backend renvoie un tableau d'erreurs, vous pourriez l'afficher
          if (Array.isArray(error.error?.errors)) {
            errorMsg += " Détails: " + error.error.errors.join(', ');
          }
        } else if (error.error && typeof error.error === 'string') {
          errorMsg = `Erreur ${error.status}: ${error.error}`;
        } else if (error.error && error.error.message) {
          errorMsg = `Erreur ${error.status}: ${error.error.message}`;
        }
        this.notification.show(errorMsg, 'error');
      }
    });
  }
}

// --- Interface Payload (inchangée) ---
interface MembrePayload {
  nom: string;
  prenom: string;
  date_naissance: string;
  numero_voie: string;
  rue: string;
  codepostal: string;
  ville: string;
  telephone: string;
  email: string;
  password?: string;
}

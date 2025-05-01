import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {NotificationService} from '../../../service/notification.service';
import {passwordMatchValidator} from '../../../service/validator/password-match.validator';
import {Membre} from '../../../model/membre';

@Component({
  selector: 'app-inscription-membre',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './inscription-membre.component.html',
  styleUrl: './inscription-membre.component.scss'
})
export class InscriptionMembreComponent {
  // --- Injections et Propriétés ---
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private router = inject(Router); // Injecter si redirection utilisée
  private notification = inject(NotificationService); // <-- Injecter NotificationService

  memberRegistrationForm!: FormGroup; // Le formulaire réactif
  isLoading = false;                  // Pour l'état de chargement
  errorMessage: string | null = null; // Pour afficher les erreurs

  // URL de base de l'API (vérifiez le chemin '/membres')
  readonly baseApiUrl = 'http://localhost:8080/api/auth';

  // --- Initialisation ---
  ngOnInit(): void {
    // Pré-remplissage du formulaire avec les données de test [1]
    this.memberRegistrationForm = this.fb.group({
      // Champs pour le corps JSON (payload)
      nom: ['TestNom', Validators.required], // [1]
      prenom: ['TestPrenom', Validators.required], // [1]
      date_naissance: ['2000-01-01', Validators.required], // [1]
      numero_voie: ['123', Validators.required], // [1]
      rue: ['Rue de Test', Validators.required], // [1]
      codepostal: ['75001', Validators.required], // [1]
      ville: ['Paris', Validators.required], // [1]
      telephone: ['0601020304', Validators.required], // [1]
      email: ['test.email@example.com', [Validators.required, Validators.email]], // [1]
      password: ['password', [Validators.required, Validators.minLength(8)]], // [1]
      confirmPassword: ['password', [Validators.required]],
      // Champ séparé pour construire l'URL, mais présent dans le formulaire
      codeClub: ['CLUB-0001', Validators.required] // [1]
    }, {
      validators: passwordMatchValidator
    });
  }


  // --- Logique de Soumission ---
  registerMember(): void {
    this.memberRegistrationForm.markAllAsTouched(); // Marquer tous les champs pour afficher les erreurs

    // Vérifier la validité du formulaire Angular
    if (this.memberRegistrationForm.invalid) {
      let errorMsg = "Veuillez remplir correctement tous les champs requis.";
      if (this.memberRegistrationForm.errors?.['passwordMismatch']) {
        errorMsg = "Les mots de passe ne correspondent pas.";
      }
      // Utilisation de NotificationService
      this.notification.show(errorMsg, 'error'); // Ou 'warning' selon votre service
      return;
    }

    this.isLoading = true; // Démarrer l'indicateur de chargement

    // 1. Extraire le codeClub du formulaire
    const codeClubValue = this.memberRegistrationForm.get('codeClub')?.value;
    // Sécurité : Vérifier si codeClubValue est bien présent (normalement garanti par Validators.required)
    if (!codeClubValue) {
      this.notification.show("Erreur interne : Le code club n'a pas pu être récupéré.", 'error');
      this.isLoading = false;
      return;
    }
    console.log('Code Club extrait:', codeClubValue);

    // 2. Construire l'URL complète de l'API
    const fullApiUrl = `${this.baseApiUrl}/inscription?codeClub=${codeClubValue}`;
    console.log('Appel API vers:', fullApiUrl);
    console.log(codeClubValue);

    // 3. Préparer le corps (payload) JSON : Copier les valeurs du formulaire SAUF codeClub
    const formValue = { ...this.memberRegistrationForm.value }; // Copie
    delete formValue.codeClub; // Suppression de la clé codeClub de la copie
    delete formValue.confirmPassword;
    const payload: MembrePayload = formValue; // Le reste correspond à l'interface
    console.log('Payload JSON envoyé:', JSON.stringify(payload, null, 2));

    // 4. Effectuer l'appel HTTP POST
    this.http.post<Membre>( // Attendre un objet Membre en réponse
      fullApiUrl,          // URL construite avec codeClub
      payload               // Corps JSON sans codeClub
    ).subscribe({
      // Cas Succès (HTTP 2xx)
      next: (response) => {
        this.isLoading = false;
        console.log('Inscription réussie ! Réponse:', response);
        // Utilisation de NotificationService pour le succès
        this.notification.show('Membre inscrit avec succès ! Vous pouvez maintenant vous connecter.', 'valid');
        this.router.navigate(['/connexion']);
      },
      // Cas Erreur (HTTP 4xx, 5xx, réseau...)
      error: (error: HttpErrorResponse) => {
        this.isLoading = false; // Arrêter le chargement
        console.error('Erreur lors de l\'inscription:', error);
        let errorMsg = `Une erreur serveur est survenue (${error.status}). Veuillez réessayer plus tard.`;

        // Tenter d'afficher un message d'erreur pertinent
        if (error.status === 404) {
          errorMsg = "Le club spécifié est introuvable ou l'URL d'inscription est incorrecte.";
        } else if (error.status === 409) { // Conflit
          errorMsg = error.error?.message || error.error || "Cet email est peut-être déjà utilisé.";
        } else if (error.status === 400) { // Mauvaise requête
          errorMsg = error.error?.message || error.error || "Données invalides. Vérifiez les informations saisies.";
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
  password?: string; // Le backend l'attend dans le corps ici
}

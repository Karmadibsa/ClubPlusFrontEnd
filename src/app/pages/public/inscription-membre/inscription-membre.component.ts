import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-inscription-membre',
  imports: [
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './inscription-membre.component.html',
  styleUrl: './inscription-membre.component.scss'
})
export class InscriptionMembreComponent {
  // --- Injections et Propriétés ---
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private router = inject(Router); // Injecter si redirection utilisée

  memberRegistrationForm!: FormGroup; // Le formulaire réactif
  isLoading = false;                  // Pour l'état de chargement
  errorMessage: string | null = null; // Pour afficher les erreurs

  // URL de base de l'API (vérifiez le chemin '/membres')
  readonly baseApiUrl = 'http://localhost:8080/api/membres';

  // --- Initialisation ---
  ngOnInit(): void {
    // Pré-remplissage du formulaire avec les données de test [1]
    this.memberRegistrationForm = this.fb.group({
      // Champs pour le corps JSON (payload)
      nom: ['TestNom', Validators.required], // [1]
      prenom: ['TestPrenom', Validators.required], // [1]
      date_naissance: ['1990-01-01', Validators.required], // [1]
      numero_voie: ['123', Validators.required], // [1]
      rue: ['Rue de Test', Validators.required], // [1]
      codepostal: ['75001', Validators.required], // [1]
      ville: ['Paris', Validators.required], // [1]
      telephone: ['0601020304', Validators.required], // [1]
      email: ['test.email@example.com', [Validators.required, Validators.email]], // [1]
      password: ['password123', [Validators.required, Validators.minLength(6)]], // [1]

      // Champ séparé pour construire l'URL, mais présent dans le formulaire
      codeClub: ['CL0001', Validators.required] // [1]
    });
  }


  // --- Logique de Soumission ---
  registerMember(): void {
    this.errorMessage = null; // Réinitialiser les erreurs précédentes
    this.memberRegistrationForm.markAllAsTouched(); // Marquer tous les champs pour afficher les erreurs

    // Vérifier la validité du formulaire Angular
    if (this.memberRegistrationForm.invalid) {
      this.errorMessage = "Veuillez remplir tous les champs requis, y compris le code du club.";
      return; // Ne pas continuer si invalide
    }

    this.isLoading = true; // Démarrer l'indicateur de chargement

    // 1. Extraire le codeClub du formulaire
    const codeClubValue = this.memberRegistrationForm.get('codeClub')?.value;
    // Sécurité : Vérifier si codeClubValue est bien présent (normalement garanti par Validators.required)
    if (!codeClubValue) {
      this.errorMessage = "Erreur interne : Le code club n'a pas pu être récupéré du formulaire.";
      this.isLoading = false;
      return;
    }
    console.log('Code Club extrait:', codeClubValue);

    // 2. Construire l'URL complète de l'API
    const fullApiUrl = `${this.baseApiUrl}/inscription/${codeClubValue}`;
    console.log('Appel API vers:', fullApiUrl);

    // 3. Préparer le corps (payload) JSON : Copier les valeurs du formulaire SAUF codeClub
    const formValue = { ...this.memberRegistrationForm.value }; // Copie
    delete formValue.codeClub; // Suppression de la clé codeClub de la copie
    const payload: MembrePayload = formValue; // Le reste correspond à l'interface
    console.log('Payload JSON envoyé:', JSON.stringify(payload, null, 2));

    // 4. Effectuer l'appel HTTP POST
    this.http.post<Membre>( // Attendre un objet Membre en réponse
      fullApiUrl,          // URL construite avec codeClub
      payload               // Corps JSON sans codeClub
    ).subscribe({
      // Cas Succès (HTTP 2xx)
      next: (response) => {
        this.isLoading = false; // Arrêter le chargement
        console.log('Inscription réussie ! Réponse:', response);
        alert('Membre inscrit avec succès !'); // Message simple de succès
        this.router.navigate(['/connexion']); // Ou '/login' selon votre route
      },
      // Cas Erreur (HTTP 4xx, 5xx, réseau...)
      error: (error: HttpErrorResponse) => {
        this.isLoading = false; // Arrêter le chargement
        console.error('Erreur lors de l\'inscription:', error);

        // Tenter d'afficher un message d'erreur pertinent
        if (error.status === 404) {
          this.errorMessage = "Le club correspondant au code fourni n'a pas été trouvé ou l'endpoint est incorrect.";
        } else if (error.error && typeof error.error === 'string') {
          // Si le backend renvoie une simple chaîne d'erreur
          this.errorMessage = `Erreur ${error.status}: ${error.error}`;
        } else if (error.error && error.error.message) {
          // Si le backend renvoie un objet JSON avec une propriété 'message' (courant avec Spring)
          this.errorMessage = `Erreur ${error.status}: ${error.error.message}`;
        } else {
          // Message générique
          this.errorMessage = `Une erreur est survenue (${error.status}). Veuillez réessayer.`;
        }
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

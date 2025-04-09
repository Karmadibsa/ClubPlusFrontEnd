import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    NgIf,
    LucideAngularModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
// --- Injections ---
  private fb = inject(FormBuilder);
  private router = inject(Router); // Injecté même si non utilisé pour l'instant

  // --- Propriétés ---
  loginForm!: FormGroup; // Le formulaire réactif
  errorMessage: string | null = null; // Pour les futures erreurs
  // Pour gérer l'affichage du mot de passe (non implémenté ici, juste la variable)
  passwordFieldType: string = 'password';

  // --- Initialisation du formulaire ---
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Champ email requis + format email
      password: ['', Validators.required],                // Champ mot de passe requis
      remember: [false] // Checkbox "Se souvenir de moi", valeur initiale false
    });
  }

  // --- Méthode de soumission (vide pour l'instant) ---
  onSubmit(): void {
    this.errorMessage = null; // Reset error on new submit attempt
    this.loginForm.markAllAsTouched(); // Mark fields to show errors if invalid

    if (this.loginForm.invalid) {
      console.log("Formulaire invalide");
      this.errorMessage = "Veuillez vérifier les informations saisies.";
      return;
    }

    // À ce stade, le formulaire est valide (syntaxiquement)
    console.log("Formulaire prêt à être soumis (logique à implémenter)");
    console.log("Valeurs:", this.loginForm.value);

    // *** ICI viendra la logique d'appel API et de gestion de la réponse ***
    // Exemple:
    // this.authService.login(this.loginForm.value.email, this.loginForm.value.password).subscribe(...)
  }

  // --- Méthode pour basculer l'affichage du mot de passe (logique de base) ---
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    // Idéalement, il faudrait aussi changer l'icône ici
  }
}

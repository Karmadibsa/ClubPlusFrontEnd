import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/security/auth.service';
import {SweetAlertService} from '../../../service/sweet-alert.service';
import {PasswordValidators} from '../../../service/validator/password.validator'; // Ajustez le chemin

// Validator personnalisé (hors de la classe du composant pour éviter de le reconstruire à chaque changement)
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true }; // Nommez l'erreur 'passwordMismatch' pour plus de clarté
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'] // Adaptez ou supprimez le fichier si pas de styles spécifiques
})
export class ResetPasswordComponent implements OnInit {
  // Injection des dépendances
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(SweetAlertService)

  // Propriétés du composant
  resetPasswordForm!: FormGroup; // Formulaire réactif
  token: string | null = null;     // Token extrait de l'URL

  // États pour contrôler l'affichage et la logique
  isTokenValidating = true; // Indique si le token est en cours de validation
  isLoading = false;         // Indique si le formulaire est en cours de soumission

  // Messages (initialisés à null pour qu'ils ne s'affichent pas par défaut)
  formErrorMessage: string | null = null; // Message d'erreur général du formulaire
  tokenErrorMessage: string | null = null; // Message d'erreur lié au token
  successMessage: string | null = null;   // Message de succès

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity() // Utilisation du validateur de la classe
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: PasswordValidators.passwordMatch('newPassword', 'confirmPassword') });

    // Récupération du token depuis les paramètres de requête de l'URL
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token'); // Récupérer le token

      if (this.token) {
        this.validateToken(this.token); // Valider le token (optionnel - peut être fait uniquement lors de la soumission)
      } else {
        this.tokenErrorMessage = "Le lien de réinitialisation est invalide ou incomplet."; // Message d'erreur si le token est manquant
        this.isTokenValidating = false; // On arrête la vérification
      }
    });
  }

  // Méthode pour valider le token auprès du backend (optionnel, pour une meilleure UX)
  validateToken(token: string): void {
    this.isTokenValidating = true; // On affiche l'indicateur de chargement

    this.authService.validateResetToken(token).subscribe({ // Appel au service pour valider le token
      next: () => {
        this.isTokenValidating = false; // Validation réussie, on cache l'indicateur
        this.tokenErrorMessage = null;  // On efface les erreurs précédentes
      },
      error: (error) => {
        this.isTokenValidating = false; // Validation échouée, on cache l'indicateur
        this.tokenErrorMessage = "Le lien de réinitialisation est invalide, a expiré ou a déjà été utilisé."; // Message d'erreur
        console.error('Token validation failed:', error); // Log pour le débogage
      }
    });
  }

  // Getters pour accéder facilement aux contrôles du formulaire (et simplifier le template)
  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  // Méthode appelée lors de la soumission du formulaire
  onSubmit(): void {
    this.formErrorMessage = null; // On réinitialise le message d'erreur du formulaire
    this.successMessage = null;   // On réinitialise le message de succès

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched(); // Afficher les erreurs de validation
      return; // Si le formulaire est invalide, on ne fait rien
    }

    if (!this.token) {
      this.formErrorMessage = "Une erreur s'est produite (token manquant). Veuillez réessayer depuis le lien de l'email."; // Erreur si le token a disparu
      return; // Si le token est manquant, on ne fait rien
    }

    this.isLoading = true; // On affiche l'indicateur de chargement

    // Préparation des données à envoyer au backend
    const payload = {
      token: this.token,
      newPassword: this.newPassword?.value
    };

    this.authService.resetPassword(payload.token, payload.newPassword).subscribe({ // Appel au service pour réinitialiser le mot de passe
      next: (response: any) => {
        this.isLoading = false; // On cache l'indicateur de chargement
        this.notification.show("Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé."); // Message de succès
        this.resetPasswordForm.disable(); // Désactiver le formulaire pour empêcher les soumissions multiples
        setTimeout(() => {
          this.router.navigate(['/connexion']); // Redirection vers la page de connexion après un délai
        }, 3000);
      },
      error: (errorResponse: any) => {
        this.isLoading = false; // On cache l'indicateur de chargement
        this.notification.show("Une erreur est survenue lors de la réinitialisation.", "error"); // Message d'erreur
        console.error('Password reset failed:', errorResponse); // Log de l'erreur pour le débogage
      }
    });
  }
}

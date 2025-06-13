import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/security/auth.service';
import {SweetAlertService} from '../../../service/sweet-alert.service';
import {PasswordValidators} from '../../../service/validator/password.validator';

// Le validateur passwordMatchValidator est défini en dehors du composant
// pour éviter sa recréation inutile à chaque cycle de détection de changements.
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * @Component ResetPasswordComponent
 * @description Page de réinitialisation du mot de passe.
 * Permet à l'utilisateur de définir un nouveau mot de passe via un lien de réinitialisation envoyé par email.
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  // --- INJECTIONS DE SERVICES ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(SweetAlertService);

  // --- ÉTAT DU COMPOSANT ---
  /** Formulaire réactif pour la saisie du nouveau mot de passe. */
  resetPasswordForm!: FormGroup;
  /** Token de réinitialisation extrait de l'URL. */
  token: string | null = null;

  /** Indique si le token est en cours de validation auprès du backend. */
  isTokenValidating = true;
  /** Indique si le formulaire est en cours de soumission. */
  isLoading = false;

  /** Message d'erreur général du formulaire. */
  formErrorMessage: string | null = null;
  /** Message d'erreur lié à la validation du token (invalide, expiré). */
  tokenErrorMessage: string | null = null;
  /** Message de succès après une réinitialisation réussie. */
  successMessage: string | null = null;

  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation du composant.
   * Initialise le formulaire et extrait/valide le token de l'URL.
   */
  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: PasswordValidators.passwordMatch('newPassword', 'confirmPassword') });

    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (this.token) {
        this.validateToken(this.token);
      } else {
        this.tokenErrorMessage = "Le lien de réinitialisation est invalide ou incomplet.";
        this.isTokenValidating = false;
      }
    });
  }

  /**
   * @method validateToken
   * @description Valide le token de réinitialisation auprès du backend.
   * @param token Le token à valider.
   */
  validateToken(token: string): void {
    this.isTokenValidating = true;

    this.authService.validateResetToken(token).subscribe({
      next: () => {
        this.isTokenValidating = false;
        this.tokenErrorMessage = null;
      },
      error: (error) => {
        this.isTokenValidating = false;
        this.tokenErrorMessage = "Le lien de réinitialisation est invalide, a expiré ou a déjà été utilisé.";
        console.error('Token validation failed:', error);
      }
    });
  }

  // --- GETTERS POUR ACCÈS FACILE AUX CONTRÔLES ---
  /**
   * @returns Le contrôle de formulaire 'newPassword'.
   */
  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  /**
   * @returns Le contrôle de formulaire 'confirmPassword'.
   */
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire.
   * Réinitialise le mot de passe via l'API et redirige après succès.
   */
  onSubmit(): void {
    this.formErrorMessage = null;
    this.successMessage = null;

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.formErrorMessage = "Une erreur s'est produite (token manquant). Veuillez réessayer depuis le lien de l'email.";
      return;
    }

    this.isLoading = true;

    const payload = {
      token: this.token,
      newPassword: this.newPassword?.value
    };

    this.authService.resetPassword(payload.token, payload.newPassword).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.notification.show("Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé.");
        this.resetPasswordForm.disable();
        setTimeout(() => {
          this.router.navigate(['/connexion']);
        }, 3000);
      },
      error: (errorResponse: any) => {
        this.isLoading = false;
        this.notification.show("Une erreur est survenue lors de la réinitialisation.", "error");
        console.error('Password reset failed:', errorResponse);
      }
    });
  }
}

import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import {LucideAngularModule} from 'lucide-angular';

/**
 * @Component ForgotPasswordComponent
 * @description Page de réinitialisation du mot de passe.
 * Permet à l'utilisateur de demander un lien de réinitialisation via son email.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);

  /** Formulaire réactif pour la demande de réinitialisation de mot de passe. */
  forgotPasswordForm: FormGroup;
  /** Indique si la demande de réinitialisation est en cours. */
  isLoading = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Accesseur pour le contrôle de formulaire 'email'.
   * @returns Le `FormControl` de l'email.
   */
  get email() {
    return this.forgotPasswordForm.get('email');
  }

  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire de demande de réinitialisation.
   * Valide le formulaire et envoie l'email pour la réinitialisation du mot de passe.
   */
  onSubmit(): void {
    console.log('onSubmit appelé dans ForgotPasswordComponent');

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const emailValue = this.email?.value;

    this.authService.requestPasswordReset(emailValue).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.notification.show('Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.', 'success');
        this.forgotPasswordForm.reset();
      },
      error: (errorResponse: any) => {
        this.isLoading = false;
        this.notification.show('Une erreur est survenue lors de la demande de réinitialisation.', 'error');
        console.error('Password reset request failed:', errorResponse);
      }
    });
  }
}

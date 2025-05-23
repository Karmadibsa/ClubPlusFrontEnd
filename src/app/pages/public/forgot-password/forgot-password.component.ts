import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import {LucideAngularModule} from 'lucide-angular'; // Importez votre service d'alerte

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'] // Adaptez ou supprimez le fichier si pas de styles spécifiques
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService); // Service pour les appels API
  private notification = inject(SweetAlertService); // Injection de votre service SweetAlert

  forgotPasswordForm: FormGroup;
  isLoading = false;
  // successMessage et errorMessage ne sont plus utilisés, on utilise SweetAlert
  // successMessage: string | null = null;
  // errorMessage: string | null = null;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]] // Validation de l'e-mail
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    console.log('onSubmit appelé dans ForgotPasswordComponent'); // Log de vérification

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched(); // Marque tous les champs comme touchés pour afficher les erreurs
      return;
    }

    this.isLoading = true; // Active l'indicateur de chargement
    const emailValue = this.email?.value; // Récupère la valeur de l'e-mail

    this.authService.requestPasswordReset(emailValue).subscribe({
      next: (response: any) => { // La réponse du backend est une simple chaîne de caractères
        this.isLoading = false; // Désactive l'indicateur de chargement
        // Afficher une notification SweetAlert pour le succès (message générique)
        this.notification.show('Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.', 'success'); // Message générique
        this.forgotPasswordForm.reset(); // Réinitialiser le formulaire après succès
      },
      error: (errorResponse: any) => {
        this.isLoading = false; // Désactive l'indicateur de chargement
        // Afficher une notification SweetAlert pour l'erreur
        this.notification.show('Une erreur est survenue lors de la demande de réinitialisation.', 'error'); // Message d'erreur générique
        console.error('Password reset request failed:', errorResponse); // Toujours loguer l'erreur
      }
    });
  }
}

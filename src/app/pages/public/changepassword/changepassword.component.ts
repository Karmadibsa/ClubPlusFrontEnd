import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {PasswordValidators} from '../../../service/validator/password.validator';

@Component({
  selector: 'app-changepassword',
  imports: [
    RouterLink,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './changepassword.component.html',
  styleUrl: './changepassword.component.scss'
})
export class ChangepasswordComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // Injectez votre service d'authentification si nécessaire
  // private authService = inject(AuthService);

  resetPasswordForm!: FormGroup;
  isLoading = false; // Pour gérer l'état de chargement du formulaire
  isVerifyingToken = true; // Pour gérer l'état de vérification du token initial
  errorMessage: string | null = null;
  successMessage: string | null = null;
  resetToken: string | null = null;
  currentState: 'Wait' | 'Verified' | 'NotVerified' | 'TokenError' = 'Wait';

  ngOnInit(): void {
    this.resetToken = this.route.snapshot.queryParams['token'] || this.route.snapshot.params['token']; // Lire depuis query param ou route param
    this.verifyToken(); // Vérifier le token au chargement
    this.initForm(); // Initialiser le formulaire
  }

  ngAfterViewInit(): void {
    // Si vous utilisez la méthode globale lucide.createIcons(), appelez-la ici.
    // Une bibliothèque Angular dédiée aux icônes est préférable.
    // if (typeof lucide !== 'undefined') {
    //   lucide.createIcons();
    // }
  }

  private verifyToken(): void {
    this.currentState = 'Wait';
    this.isVerifyingToken = true;
    this.errorMessage = null; // Reset error message

    if (!this.resetToken) {
      this.currentState = 'TokenError';
      this.errorMessage = "Aucun token de réinitialisation n'a été fourni.";
      this.isVerifyingToken = false;
      return;
    }

    console.log('Vérification du token (Placeholder):', this.resetToken);

    // *** Logique d'appel API pour valider le token (à implémenter) ***
    // Remplacez ce bloc par votre appel au service d'authentification
    // this.authService.validateResetToken(this.resetToken).subscribe({
    //   next: () => {
    //     this.currentState = 'Verified';
    //     this.isVerifyingToken = false;
    //   },
    //   error: (err) => {
    //     this.currentState = 'NotVerified';
    //     this.errorMessage = err.error?.message || 'Le lien de réinitialisation est invalide ou a expiré.';
    //     this.isVerifyingToken = false;
    //     console.error('Erreur validation token:', err);
    //   }
    // });

    // --- Placeholder pour simuler la validation du token ---
    setTimeout(() => {
      const isValid = Math.random() > 0.2; // 80% de chance que le token soit valide
      if (isValid) {
        this.currentState = 'Verified';
      } else {
        this.currentState = 'NotVerified';
        this.errorMessage = 'Le lien de réinitialisation est invalide ou a expiré. (Simulation)';
      }
      this.isVerifyingToken = false;
    }, 1000);
    // --- Fin Placeholder ---
  }


  private initForm(): void {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity()
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator // Validateur au niveau du groupe
    });
  }

  // Validateur personnalisé pour vérifier la correspondance des mots de passe
  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Si la condition n'est plus remplie, et que l'erreur existait, on la retire
      if (form.get('confirmPassword')?.hasError('passwordMismatch')) {
        const errors = form.get('confirmPassword')?.errors;
        if (errors) {
          delete errors['passwordMismatch'];
          form.get('confirmPassword')?.setErrors(Object.keys(errors).length > 0 ? errors : null);
        }
      }
      return null; // Pas d'erreur de correspondance
    }
  }

  // Getters pour template
  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.resetPasswordForm.invalid || this.currentState !== 'Verified') {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const newPasswordValue = this.resetPasswordForm.value.newPassword;

    console.log('Soumission nouveau mot de passe (Placeholder) avec token:', this.resetToken);

    // *** Logique d'appel API pour définir le nouveau mot de passe (à implémenter) ***
    // Assurez-vous que votre service prend le token et le nouveau mot de passe
    // this.authService.resetPassword(this.resetToken, newPasswordValue).subscribe({
    //   next: (response) => {
    //     this.isLoading = false;
    //     this.successMessage = response?.message || 'Votre mot de passe a été réinitialisé avec succès.';
    //     this.resetPasswordForm.reset();
    //     // Rediriger vers la page de connexion après un délai
    //     setTimeout(() => this.router.navigate(['/login']), 3000); // Adaptez '/login'
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la réinitialisation.';
    //     console.error('Erreur reset password:', err);
    //   }
    // });

    // --- Placeholder pour simuler l'appel API ---
    setTimeout(() => {
      this.isLoading = false;
      const success = Math.random() > 0.2; // 80% de chance de succès
      if (success) {
        this.successMessage = 'Votre mot de passe a été réinitialisé avec succès. (Simulation)';
        this.resetPasswordForm.reset();
        setTimeout(() => this.router.navigate(['/login']), 3000); // Adaptez '/login'
      } else {
        this.errorMessage = 'Une erreur est survenue ou le token est invalide. (Simulation)';
      }
    }, 1500);
    // --- Fin Placeholder ---
  }

}

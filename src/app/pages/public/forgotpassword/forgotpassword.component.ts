import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-forgotpassword',
  imports: [
    ReactiveFormsModule,
    NgIf,
    RouterLink
  ],
  templateUrl: './forgotpassword.component.html',
  styleUrl: './forgotpassword.component.scss'
})
export class ForgotpasswordComponent {

  private fb = inject(FormBuilder);
  // Injectez votre service d'authentification si nécessaire
  // private authService = inject(AuthService);

  forgotPasswordForm!: FormGroup;
  isLoading = false; // Pour gérer l'état de chargement
  errorMessage: string | null = null; // Pour afficher les erreurs serveur
  successMessage: string | null = null; // Pour afficher un message de succès

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    // Si vous utilisez la méthode globale lucide.createIcons(), appelez-la ici.
    // Une bibliothèque Angular dédiée aux icônes est préférable.
    // if (typeof lucide !== 'undefined') {
    //   lucide.createIcons();
    // }
  }

  private initForm(): void {
    this.forgotPasswordForm = this.fb.group({
      // Un seul champ pour l'email
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Getter pour un accès facile au contrôle dans le template
  get email() { return this.forgotPasswordForm.get('email'); }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.forgotPasswordForm.invalid) {
      // Marquer tous les champs comme 'touched' pour afficher les erreurs
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const emailValue = this.forgotPasswordForm.value.email;
    console.log('Demande de réinitialisation pour (Placeholder):', emailValue);

    // *** Logique d'appel API (à implémenter) ***
    // Remplacez ce bloc par votre appel au service d'authentification
    // this.authService.requestPasswordReset(emailValue).subscribe({
    //   next: () => {
    //     this.isLoading = false;
    //     this.successMessage = 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.';
    //     // Ne pas réinitialiser le formulaire pour que l'utilisateur voie l'email soumis
    //     // this.forgotPasswordForm.reset();
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     // Pour des raisons de sécurité, on affiche souvent le même message de succès
    //     // même si l'email n'existe pas, pour éviter l'énumération de comptes.
    //     // Alternative : afficher une erreur générique.
    //     this.successMessage = 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.';
    //     // Ou bien :
    //     // this.errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';
    //     console.error('Erreur demande réinitialisation MDP:', err);
    //   }
    // });

    // --- Placeholder pour simuler un appel API ---
    setTimeout(() => {
      this.isLoading = false;
      // Simuler un succès (toujours afficher succès pour la sécurité)
      this.successMessage = `Si un compte existe pour ${emailValue}, un lien de réinitialisation a été envoyé. (Simulation)`;
      // Ne pas reset le formulaire ici pour laisser l'email visible.
    }, 1500);
    // --- Fin Placeholder ---
  }

}

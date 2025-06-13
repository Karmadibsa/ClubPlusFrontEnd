import {
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { Membre, MembrePayload } from '../../../model/membre';

import { AuthService } from '../../../service/security/auth.service';
import { PasswordValidators } from '../../../service/validator/password.validator';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import {dateInPastValidator} from '../../../service/validator/dateInPast.validator';

/**
 * @Component InscriptionMembreComponent
 * @description Page d'inscription pour un nouveau membre.
 * Gère un formulaire réactif pour collecter les informations personnelles, les identifiants
 * et le code du club à rejoindre. Redirige vers la page de connexion après succès.
 */
@Component({
  selector: 'app-inscription-membre',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgClass,
    CommonModule
  ],
  templateUrl: './inscription-membre.component.html',
  styleUrl: './inscription-membre.component.scss'
})
export class InscriptionMembreComponent implements OnInit, OnDestroy {

  // --- PROPRIÉTÉS DU COMPOSANT ---
  /** Formulaire réactif principal pour l'inscription du membre. */
  memberRegistrationForm!: FormGroup;
  /** Indique si l'opération d'inscription est en cours. */
  isLoading = false;
  private registrationSubscription: Subscription | null = null; // Gère la désinscription.

  // --- INJECTIONS DE SERVICES ---
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notification = inject(SweetAlertService);

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation du composant. Initialise le formulaire.
   */
  ngOnInit(): void {
    const telephonePattern = /^(?:(?:(?:\+|00)33\s*(?:0)?|0)?\s*[1-9])(?:[\s.-]*\d{2}){4}$/;
    console.log("InscriptionMembreComponent: Initialisation.");
    this.memberRegistrationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      date_naissance: ['', [Validators.required, dateInPastValidator()]],
      telephone: ['', [Validators.required, Validators.pattern(telephonePattern)]],
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity()
      ]],
      confirmPassword: ['', [Validators.required]],
      codeClub: ['CLUB-0001', [Validators.required, Validators.pattern(/^CLUB-\w+$/)]] ,
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validators: PasswordValidators.passwordMatch('password', 'confirmPassword')
    });
    console.log("InscriptionMembreComponent: Formulaire d'inscription membre initialisé.");
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne `registrationSubscription`.
   */
  ngOnDestroy(): void {
    console.log("InscriptionMembreComponent: Destruction, désinscription de registrationSubscription.");
    this.registrationSubscription?.unsubscribe();
  }

  // --- GETTERS POUR ACCÈS FACILE AUX CONTRÔLES ---
  /**
   * @returns Le contrôle de formulaire 'password'.
   */
  get passwordControl(): AbstractControl | null {
    return this.memberRegistrationForm.get('password');
  }

  /**
   * @returns Le contrôle de formulaire 'confirmPassword'.
   */
  get confirmPasswordControl(): AbstractControl | null {
    return this.memberRegistrationForm.get('confirmPassword');
  }

  // --- SOUMISSION DU FORMULAIRE ---
  /**
   * @method registerMember
   * @description Gère la soumission du formulaire d'inscription du membre.
   * Valide, prépare le payload et appelle `authService.register()`.
   */
  registerMember(): void {
    this.memberRegistrationForm.markAllAsTouched();

    if (this.memberRegistrationForm.invalid) {
      let errorMsg = "Veuillez remplir correctement tous les champs requis.";
      if (this.memberRegistrationForm.hasError('passwordMismatch')) {
        errorMsg = "Les mots de passe saisis ne correspondent pas. Veuillez vérifier.";
      } else if (this.passwordControl?.invalid || this.confirmPasswordControl?.invalid) {
        errorMsg = "Veuillez vérifier les informations saisies, notamment le mot de passe et sa confirmation.";
      }
      this.notification.show(errorMsg, 'error');
      console.warn("InscriptionMembreComponent: Tentative de soumission d'un formulaire invalide.");
      return;
    }

    if (this.isLoading) {
      console.log("InscriptionMembreComponent: Soumission déjà en cours, nouvelle tentative ignorée.");
      return;
    }

    this.isLoading = true;

    const codeClubValue = this.memberRegistrationForm.get('codeClub')?.value;
    if (!codeClubValue) {
      this.notification.show("Erreur interne : Le code club est manquant.", 'error');
      this.isLoading = false;
      return;
    }
    console.log('InscriptionMembreComponent: Code Club extrait pour l\'inscription:', codeClubValue);

    const formValue = { ...this.memberRegistrationForm.getRawValue() };
    delete formValue.codeClub;
    delete formValue.confirmPassword;
    const payload: MembrePayload = formValue as MembrePayload;
    console.log('InscriptionMembreComponent: Payload JSON préparé pour l\'API:', JSON.stringify(payload, null, 2));

    this.registrationSubscription?.unsubscribe();

    this.registrationSubscription = this.authService.register(payload, codeClubValue).subscribe({
      next: (response: Membre) => {
        this.isLoading = false;
        console.log('InscriptionMembreComponent: Inscription du membre réussie ! Réponse:', response);
        this.notification.show('Membre inscrit avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        this.router.navigate(['/connexion']);
      },
      error: (error: HttpErrorResponse | Error) => {
        this.isLoading = false;
        console.error('InscriptionMembreComponent: Erreur reçue lors de l\'inscription du membre:', error);

        let errorMsgToShow = `Une erreur serveur est survenue lors de l'inscription. Veuillez réessayer plus tard.`;
        if (error instanceof HttpErrorResponse && error.error && typeof error.error.message === 'string') {
          errorMsgToShow = error.error.message;
        } else if (error.message) {
          errorMsgToShow = error.message;
        }

        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            errorMsgToShow = error.error?.message || "Le club spécifié avec ce code est introuvable.";
          } else if (error.status === 409) {
            errorMsgToShow = error.error?.message || "Cet email est peut-être déjà utilisé pour un compte.";
          } else if (error.status === 400) {
            errorMsgToShow = error.error?.message || "Données invalides. Vérifiez les informations saisies.";
          }
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsgToShow = "Erreur de réseau. Vérifiez votre connexion internet ou réessayez plus tard.";
        }

        this.notification.show(errorMsgToShow, 'error');
      }
    });
  }
}

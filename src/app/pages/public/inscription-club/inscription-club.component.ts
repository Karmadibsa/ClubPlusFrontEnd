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
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../service/security/auth.service';
import { PasswordValidators } from '../../../service/validator/password.validator';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { Club, ClubRegistrationPayload } from '../../../model/club';
import {dateInPastValidator} from '../../../service/validator/dateInPast.validator';

/**
 * @Component InscriptionClubComponent
 * @description Page de création d'un nouveau club et de son compte administrateur.
 * Gère un formulaire réactif complexe avec validations.
 * Redirige vers la page de connexion après une inscription réussie.
 */
@Component({
  selector: 'app-inscription-club',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgClass,
    CommonModule
  ],
  templateUrl: './inscription-club.component.html',
  styleUrl: './inscription-club.component.scss'
})
export class InscriptionClubComponent implements OnInit, OnDestroy {

  // --- PROPRIÉTÉS DU COMPOSANT ---
  /** Formulaire réactif principal pour l'inscription. */
  registrationForm!: FormGroup;
  private registrationSubscription: Subscription | null = null; // Gère la désinscription.
  /** Indique si l'opération d'inscription est en cours. */
  isLoading: boolean = false;

  // --- INJECTIONS DE SERVICES ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notification = inject(SweetAlertService);

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Initialise le formulaire.
   */
  ngOnInit(): void {
    const telephonePattern = /^(?:(?:(?:\+|00)33\s*(?:0)?|0)?\s*[1-9])(?:[\s.-]*\d{2}){4}$/;
    console.log("InscriptionClubComponent: Initialisation.");
    this.registrationForm = this.fb.group({
      nom: ['Club de Test Alpha', Validators.required],
      date_creation: ['2023-01-15', [Validators.required, dateInPastValidator()]],
      numero_voie: ['10', Validators.required],
      rue: ['Avenue des Champions', Validators.required],
      codepostal: ['75000', [
        Validators.required,
        Validators.pattern(/^(?:\d{5}|2[ABab]\d{3})$/)
      ]],
      ville: ['Paris', Validators.required],
      telephone: ['', [Validators.required, Validators.pattern(telephonePattern)]],
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      admin: this.fb.group({
        nom: ['', Validators.required],
        prenom: ['', Validators.required],
        date_naissance: ['', Validators.required],
        telephone: ['', [Validators.required, Validators.pattern(telephonePattern)]],
        email: ['', [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        ]],
        passwordGroup: this.fb.group({
          password: ['', [
            Validators.required,
            PasswordValidators.passwordComplexity()
          ]],
          confirmPassword: ['', Validators.required],
        }, { validators: PasswordValidators.passwordMatch('password', 'confirmPassword') })
      }),
          acceptTerms: [false, Validators.requiredTrue]
    });
    console.log("InscriptionClubComponent: Formulaire d'inscription initialisé.");
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne `registrationSubscription`.
   */
  ngOnDestroy(): void {
    console.log("InscriptionClubComponent: Destruction, désinscription de registrationSubscription.");
    this.registrationSubscription?.unsubscribe();
  }

  /**
   * Getter pour le groupe de mots de passe de l'administrateur.
   * @returns Le `AbstractControl` du groupe de mots de passe.
   */
  getAdminPasswordGroup(): AbstractControl | null { return this.registrationForm.get(['admin', 'passwordGroup']); }

  /**
   * Getter pour un contrôle de mot de passe spécifique de l'administrateur.
   * @param name Le nom du contrôle ('password' ou 'confirmPassword').
   * @returns Le `AbstractControl` du contrôle de mot de passe.
   */
  getAdminPasswordControl(name: string): AbstractControl | null { return this.registrationForm.get(['admin', 'passwordGroup', name]); }

  // --- SOUMISSION DU FORMULAIRE ---
  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire d'inscription du club.
   * Valide, construit le payload et appelle `authService.registerClub()`.
   * Redirige vers la page de connexion après succès.
   */
  onSubmit(): void {
    this.registrationForm.markAllAsTouched();

    if (this.registrationForm.invalid) {
      let errorMsg = "Veuillez corriger les erreurs dans le formulaire.";
      if (this.getAdminPasswordGroup()?.hasError('passwordMismatch')) {
        errorMsg = "Les mots de passe saisis pour l'administrateur ne correspondent pas. Veuillez vérifier.";
      }
      this.notification.show(errorMsg, 'warning');
      console.warn("InscriptionClubComponent: Tentative de soumission d'un formulaire invalide.");
      return;
    }
    if (this.isLoading) {
      console.log("InscriptionClubComponent: Soumission déjà en cours, nouvelle tentative ignorée.");
      return;
    }

    this.isLoading = true;

    const formValue = this.registrationForm.getRawValue();
    const payload: ClubRegistrationPayload = {
      nom: formValue.nom,
      date_creation: formValue.date_creation,
      numero_voie: formValue.numero_voie,
      rue: formValue.rue,
      codepostal: formValue.codepostal,
      ville: formValue.ville,
      telephone: formValue.telephone,
      email: formValue.email,
      admin: {
        nom: formValue.admin.nom,
        prenom: formValue.admin.prenom,
        date_naissance: formValue.admin.date_naissance,
        telephone: formValue.admin.telephone,
        email: formValue.admin.email,
        password: formValue.admin.passwordGroup.password
      }
    };

    this.registrationSubscription?.unsubscribe();

    this.registrationSubscription = this.authService.registerClub(payload).subscribe({
      next: (response: Club | any) => {
        this.isLoading = false;
        console.log('InscriptionClubComponent: Inscription du club réussie!', response);
        this.notification.show('Club et administrateur inscrits avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        this.router.navigate(['/connexion']);
      },
      error: (error: HttpErrorResponse | Error) => {
        this.isLoading = false;
        console.error('InscriptionClubComponent: Erreur reçue lors de l\'inscription:', error);

        let errorMsgToShow = `Une erreur serveur est survenue. Veuillez réessayer plus tard.`;
        if (error instanceof HttpErrorResponse && error.error && error.error.message) {
          errorMsgToShow = error.error.message;
        } else if (error.message) {
          errorMsgToShow = error.message;
        }

        if (error instanceof HttpErrorResponse) {
          if (error.status === 409) {
            errorMsgToShow = error.error?.message || "Un email fourni (club ou admin) est peut-être déjà utilisé.";
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

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {NotificationService} from '../../../service/model/notification.service';
import {Membre, MembrePayload} from '../../../model/membre';
import {NgClass} from '@angular/common';
import {PasswordValidators} from '../../../service/validator/password.validator';
import {AuthService} from '../../../service/security/auth.service';
import {Subscription} from 'rxjs';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-inscription-membre',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgClass
  ],
  templateUrl: './inscription-membre.component.html',
  styleUrl: './inscription-membre.component.scss'
})
export class InscriptionMembreComponent {
  // --- Injections et Propriétés ---
  private authService = inject(AuthService); // Injecter AuthService
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notification = inject(SweetAlertService);


  memberRegistrationForm!: FormGroup;
  isLoading = false;
  private registrationSubscription: Subscription | null = null; // Pour se désabonner

  // --- Initialisation ---
  ngOnInit(): void {
    this.memberRegistrationForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      date_naissance: ['', Validators.required],
      numero_voie: ['', Validators.required],
      rue: ['', Validators.required],
      codepostal: ['', Validators.required],
      ville: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity()
      ]],
      confirmPassword: ['', [Validators.required]],
      codeClub: ['CLUB-', Validators.required] // Garder 'CLUB-' comme valeur initiale si pertinent
    }, {
      validators: PasswordValidators.passwordMatch('password', 'confirmPassword')
    });
    // Décommente cette partie pour les tests si besoin

    // this.memberRegistrationForm.patchValue({
    //   nom: 'TestNom', prenom: 'TestPrenom', date_naissance: '2000-01-01',
    //   numero_voie: '123', rue: 'Rue de Test', codepostal: '75001', ville: 'Paris',
    //   telephone: '0601020304', email: 'test.email@example.com',
    //   password: 'Password1!', confirmPassword: 'Password1!',
    //   codeClub: 'CLUB-0001'
    // });

  }

  ngOnDestroy(): void {
    // Se désabonner lors de la destruction du composant
    this.registrationSubscription?.unsubscribe();
  }

  // --- Getters (utiles pour le template) ---
  get passwordControl() {
    return this.memberRegistrationForm.get('password');
  }

  // 6. AJOUTER un getter pour confirmPassword
  get confirmPasswordControl() {
    return this.memberRegistrationForm.get('confirmPassword');
  }

  registerMember(): void {
    this.memberRegistrationForm.markAllAsTouched();

    // 1. Validation du formulaire (INCHANGÉE)
    if (this.memberRegistrationForm.invalid) {
      let errorMsg = "Veuillez remplir correctement tous les champs requis.";
      if (this.memberRegistrationForm.errors?.['passwordMismatch']) {
        errorMsg = "Les mots de passe ne correspondent pas.";
      } else if (this.passwordControl?.invalid || this.confirmPasswordControl?.invalid) {
        errorMsg = "Veuillez vérifier les informations saisies, notamment le mot de passe et sa confirmation.";
      }
      this.notification.show(errorMsg, 'error');
      return;
    }

    // 2. Préparation (INCHANGÉE, sauf la construction de l'URL)
    this.isLoading = true;
    const codeClubValue = this.memberRegistrationForm.get('codeClub')?.value;
    if (!codeClubValue) {
      this.notification.show("Erreur interne : Le code club n'a pas pu être récupéré.", 'error');
      this.isLoading = false;
      return;
    }
    console.log('Code Club extrait:', codeClubValue);

    // Préparation du payload (INCHANGÉE)
    const formValue = { ...this.memberRegistrationForm.getRawValue() }; // Use getRawValue pour inclure potentiellement des champs désactivés si besoin
    delete formValue.codeClub;
    delete formValue.confirmPassword;
    const payload: MembrePayload = formValue as MembrePayload; // Assertion de type car on a retiré les clés
    console.log('Payload JSON préparé:', JSON.stringify(payload, null, 2));

    // Annule la souscription précédente si elle existe
    this.registrationSubscription?.unsubscribe();

    // 3. Appel au Service (MODIFIÉ)
    this.registrationSubscription = this.authService.register(payload, codeClubValue).subscribe({
      next: (response: Membre) => {
        // 4. Gestion du succès (INCHANGÉE)
        this.isLoading = false;
        console.log('Inscription réussie ! Réponse:', response);
        this.notification.show('Membre inscrit avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        this.router.navigate(['/connexion']); // Redirection vers la page de connexion
      },
      error: (error: Error) => { // Type Error car handleError renvoie `throwError(() => new Error(errorMessage))`
        // 5. Gestion de l'erreur (PRESQUE INCHANGÉE, utilise error.message)
        this.isLoading = false;
        console.error('Erreur reçue dans InscriptionMembreComponent:', error);
        let errorMsg = error.message || `Une erreur serveur est survenue. Veuillez réessayer plus tard.`; // Message par défaut

        // Tentative d'affiner le message basé sur le contenu de l'erreur renvoyée par le service
        // (peut nécessiter ajustement selon la structure exacte de l'erreur backend après handleError)
        if (error.message.includes('404')) {
          errorMsg = "Le club spécifié est introuvable ou l'URL d'inscription est incorrecte.";
        } else if (error.message.includes('409')) {
          errorMsg = "Cet email est peut-être déjà utilisé.";
          // Tu pourrais essayer de parser error.message si le backend met le message dedans, mais c'est fragile.
          // Exemple: if (error.message.includes('Email already exists')) errorMsg = ...
        } else if (error.message.includes('400')) {
          errorMsg = "Données invalides. Vérifiez les informations saisies (format email, complexité mot de passe...).";
        }
        // else {
        //   Utilise errorMsg déjà défini avec error.message
        // }

        this.notification.show(errorMsg, 'error');
      }
    });
  }
}

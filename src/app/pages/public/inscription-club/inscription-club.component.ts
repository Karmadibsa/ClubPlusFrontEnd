import {Component, inject} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {PasswordValidators} from '../../../service/validator/password.validator';
import {NgClass} from '@angular/common';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../service/security/auth.service';
import {Club, ClubRegistrationPayload} from '../../../model/club';
import {SweetAlertService} from '../../../service/sweet-alert.service'; // <-- 1. Importer Router


@Component({
  selector: 'app-inscription-club',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgClass
  ],
  templateUrl: './inscription-club.component.html',
  styleUrl: './inscription-club.component.scss'
})
export class InscriptionClubComponent {

  registrationForm!: FormGroup;
  private registrationSubscription: Subscription | null = null; // Pour se désabonner
  isLoading: boolean = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService); // Injecter AuthService
  private router = inject(Router);
  private notification = inject(SweetAlertService);

  constructor() {
  }

  ngOnInit(): void {
    // Initialisation du formulaire (INCHANGÉE)
    this.registrationForm = this.fb.group({
      nom: ['Club Test', Validators.required],
      date_creation: ['2020-01-01', Validators.required],
      numero_voie: ['123', Validators.required],
      rue: ['Rue de Test', Validators.required],
      codepostal: ['75001', Validators.required],
      ville: ['Paris', Validators.required],
      telephone: ['0102030405', Validators.required],
      email: ['test@club.com', [Validators.required, Validators.email]],
      admin: this.fb.group({
        nom: ['AdminTest', Validators.required],
        prenom: ['Jean', Validators.required],
        date_naissance: ['1990-05-15', Validators.required],
        numero_voie: ['123', Validators.required],
        rue: ["Rue de l'Admin", Validators.required],
        codepostal: ['75001', Validators.required],
        ville: ['Paris', Validators.required],
        telephone: ['0607080910', Validators.required],
        email: ['admin@test.com', [Validators.required, Validators.email]],
        passwordGroup: this.fb.group({
          password: ['', [Validators.required, PasswordValidators.passwordComplexity()]],
          confirmPassword: ['', Validators.required]
        }, { validators: PasswordValidators.passwordMatch('password', 'confirmPassword') })
      })
    });
  }


  ngOnDestroy(): void {
    this.registrationSubscription?.unsubscribe(); // Nettoyage
  }

  getControl(name: string): AbstractControl | null { return this.registrationForm.get(name); }
  getAdminControl(name: string): AbstractControl | null { return this.registrationForm.get(['admin', name]); }
  getAdminPasswordGroup(): AbstractControl | null { return this.registrationForm.get(['admin', 'passwordGroup']); }
  getAdminPasswordControl(name: string): AbstractControl | null { return this.registrationForm.get(['admin', 'passwordGroup', name]); }

  onSubmit(): void {
    // 1. Validation et préparation (presque INCHANGÉES)
    // this.errorMessage = null; // Retiré
    this.registrationForm.markAllAsTouched();

    if (this.registrationForm.invalid) {
      // Logique de message d'erreur inchangée, utilise this.notification
      let errorMsg = "Veuillez corriger les erreurs dans le formulaire.";
      // (Ajouter ici la logique pour vérifier passwordMismatch ou autres erreurs spécifiques si besoin)
      this.notification.show(errorMsg, 'warning');
      return;
    }
    if (this.isLoading) return; // Empêche double soumission

    this.isLoading = true;

    // Construction du payload (INCHANGÉE)
    const formValue = this.registrationForm.getRawValue(); // Utilise getRawValue
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
        numero_voie: formValue.admin.numero_voie,
        rue: formValue.admin.rue,
        codepostal: formValue.admin.codepostal,
        ville: formValue.admin.ville,
        telephone: formValue.admin.telephone,
        email: formValue.admin.email,
        password: formValue.admin.passwordGroup.password // <- Prend seulement le password
      }
    };
    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    // Annule la souscription précédente si elle existe
    this.registrationSubscription?.unsubscribe();

    // 2. Appel au Service (MODIFIÉ)
    this.registrationSubscription = this.authService.registerClub(payload).subscribe({
      next: (response: Club | any) => { // Utilise le type de retour du service (Club ou any)
        // 3. Gestion du Succès (INCHANGÉE)
        this.isLoading = false;
        console.log('Inscription réussie!', response);
        this.notification.show('Club et administrateur inscrits avec succès !', 'success');
        this.router.navigate(['/connexion']);
      },
      error: (error: Error) => { // Type Error via handleError
        // 4. Gestion de l'Erreur (Utilise error.message)
        this.isLoading = false;
        console.error('Erreur reçue dans InscriptionClubComponent:', error);
        let errorMsg = error.message || `Une erreur serveur est survenue. Veuillez réessayer plus tard.`;

        // Tentative d'affiner le message basé sur le contenu de l'erreur
        if (error.message.includes('409')) { // Conflit
          errorMsg = "Un email fourni (club ou admin) est peut-être déjà utilisé.";
        } else if (error.message.includes('400')) { // Mauvaise requête / Validation
          errorMsg = "Données invalides. Vérifiez les informations saisies.";
        }
        // else { Utilise errorMsg déjà défini }

        this.notification.show(errorMsg, 'error');
      }
    });
  }
}

// ----- IMPORTATIONS -----
import {
  Component,
  inject,         // Fonction moderne pour l'injection de dépendances.
  OnInit,
  OnDestroy       // Pour gérer la désinscription des abonnements.
  // ChangeDetectorRef // À ajouter si ChangeDetectionStrategy.OnPush est utilisé.
} from '@angular/core';
import {
  AbstractControl,      // Type de base pour les contrôles de formulaire.
  FormBuilder,          // Service pour construire des formulaires réactifs.
  FormGroup,            // Type pour un groupe de contrôles.
  FormsModule,          // Pour `[(ngModel)]` si utilisé (non utilisé ici, mais bon à garder si extension).
  ReactiveFormsModule,  // Indispensable pour `[formGroup]` et `formControlName`.
  Validators            // Fournit des fonctions de validation.
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Pour la navigation et les liens de route.
import { NgClass, CommonModule } from '@angular/common';      // NgClass pour les classes conditionnelles, CommonModule pour @if, etc.
import { Subscription } from 'rxjs';                // Pour gérer la désinscription.
import { HttpErrorResponse } from '@angular/common/http'; // Pour typer les erreurs API.

// Services
import { AuthService } from '../../../service/security/auth.service'; // Service pour les opérations d'authentification et d'inscription.
import { PasswordValidators } from '../../../service/validator/password.validator'; // Validateurs personnalisés pour le mot de passe.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Modèles (Interfaces de données)
import { Club, ClubRegistrationPayload } from '../../../model/club'; // Interfaces décrivant un club et le payload d'inscription.

// Autres (si besoin, par exemple pour des icônes dans le template de CETTE page)
// import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component InscriptionClubComponent
 * @description
 * Page permettant la création d'un nouveau club et de son compte administrateur initial.
 * Ce composant gère un formulaire réactif complexe avec des validations pour les informations
 * du club (y compris son adresse) et les informations du compte administrateur (y compris la création
 * d'un mot de passe sécurisé).
 * Après une soumission réussie, l'utilisateur est redirigé vers la page de connexion.
 *
 * @example
 * <app-inscription-club></app-inscription-club> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-inscription-club', // Sélecteur CSS du composant.
  standalone: true,                // Indique que c'est un composant autonome.
  imports: [                       // Dépendances nécessaires pour le template.
    FormsModule,                 // Pour `[(ngModel)]` si vous l'utilisiez (non critique ici).
    ReactiveFormsModule,         // Essentiel pour les formulaires réactifs.
    RouterLink,                  // Pour le lien de retour vers l'accueil.
    NgClass,                     // Pour appliquer des classes CSS conditionnellement (ex: `is-invalid`).
    CommonModule                 // Pour les directives @if, @for (ou NgIf/NgForOf).
    // LucideAngularModule      // À ajouter si des icônes sont utilisées directement dans ce template.
  ],
  templateUrl: './inscription-club.component.html', // Chemin vers le fichier HTML.
  styleUrl: './inscription-club.component.scss',    // Chemin vers le fichier SCSS.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisagez pour optimiser les performances.
})
export class InscriptionClubComponent implements OnInit, OnDestroy {

  // --- PROPRIÉTÉS DU COMPOSANT ---
  /**
   * @property {FormGroup} registrationForm
   * @description Le formulaire réactif principal contenant tous les champs pour l'inscription
   * du club et de son administrateur.
   * Le `!` (definite assignment assertion) indique qu'il sera initialisé dans `ngOnInit`.
   */
  registrationForm!: FormGroup;
  /**
   * @private
   * @property {Subscription | null} registrationSubscription
   * @description Référence à l'abonnement pour l'opération d'inscription du club.
   * Permet de se désabonner proprement dans `ngOnDestroy`.
   * @default null
   */
  private registrationSubscription: Subscription | null = null;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si l'opération d'inscription (appel API) est en cours.
   * Utilisé pour désactiver le bouton de soumission et afficher un feedback visuel.
   * @default false
   */
  isLoading: boolean = false;

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   */
  private fb = inject(FormBuilder);
  /**
   * @private
   * @description Service d'authentification, utilisé ici pour la méthode d'inscription du club.
   */
  private authService = inject(AuthService);
  /**
   * @private
   * @description Service Angular pour la navigation programmatique (utilisé après une inscription réussie).
   */
  private router = inject(Router);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) à l'utilisateur.
   */
  private notification = inject(SweetAlertService);
  // private cdr = inject(ChangeDetectorRef); // À injecter si ChangeDetectionStrategy.OnPush est utilisé.

  /**
   * @constructor
   * Le constructeur est implicitement fourni par Angular car pas de logique spécifique ici.
   * Les injections sont gérées via `inject()`.
   */
  constructor() {}

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Initialise le `registrationForm` avec tous ses contrôles et validateurs.
   * @see {@link fb}
   * @see {@link PasswordValidators}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("InscriptionClubComponent: Initialisation.");
    // Initialisation du formulaire réactif.
    this.registrationForm = this.fb.group({
      // Section Informations Club
      nom: ['Club de Test Alpha', Validators.required],
      date_creation: ['2023-01-15', Validators.required], // Format YYYY-MM-DD pour <input type="date">
      // Section Adresse Club (CONSERVÉE car présente dans le HTML fourni)
      numero_voie: ['10', Validators.required],
      rue: ['Avenue des Champions', Validators.required],
      codepostal: ['75000', [Validators.required, Validators.pattern(/^\d{5}$/)]], // Valide un code postal français.
      ville: ['Paris', Validators.required],
      // Section Contact Club
      telephone: ['0123456789', [Validators.required, Validators.pattern(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)]], // Valide un numéro de téléphone français.
      email: ['club.alpha@example.com', [Validators.required, Validators.email]],

      // Section Informations Administrateur (imbriquée)
      admin: this.fb.group({
        nom: ['Dupont', Validators.required],
        prenom: ['Alexandre', Validators.required],
        date_naissance: ['1985-06-20', Validators.required],
        telephone: ['0612345678', [Validators.required, Validators.pattern(/^(?:(?:\+|00)33|0)\s*[6-7](?:[\s.-]*\d{2}){4}$/)]], // Valide un mobile français.
        email: ['momper.axel.99@gmail.com', [Validators.required, Validators.email]],
        // Groupe de mots de passe imbriqué pour la validation de correspondance.
        passwordGroup: this.fb.group({
          password: ['Huluxa_57740!', [
            Validators.required,
            PasswordValidators.passwordComplexity() // Validateur personnalisé pour la complexité.
          ]],
          confirmPassword: ['Huluxa_57740!', Validators.required] // Requis pour la confirmation.
        }, { validators: PasswordValidators.passwordMatch('password', 'confirmPassword') }) // Validateur de groupe pour la correspondance.
      })
    });
    console.log("InscriptionClubComponent: Formulaire d'inscription initialisé.");
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de `registrationSubscription` pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("InscriptionClubComponent: Destruction, désinscription de registrationSubscription.");
    this.registrationSubscription?.unsubscribe();
  }


  getAdminPasswordGroup(): AbstractControl | null { return this.registrationForm.get(['admin', 'passwordGroup']); }
  /**
   * @method getAdminPasswordControl
   * @description Getter pour accéder à un `FormControl` ('password' ou 'confirmPassword')
   * imbriqué dans 'admin.passwordGroup'.
   * @param {string} name - Le nom du contrôle de mot de passe.
   * @returns {AbstractControl | null} Le contrôle de formulaire ou `null`.
   */
  getAdminPasswordControl(name: string): AbstractControl | null { return this.registrationForm.get(['admin', 'passwordGroup', name]); }

  // --- SOUMISSION DU FORMULAIRE ---
  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire d'inscription du club.
   * 1. Valide le formulaire. Si invalide, marque tous les champs comme "touchés" pour afficher les erreurs
   *    et affiche une notification d'avertissement.
   * 2. Empêche la double soumission si `isLoading` est `true`.
   * 3. Construit l'objet `ClubRegistrationPayload` à partir des valeurs du formulaire (en utilisant `getRawValue()`
   *    pour inclure les valeurs des champs potentiellement désactivés, bien qu'aucun ne le soit ici).
   * 4. Appelle `authService.registerClub()` pour envoyer les données au backend.
   * 5. Gère les réponses de succès (redirection vers la page de connexion) et d'erreur (affichage de notifications).
   * @returns {void}
   */
  onSubmit(): void {
    // Marque tous les contrôles comme "touchés" pour afficher les messages de validation.
    this.registrationForm.markAllAsTouched();

    if (this.registrationForm.invalid) {
      let errorMsg = "Veuillez corriger les erreurs dans le formulaire.";
      // Vérification spécifique pour la non-correspondance des mots de passe.
      if (this.getAdminPasswordGroup()?.hasError('passwordMismatch')) {
        errorMsg = "Les mots de passe saisis pour l'administrateur ne correspondent pas. Veuillez vérifier.";
      }
      this.notification.show(errorMsg, 'warning');
      console.warn("InscriptionClubComponent: Tentative de soumission d'un formulaire invalide.");
      return; // Sortie anticipée.
    }
    if (this.isLoading) {
      console.log("InscriptionClubComponent: Soumission déjà en cours, nouvelle tentative ignorée.");
      return; // Empêche la double soumission.
    }

    this.isLoading = true; // Active l'indicateur de chargement.
    // this.cdr.detectChanges(); // Si OnPush.

    // Récupère toutes les valeurs du formulaire, y compris celles des groupes imbriqués.
    const formValue = this.registrationForm.getRawValue();
    // Construit le payload pour l'API.
    const payload: ClubRegistrationPayload = {
      nom: formValue.nom,
      date_creation: formValue.date_creation,
      // Champs d'adresse du club (CONSERVÉS)
      numero_voie: formValue.numero_voie,
      rue: formValue.rue,
      codepostal: formValue.codepostal,
      ville: formValue.ville,
      // Contact club
      telephone: formValue.telephone,
      email: formValue.email,
      // Informations administrateur
      admin: {
        nom: formValue.admin.nom,
        prenom: formValue.admin.prenom,
        date_naissance: formValue.admin.date_naissance,
        telephone: formValue.admin.telephone,
        email: formValue.admin.email,
        password: formValue.admin.passwordGroup.password // Seul le champ 'password' est envoyé.
      }
    };
    console.log('InscriptionClubComponent: Envoi du payload d\'inscription:', JSON.stringify(payload, null, 2));

    // Annule une souscription précédente si elle existait (sécurité).
    this.registrationSubscription?.unsubscribe();

    // Appel au service d'authentification pour inscrire le club.
    this.registrationSubscription = this.authService.registerClub(payload).subscribe({
      next: (response: Club | any) => { // La réponse peut être l'objet Club créé ou un message.
        this.isLoading = false;
        console.log('InscriptionClubComponent: Inscription du club réussie!', response);
        this.notification.show('Club et administrateur inscrits avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        this.router.navigate(['/connexion']); // Redirection vers la page de connexion.
      },
      error: (error: HttpErrorResponse | Error) => { // Gère HttpErrorResponse et Error générique.
        this.isLoading = false;
        console.error('InscriptionClubComponent: Erreur reçue lors de l\'inscription:', error);

        let errorMsgToShow = `Une erreur serveur est survenue. Veuillez réessayer plus tard.`;
        if (error instanceof HttpErrorResponse && error.error && error.error.message) {
          errorMsgToShow = error.error.message; // Message d'erreur du backend (HttpErrorResponse).
        } else if (error.message) {
          errorMsgToShow = error.message; // Message d'erreur générique.
        }

        // Tente d'affiner le message basé sur le statut HTTP si c'est une HttpErrorResponse
        // ou sur le contenu du message d'erreur.
        if (error instanceof HttpErrorResponse) {
          if (error.status === 409) { // Conflit (ex: email déjà utilisé).
            errorMsgToShow = error.error?.message || "Un email fourni (club ou admin) est peut-être déjà utilisé.";
          } else if (error.status === 400) { // Mauvaise requête / Erreur de validation backend.
            errorMsgToShow = error.error?.message || "Données invalides. Vérifiez les informations saisies.";
          }
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMsgToShow = "Erreur de réseau. Vérifiez votre connexion internet ou réessayez plus tard.";
        }

        this.notification.show(errorMsgToShow, 'error');
        // this.cdr.detectChanges(); // Si OnPush.
      }
    });
  }
}

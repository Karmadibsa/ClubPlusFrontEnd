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
  ReactiveFormsModule,  // Indispensable pour `[formGroup]` et `formControlName`.
  Validators            // Fournit des fonctions de validation.
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Pour la navigation et les liens de route.
import { NgClass, CommonModule } from '@angular/common';      // NgClass pour classes conditionnelles, CommonModule pour @if.
import { Subscription } from 'rxjs';                // Pour gérer la désinscription.
import { HttpErrorResponse } from '@angular/common/http'; // Pour typer les erreurs API.

// Modèles (Interfaces de données)
import { Membre, MembrePayload } from '../../../model/membre'; // Interfaces décrivant un membre et le payload d'inscription.

// Services
import { AuthService } from '../../../service/security/auth.service'; // Service pour les opérations d'authentification et d'inscription.
import { PasswordValidators } from '../../../service/validator/password.validator'; // Validateurs personnalisés pour le mot de passe.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Autres (si besoin, par exemple pour des icônes dans le template de CETTE page)
// import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component InscriptionMembreComponent
 * @description
 * Page permettant aux nouveaux utilisateurs de s'inscrire en tant que membre.
 * Ce composant gère un formulaire réactif pour collecter les informations personnelles
 * du membre (nom, prénom, date de naissance, contact), ses identifiants de connexion
 * (email, mot de passe sécurisé), et le code du club qu'il souhaite rejoindre.
 * La section adresse du membre n'est pas collectée, conformément aux principes de
 * minimisation des données et du RGPD.
 * Après une soumission réussie, l'utilisateur est redirigé vers la page de connexion.
 *
 * @example
 * <app-inscription-membre></app-inscription-membre> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-inscription-membre', // Sélecteur CSS du composant.
  standalone: true,                  // Indique que c'est un composant autonome.
  imports: [                         // Dépendances nécessaires pour le template.
    ReactiveFormsModule,             // Essentiel pour les formulaires réactifs `[formGroup]`.
    RouterLink,                      // Pour le lien de retour vers l'accueil.
    NgClass,                         // Pour appliquer des classes CSS conditionnellement (ex: `is-invalid`).
    CommonModule                     // Pour les directives @if, @for (ou NgIf/NgForOf).
    // LucideAngularModule          // À ajouter si des icônes sont utilisées directement dans ce template.
  ],
  templateUrl: './inscription-membre.component.html', // Chemin vers le fichier HTML.
  styleUrl: './inscription-membre.component.scss'    // Chemin vers le fichier SCSS.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisagez pour optimiser les performances.
})
export class InscriptionMembreComponent implements OnInit, OnDestroy {

  // --- PROPRIÉTÉS DU COMPOSANT ---
  /**
   * @property {FormGroup} memberRegistrationForm
   * @description Le formulaire réactif principal pour l'inscription du membre.
   * Le `!` (definite assignment assertion) indique qu'il sera initialisé dans `ngOnInit`.
   */
  memberRegistrationForm!: FormGroup;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si l'opération d'inscription (appel API) est en cours.
   * Utilisé pour désactiver le bouton de soumission et afficher un feedback visuel.
   * @default false
   */
  isLoading = false;
  /**
   * @private
   * @property {Subscription | null} registrationSubscription
   * @description Référence à l'abonnement pour l'opération d'inscription du membre.
   * Permet de se désabonner proprement dans `ngOnDestroy`.
   * @default null
   */
  private registrationSubscription: Subscription | null = null;

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service d'authentification, utilisé ici pour la méthode d'inscription du membre.
   */
  private authService = inject(AuthService);
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   */
  private fb = inject(FormBuilder);
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

  // Le constructeur est implicitement fourni par Angular car pas de logique spécifique ici.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Initialise le `memberRegistrationForm` avec tous ses contrôles et validateurs.
   * Les champs d'adresse pour le membre ne sont PAS inclus.
   * @see {@link fb}
   * @see {@link PasswordValidators}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("InscriptionMembreComponent: Initialisation.");
    this.memberRegistrationForm = this.fb.group({
      // Informations personnelles (sans adresse)
      nom: ['Momper', Validators.required],
      prenom: ['Axel', Validators.required],
      date_naissance: ['1999-07-03', Validators.required], // Type 'date' dans le HTML.
      // Contact
      telephone: ['0782948279', Validators.required], // Valideur de pattern plus spécifique peut être ajouté.
      email: ['momper.axel.99@gmail.com', [Validators.required, Validators.email]],
      // Identifiants
      password: ['Huluxa_57740!', [
        Validators.required,
        PasswordValidators.passwordComplexity() // Validateur personnalisé pour la complexité.
      ]],
      confirmPassword: ['Huluxa_57740!', [Validators.required]], // Requis pour la confirmation.
      // Affiliation au club
      codeClub: ['CLUB-0001', [Validators.required, Validators.pattern(/^CLUB-\w+$/)]] // Commence par 'CLUB-' suivi de caractères.
    }, {
      // Validateur de groupe pour s'assurer que les mots de passe correspondent.
      validators: PasswordValidators.passwordMatch('password', 'confirmPassword')
    });
    console.log("InscriptionMembreComponent: Formulaire d'inscription membre initialisé.");

    // Section de test (patchValue) commentée, laissée pour référence de développement si besoin.
    // this.memberRegistrationForm.patchValue({
    //   nom: 'TestNom', prenom: 'TestPrenom', date_naissance: '2000-01-01',
    //   telephone: '0601020304', email: 'test.email@example.com',
    //   password: 'Password1!', confirmPassword: 'Password1!',
    //   codeClub: 'CLUB-0001'
    // });
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de `registrationSubscription` pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("InscriptionMembreComponent: Destruction, désinscription de registrationSubscription.");
    this.registrationSubscription?.unsubscribe();
  }

  // --- GETTERS POUR UN ACCÈS FACILE AUX CONTRÔLES DE FORMULAIRE DANS LE TEMPLATE ---
  // Ces getters simplifient la syntaxe dans le template pour vérifier l'état des contrôles.
  /**
   * @method passwordControl
   * @description Getter pour accéder au `FormControl` 'password'.
   * @returns {AbstractControl | null} Le contrôle de formulaire 'password'.
   */
  get passwordControl(): AbstractControl | null {
    return this.memberRegistrationForm.get('password');
  }

  /**
   * @method confirmPasswordControl
   * @description Getter pour accéder au `FormControl` 'confirmPassword'.
   * @returns {AbstractControl | null} Le contrôle de formulaire 'confirmPassword'.
   */
  get confirmPasswordControl(): AbstractControl | null {
    return this.memberRegistrationForm.get('confirmPassword');
  }

  // --- SOUMISSION DU FORMULAIRE ---
  /**
   * @method registerMember
   * @description Gère la soumission du formulaire d'inscription du membre.
   * 1. Valide le formulaire. Si invalide, marque tous les champs comme "touchés" et affiche des notifications.
   * 2. Prépare le payload `MembrePayload` à envoyer à l'API (sans `confirmPassword` ni `codeClub`
   *    car `codeClub` est passé séparément à la méthode de service).
   * 3. Appelle `authService.register(payload, codeClubValue)` pour envoyer les données.
   * 4. Gère les réponses de succès (redirection vers la page de connexion) et d'erreur (notifications).
   * @returns {void}
   */
  registerMember(): void {
    // Marque tous les contrôles comme "touchés" pour déclencher l'affichage des messages de validation.
    this.memberRegistrationForm.markAllAsTouched();

    // Vérification initiale de la validité du formulaire.
    if (this.memberRegistrationForm.invalid) {
      let errorMsg = "Veuillez remplir correctement tous les champs requis.";
      // Vérification spécifique pour la non-correspondance des mots de passe.
      if (this.memberRegistrationForm.hasError('passwordMismatch')) {
        errorMsg = "Les mots de passe saisis ne correspondent pas. Veuillez vérifier.";
      } else if (this.passwordControl?.invalid || this.confirmPasswordControl?.invalid) {
        // Message plus générique si un des champs de mot de passe est invalide pour d'autres raisons.
        errorMsg = "Veuillez vérifier les informations saisies, notamment le mot de passe et sa confirmation.";
      }
      this.notification.show(errorMsg, 'error'); // Utilise SweetAlertService pour la notification.
      console.warn("InscriptionMembreComponent: Tentative de soumission d'un formulaire invalide.");
      return; // Sortie anticipée.
    }

    if (this.isLoading) {
      console.log("InscriptionMembreComponent: Soumission déjà en cours, nouvelle tentative ignorée.");
      return; // Empêche la double soumission si une opération est déjà en cours.
    }

    this.isLoading = true; // Active l'indicateur de chargement.
    // this.cdr.detectChanges(); // Si OnPush.

    // Récupère la valeur du code club.
    const codeClubValue = this.memberRegistrationForm.get('codeClub')?.value;
    if (!codeClubValue) { // Sécurité supplémentaire, bien que 'Validators.required' devrait le couvrir.
      this.notification.show("Erreur interne : Le code club est manquant.", 'error');
      this.isLoading = false;
      // this.cdr.detectChanges(); // Si OnPush.
      return;
    }
    console.log('InscriptionMembreComponent: Code Club extrait pour l\'inscription:', codeClubValue);

    // Prépare le payload pour l'API.
    // Copie les valeurs du formulaire et supprime celles non nécessaires pour le payload Membre.
    const formValue = { ...this.memberRegistrationForm.getRawValue() }; // `getRawValue` pour inclure tous les champs.
    delete formValue.codeClub;        // `codeClub` est passé comme argument séparé au service.
    delete formValue.confirmPassword; // La confirmation n'est pas envoyée à l'API.
    // Assertion de type pour correspondre à l'interface MembrePayload.
    const payload: MembrePayload = formValue as MembrePayload;
    console.log('InscriptionMembreComponent: Payload JSON préparé pour l\'API:', JSON.stringify(payload, null, 2));

    // Annule une souscription précédente si elle existait.
    this.registrationSubscription?.unsubscribe();

    // Appel au service d'authentification pour inscrire le membre.
    this.registrationSubscription = this.authService.register(payload, codeClubValue).subscribe({
      next: (response: Membre) => { // L'API retourne l'objet Membre créé.
        this.isLoading = false;
        console.log('InscriptionMembreComponent: Inscription du membre réussie ! Réponse:', response);
        this.notification.show('Membre inscrit avec succès ! Vous pouvez maintenant vous connecter.', 'success');
        this.router.navigate(['/connexion']); // Redirection vers la page de connexion.
      },
      error: (error: HttpErrorResponse | Error) => { // Gère HttpErrorResponse et Error générique.
        this.isLoading = false;
        console.error('InscriptionMembreComponent: Erreur reçue lors de l\'inscription du membre:', error);

        let errorMsgToShow = `Une erreur serveur est survenue lors de l'inscription. Veuillez réessayer plus tard.`;
        // Extrait le message d'erreur de manière plus robuste.
        if (error instanceof HttpErrorResponse && error.error && typeof error.error.message === 'string') {
          errorMsgToShow = error.error.message;
        } else if (error.message) {
          errorMsgToShow = error.message;
        }

        // Logique affinée pour les messages d'erreur basés sur le statut ou contenu (comme dans votre code original).
        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) { // Not Found (ex: code club invalide).
            errorMsgToShow = error.error?.message || "Le club spécifié avec ce code est introuvable.";
          } else if (error.status === 409) { // Conflict (ex: email déjà utilisé).
            errorMsgToShow = error.error?.message || "Cet email est peut-être déjà utilisé pour un compte.";
          } else if (error.status === 400) { // Bad Request (ex: validation backend échouée).
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

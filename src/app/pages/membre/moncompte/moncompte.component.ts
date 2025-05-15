// ----- IMPORTATIONS -----
import {
  ChangeDetectionStrategy, // Stratégie pour optimiser la détection de changements.
  ChangeDetectorRef,       // Outil pour contrôler manuellement la détection de changements.
  Component,
  inject,                   // Fonction moderne pour l'injection de dépendances.
  OnDestroy,
  OnInit,
  LOCALE_ID                 // Pour injecter la locale actuelle de l'application.
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common'; // Pour @if, formatDate.
import {
  FormBuilder,            // Service pour construire des formulaires réactifs.
  FormGroup,              // Type pour un groupe de contrôles de formulaire.
  FormsModule,            // Pour [(ngModel)] (utilisé pour la confirmation de suppression).
  ReactiveFormsModule,    // Indispensable pour `[formGroup]` et `formControlName`.
  Validators              // Fournit des fonctions de validation pour les formulaires.
} from '@angular/forms';
import { Subscription } from 'rxjs';                  // Pour gérer la désinscription des Observables.
import { HttpErrorResponse } from '@angular/common/http'; // Pour typer les erreurs API.
import { Router, RouterLink } from '@angular/router';     // Pour la navigation et les liens de route.

// Services
import { MembreService } from '../../../service/crud/membre.service'; // Service pour les opérations CRUD sur le membre.
import { AuthService } from '../../../service/security/auth.service'; // Pour la déconnexion.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications.

// Modèles (Interfaces de données)
import { Membre } from '../../../model/membre'; // Interface décrivant un membre.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular';
import {PasswordValidators} from '../../../service/validator/password.validator';

/**
 * @Component MonCompteComponent
 * @description
 * Page permettant à l'utilisateur connecté de gérer les informations de son compte personnel.
 * Il peut visualiser et modifier ses informations personnelles (nom, prénom, date de naissance, email, téléphone)
 * et son mot de passe. Il peut également initier la suppression de son compte.
 * La section adresse a été supprimée pour des raisons de RGPD et de minimisation des données.
 *
 * Utilise des formulaires réactifs pour la saisie des données et la stratégie de détection
 * de changements `OnPush` pour optimiser les performances.
 *
 * @example
 * <app-moncompte></app-moncompte> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-moncompte',      // Sélecteur CSS du composant.
  standalone: true,              // Indique que c'est un composant autonome.
  imports: [                     // Dépendances pour le template.
    CommonModule,                // Pour les directives @if, formatDate, etc.
    ReactiveFormsModule,         // Pour les formulaires réactifs `[formGroup]`.
    LucideAngularModule,         // Pour les icônes.
    FormsModule,                 // Pour `[(ngModel)]` (utilisé pour `deleteConfirmationInput`).
    RouterLink                   // Pour `routerLink` dans le bouton de déconnexion.
  ],
  templateUrl: './moncompte.component.html',   // Chemin vers le fichier HTML.
  styleUrls: ['./moncompte.component.scss'],     // Chemin vers le fichier SCSS.
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation de la détection de changements.
})
export class MonCompteComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @description Service d'authentification, utilisé ici pour la méthode de déconnexion.
   * Le template y accède directement.
   */
  auth = inject(AuthService);
  /**
   * @private
   * @description La locale (ex: 'fr-FR') actuelle de l'application, injectée pour formater les dates.
   */
  private locale = inject(LOCALE_ID);
  /**
   * @private
   * @description Service Angular pour la navigation programmatique (utilisé après la suppression du compte).
   */
  private router = inject(Router);
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   */
  private fb = inject(FormBuilder);
  /**
   * @private
   * @description Service pour les opérations CRUD liées aux informations du membre.
   */
  private membreService = inject(MembreService);
  /**
   * @private
   * @description Service pour afficher des notifications et des boîtes de dialogue de confirmation.
   */
  private notification = inject(SweetAlertService);
  private authService = inject(AuthService);
  /**
   * @private
   * @description Service Angular pour contrôler manuellement la détection de changements.
   * Nécessaire avec la stratégie `ChangeDetectionStrategy.OnPush`.
   */
  private cdr = inject(ChangeDetectorRef);

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {FormGroup} infoForm
   * @description Le formulaire réactif pour les informations personnelles (sans adresse).
   * Le `!` (definite assignment assertion) indique qu'il sera initialisé dans `ngOnInit`.
   */
  infoForm!: FormGroup;
  /**
   * @property {FormGroup} passwordForm
   * @description Le formulaire réactif pour le changement de mot de passe.
   * Le `!` indique qu'il sera initialisé dans `ngOnInit`.
   */
  passwordForm!: FormGroup;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si le chargement initial des données du profil est en cours.
   * @default true
   */
  isLoading = true;
  /**
   * @property {boolean} isSavingInfo
   * @description Booléen indiquant si la sauvegarde des informations personnelles est en cours.
   * @default false
   */
  isSavingInfo = false;
  /**
   * @property {boolean} isChangingPassword
   * @description Booléen indiquant si la modification du mot de passe est en cours.
   * @default false
   */
  isChangingPassword = false; // Ajout de cette propriété.

  // Abonnements RxJS pour un nettoyage propre dans ngOnDestroy.
  /**
   * @private
   * @property {Subscription | null} infoSubscription
   * @description Abonnement à l'Observable pour le chargement des données du profil.
   */
  private infoSubscription: Subscription | null = null;
  /**
   * @private
   * @property {Subscription | null} updateInfoSubscription
   * @description Abonnement à l'Observable pour la mise à jour des informations personnelles.
   */
  private updateInfoSubscription: Subscription | null = null;
  /**
   * @private
   * @property {Subscription | null} changePasswordSubscription
   * @description Abonnement à l'Observable pour la modification du mot de passe.
   */
  private changePasswordSubscription: Subscription | null = null; // Ajout de cette propriété.
  /**
   * @private
   * @property {Subscription | null} deleteSubscription
   * @description Abonnement à l'Observable pour la suppression du compte.
   */
  private deleteSubscription: Subscription | null = null;

  // --- État pour la suppression de compte ---
  /**
   * @property {boolean} showDeleteConfirmation
   * @description Contrôle la visibilité de la section de confirmation de suppression.
   * @default false
   */
  showDeleteConfirmation = false;
  /**
   * @property {string} deleteConfirmationInput
   * @description La valeur saisie par l'utilisateur dans le champ de confirmation.
   * @default ''
   */
  deleteConfirmationInput = '';
  /**
   * @property {string} requiredConfirmationPhrase
   * @description La phrase exacte que l'utilisateur doit taper pour confirmer la suppression.
   * Générée dynamiquement.
   * @default ''
   */
  requiredConfirmationPhrase = '';
  /**
   * @property {boolean} isDeletingAccount
   * @description Booléen indiquant si l'opération de suppression du compte est en cours.
   * @default false
   */
  isDeletingAccount = false;


  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Initialise les formulaires et lance le chargement des données du profil utilisateur.
   * @see {@link initializeInfoForm}
   * @see {@link initializePasswordForm}
   * @see {@link loadCurrentUserData}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("MonCompteComponent: Initialisation.");
    this.initializeInfoForm();
    this.initializePasswordForm();
    this.loadCurrentUserData();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de tous les abonnements actifs pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("MonCompteComponent: Destruction, désinscription des abonnements.");
    this.infoSubscription?.unsubscribe();
    this.updateInfoSubscription?.unsubscribe();
    this.changePasswordSubscription?.unsubscribe(); // N'oubliez pas de désinscrire celui-ci aussi.
    this.deleteSubscription?.unsubscribe();
  }

  // --- INITIALISATION DES FORMULAIRES ---
  /**
   * @private
   * @method initializeInfoForm
   * @description Initialise la structure du formulaire `infoForm` (informations personnelles)
   * avec ses `FormControl` et validateurs. Les champs d'adresse ont été supprimés.
   * Le formulaire est initialement désactivé.
   * @returns {void}
   */
  private initializeInfoForm(): void {
    this.infoForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      date_naissance: ['', Validators.required], // Type 'date' dans le HTML
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required] // Validateur 'required' ajouté comme dans votre .ts original.
      // Les champs numero_voie, rue, codepostal, ville ont été supprimés.
    });
    this.infoForm.disable(); // Désactivé par défaut jusqu'au chargement des données.
    console.log("MonCompteComponent: Formulaire d'informations personnelles initialisé.");
  }

  /**
   * @private
   * @method initializePasswordForm
   * @description Initialise la structure du formulaire `passwordForm` (changement de mot de passe)
   * avec ses `FormControl` et validateurs, y compris un validateur personnalisé
   * pour vérifier que les nouveaux mots de passe correspondent.
   * @see {@link passwordMatchValidator}
   * @returns {void}
   */
  private initializePasswordForm(): void {
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity() // si vous avez ce validateur
      ]],
      confirm_password: ['', Validators.required]
    }, { validators: PasswordValidators.passwordMatch('new_password', 'confirm_password') });
  }


  // --- CHARGEMENT DES DONNÉES UTILISATEUR ---
  /**
   * @private
   * @method loadCurrentUserData
   * @description Charge les données du profil de l'utilisateur actuellement connecté
   * via `MembreService.getCurrentUserProfile()`.
   * Pré-remplit le formulaire `infoForm` avec les données reçues et l'active.
   * Gère l'état de chargement `isLoading`.
   * @returns {void}
   */
  private loadCurrentUserData(): void {
    this.isLoading = true;
    this.infoForm.disable();  // Garde le formulaire désactivé pendant le chargement.
    this.cdr.detectChanges(); // Met à jour l'UI pour l'état de chargement.

    console.log("MonCompteComponent: Début du chargement des données du profil utilisateur.");
    this.infoSubscription = this.membreService.getCurrentUserProfile().subscribe({
      next: (data: Membre) => {
        console.log('MonCompteComponent: Données du profil utilisateur chargées:', data);
        // Prépare les données pour le formulaire, notamment le formatage de la date.
        const formattedData = {
          ...data,
          // La date de naissance de l'API (si string) est formatée pour l'input type="date".
          date_naissance: this.formatDateForInput(data.date_naissance)
        };
        this.infoForm.patchValue(formattedData); // Remplit le formulaire.
        this.infoForm.enable();                  // Active le formulaire pour l'édition.
        this.isLoading = false;
        this.cdr.detectChanges(); // Met à jour l'UI avec les données.
      },
      error: (err: HttpErrorResponse) => {
        console.error("MonCompteComponent: Erreur lors du chargement des données du profil:", err);
        this.notification.show(err.message || "Erreur lors du chargement de votre profil.", "error");
        this.isLoading = false;
        // Le formulaire reste désactivé.
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @private
   * @method formatDateForInput
   * @description Fonction utilitaire pour formater une date (provenant de l'API ou d'un objet Date)
   * en une chaîne au format `YYYY-MM-DD`, qui est le format attendu par un `<input type="date">`.
   * @param {string | Date | undefined | null} dateValue - La valeur de date à formater.
   * @returns {string | null} La date formatée ou `null` si la date d'entrée est invalide/nulle.
   */
  private formatDateForInput(dateValue: string | Date | undefined | null): string | null {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue); // Tente de parser la valeur de date.
      // Vérifie si le parsing a réussi et si la date est valide.
      if (isNaN(date.getTime())) {
        console.warn("MonCompteComponent - formatDateForInput: Date invalide reçue:", dateValue);
        return null;
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mois de 0-11 -> 1-12.
      const day = date.getDate().toString().padStart(2, '0');          // Jour du mois.
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("MonCompteComponent - formatDateForInput: Erreur lors du formatage de la date:", e, "Valeur d'entrée:", dateValue);
      return null;
    }
  }

  // --- ACTIONS UTILISATEUR ---
  /**
   * @method updatePersonalInfo
   * @description Gère la soumission du formulaire `infoForm` pour mettre à jour les informations personnelles.
   * Vérifie la validité du formulaire, prépare les données (sans les champs d'adresse),
   * et appelle `MembreService.updateCurrentUserProfile()`.
   * Gère l'état `isSavingInfo` et les notifications de succès/erreur.
   * @returns {void}
   */
  updatePersonalInfo(): void {
    if (this.infoForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire d\'informations personnelles.', 'warning');
      this.infoForm.markAllAsTouched(); // Affiche les messages d'erreur pour les champs invalides.
      return;
    }
    if (this.isSavingInfo) return; // Empêche la double soumission.

    this.isSavingInfo = true;
    this.infoForm.disable();    // Désactive le formulaire pendant la sauvegarde.
    this.cdr.detectChanges();   // Met à jour l'UI.

    // Récupère uniquement les valeurs du formulaire `infoForm` (sans adresse).
    const updatedInfo: Partial<Membre> = this.infoForm.value;
    // L'API PUT `/api/membres/profile` ne devrait plus attendre de champs d'adresse.

    console.log("MonCompteComponent: Soumission des informations personnelles mises à jour:", updatedInfo);
    this.updateInfoSubscription = this.membreService.updateCurrentUserProfile(updatedInfo).subscribe({
      next: (updatedMembre: Membre) => { // L'API retourne le membre mis à jour.
        this.notification.show('Vos informations personnelles ont été mises à jour avec succès.', 'success');
        this.isSavingInfo = false;
        this.infoForm.enable(); // Réactive le formulaire.
        // Repatche le formulaire avec les données retournées par l'API (qui pourraient être formatées différemment).
        const formattedData = {...updatedMembre, date_naissance: this.formatDateForInput(updatedMembre.date_naissance)};
        this.infoForm.patchValue(formattedData);
        this.infoForm.markAsPristine(); // Marque le formulaire comme non modifié après sauvegarde.
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error("MonCompteComponent: Erreur lors de la mise à jour des informations personnelles:", err);
        this.notification.show(err.message || 'Une erreur est survenue lors de la mise à jour de vos informations.', 'error');
        this.isSavingInfo = false;
        this.infoForm.enable(); // Réactive pour permettre la correction.
        this.cdr.detectChanges();
      }
    });
  }


  // --- GESTION DE LA SUPPRESSION DE COMPTE ---
  /**
   * @method initiateAccountDeletion
   * @description Initialise le processus de suppression de compte.
   * Génère la phrase de confirmation dynamique (avec la date du jour) et affiche la section de confirmation.
   * @returns {void}
   */
  initiateAccountDeletion(): void {
    const today = new Date();
    // Utilise formatDate (injecté via LOCALE_ID) pour un formatage localisé.
    const formattedDate = formatDate(today, 'dd/MM/yyyy', this.locale);
    this.requiredConfirmationPhrase = `SUPPRIMER MON COMPTE LE ${formattedDate}`;
    this.showDeleteConfirmation = true;
    this.deleteConfirmationInput = ''; // Réinitialise le champ de saisie.
    console.log(`MonCompteComponent: Initiation de la suppression du compte. Phrase requise: "${this.requiredConfirmationPhrase}"`);
    this.cdr.detectChanges(); // Met à jour l'UI.
  }

  /**
   * @method cancelAccountDeletion
   * @description Annule le processus de suppression de compte.
   * Cache la section de confirmation et réinitialise l'état.
   * @returns {void}
   */
  cancelAccountDeletion(): void {
    this.showDeleteConfirmation = false;
    this.deleteConfirmationInput = '';
    this.requiredConfirmationPhrase = ''; // Optionnel: vider la phrase.
    this.isDeletingAccount = false;      // S'assurer que cet état est réinitialisé.
    console.log("MonCompteComponent: Annulation de la suppression du compte.");
    this.cdr.detectChanges();
  }

  /**
   * @method confirmAccountDeletion
   * @description Confirme et exécute la suppression du compte de l'utilisateur.
   * Vérifie que la phrase de confirmation saisie correspond à la phrase requise.
   * Appelle `MembreService.deleteCurrentUserProfile()`.
   * Gère l'état `isDeletingAccount`, les notifications, et la redirection après succès.
   * @returns {void}
   */
  confirmAccountDeletion(): void {
    // Comparaison sensible à la casse. Si insensible souhaitée, utiliser .toUpperCase() des deux côtés.
    if (this.deleteConfirmationInput !== this.requiredConfirmationPhrase) {
      this.notification.show('La phrase de confirmation ne correspond pas. Veuillez réessayer.', 'warning');
      return;
    }
    if (this.isDeletingAccount) return; // Empêche la double soumission.

    this.isDeletingAccount = true;
    this.cdr.detectChanges(); // Met à jour l'UI pour montrer l'état de suppression.

    console.log("MonCompteComponent: Confirmation de la suppression du compte.");
    this.deleteSubscription = this.membreService.deleteCurrentUserProfile().subscribe({
      next: () => { // Le backend retourne généralement un 204 No Content ou un message de succès.
        this.isDeletingAccount = false;
        this.notification.show('Votre compte a été supprimé avec succès.', 'success');
        this.auth.deconnexion(); // Déconnecte l'utilisateur.
        this.router.navigate(['/connexion']); // Redirige vers la page de connexion ou d'accueil.
        // Pas besoin de detectChanges ici car la navigation va détruire le composant.
      },
      error: (err: HttpErrorResponse) => { // Typage de l'erreur.
        this.isDeletingAccount = false;
        const message = err.error?.message || err.message || "Une erreur est survenue lors de la suppression de votre compte.";
        this.notification.show(message, 'error');
        console.error("MonCompteComponent: Erreur lors de la suppression du compte:", err);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method changePassword
   * @description Gère la soumission du formulaire `passwordForm` pour changer le mot de passe de l'utilisateur.
   * Vérifie la validité du formulaire (y compris la correspondance des nouveaux mots de passe).
   * Appelle le service approprié (ici, on utilisera `AuthService` pour cet appel).
   * Gère l'état `isChangingPassword` et les notifications.
   * @returns {void}
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire de changement de mot de passe.', 'warning');
      this.passwordForm.markAllAsTouched(); // Affiche les messages d'erreur
      return;
    }
    if (this.isChangingPassword) return; // Empêche la double soumission

    this.isChangingPassword = true;
    this.passwordForm.disable(); // Désactive le formulaire pendant l'opération
    this.cdr.detectChanges();   // Met à jour l'UI

    const passwordData = {
      currentPassword: this.passwordForm.value.current_password,
      newPassword: this.passwordForm.value.new_password
      // La confirmation n'est généralement pas envoyée à l'API, la validation se fait côté client/groupe de formulaire.
    };

    console.log("MonCompteComponent: Tentative de changement de mot de passe.");
    // Nous allons appeler une méthode dans AuthService pour cela.
    this.changePasswordSubscription = this.authService.changePasswordConnectedUser(passwordData).subscribe({
      next: () => {
        this.notification.show('Votre mot de passe a été changé avec succès.', 'success');
        this.isChangingPassword = false;
        this.passwordForm.reset();  // Réinitialise le formulaire après succès.
        this.passwordForm.enable(); // Réactive le formulaire.
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error("MonCompteComponent: Erreur lors du changement de mot de passe:", err);
        // Essayer d'afficher le message d'erreur du backend s'il existe
        const errorMessage = err.error?.message || err.error || err.message || 'Une erreur est survenue lors du changement de mot de passe.';
        this.notification.show(errorMessage, 'error');
        this.isChangingPassword = false;
        this.passwordForm.enable(); // Réactive pour permettre une nouvelle tentative.
        this.cdr.detectChanges();
      }
    });
  }
}

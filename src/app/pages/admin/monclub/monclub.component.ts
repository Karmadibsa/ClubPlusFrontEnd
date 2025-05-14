// ----- IMPORTATIONS -----
import {
  ChangeDetectionStrategy, // Stratégie pour optimiser la détection de changements.
  ChangeDetectorRef,       // Outil pour contrôler manuellement la détection de changements.
  Component,
  inject,                   // Fonction moderne pour l'injection de dépendances.
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common'; // Pour @if, @for (ou NgIf/NgForOf).
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'; // Pour les formulaires réactifs et template-driven (FormsModule pour [(ngModel)] si utilisé).
import { Subscription } from 'rxjs';          // Pour gérer la désinscription des Observables.
import { HttpErrorResponse } from '@angular/common/http'; // Pour typer les erreurs API.
import { Router } from '@angular/router';     // Pour la navigation programmatique (ex: après suppression).

// Services
import { ClubService } from '../../../service/crud/club.service'; // Service pour les opérations CRUD sur le club.
import { AuthService } from '../../../service/security/auth.service'; // Pour obtenir l'ID du club géré.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Modèles (Interfaces de données)
import { Club } from '../../../model/club'; // Interface décrivant un club.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component MonclubComponent
 * @description
 * Page permettant à un utilisateur (généralement un administrateur de club) de visualiser,
 * modifier et supprimer les informations de son club.
 * Elle utilise un formulaire réactif pour l'édition des données et une double confirmation
 * pour l'action de suppression.
 *
 * La stratégie de détection de changements `OnPush` est activée pour optimiser les performances.
 *
 * @example
 * <app-monclub></app-monclub> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-monclub',       // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,             // Indique que c'est un composant autonome.
  imports: [                    // Dépendances nécessaires pour le template.
    CommonModule,               // Pour les directives @if, etc.
    ReactiveFormsModule,        // Indispensable pour `[formGroup]` et `formControlName`.
    LucideAngularModule,        // Pour les icônes.
    FormsModule                 // Pour `[(ngModel)]` (utilisé pour `deleteConfirmationInput`).
  ],
  templateUrl: './monclub.component.html',   // Chemin vers le fichier HTML du composant.
  styleUrls: ['./monclub.component.scss'],     // Chemin vers le fichier SCSS/CSS (corrigé en `styleUrls`).
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation de la détection de changements.
})
export class MonclubComponent implements OnInit, OnDestroy {

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {FormGroup} clubForm
   * @description Le formulaire réactif Angular utilisé pour afficher et modifier les informations du club.
   * Le `!` (definite assignment assertion) indique qu'il sera initialisé dans `ngOnInit`.
   */
  clubForm!: FormGroup;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si le chargement initial des données du club est en cours.
   * @default false
   */
  isLoading = false;
  /**
   * @property {boolean} isSaving
   * @description Booléen indiquant si une opération de sauvegarde (mise à jour) des données du club est en cours.
   * @default false
   */
  isSaving = false;
  /**
   * @private
   * @property {number | null} clubId
   * @description L'ID du club actuellement géré par l'utilisateur. Récupéré via `AuthService`.
   * @default null
   */
  private clubId: number | null = null;

  // Abonnements aux Observables pour un nettoyage propre dans ngOnDestroy.
  /**
   * @private
   * @property {Subscription | null} clubDataSubscription
   * @description Abonnement à l'Observable pour le chargement des données du club.
   */
  private clubDataSubscription: Subscription | null = null;
  /**
   * @private
   * @property {Subscription | null} clubUpdateSubscription
   * @description Abonnement à l'Observable pour la mise à jour des données du club.
   */
  private clubUpdateSubscription: Subscription | null = null;
  /**
   * @private
   * @property {Subscription | null} clubDeleteSubscription
   * @description Abonnement à l'Observable pour la suppression du club.
   */
  private clubDeleteSubscription: Subscription | null = null;

  // Propriétés pour la confirmation de suppression
  /**
   * @property {boolean} showDeleteConfirmation
   * @description Contrôle la visibilité de la section de confirmation de suppression.
   * @default false
   */
  showDeleteConfirmation: boolean = false;
  /**
   * @property {string} requiredConfirmationPhrase
   * @description La phrase exacte que l'utilisateur doit taper pour confirmer la suppression.
   * Générée dynamiquement avec la date du jour.
   * @default 'supprimer mon club' (sera mis à jour dynamiquement)
   */
  requiredConfirmationPhrase: string = 'supprimer mon club';
  /**
   * @property {string} deleteConfirmationInput
   * @description La valeur saisie par l'utilisateur dans le champ de confirmation de suppression.
   * Liée via `[(ngModel)]`.
   * @default ''
   */
  deleteConfirmationInput: string = '';
  /**
   * @property {boolean} isDeletingClub
   * @description Booléen indiquant si l'opération de suppression du club est en cours.
   * @default false
   */
  isDeletingClub: boolean = false;

  // --- INJECTION DES SERVICES via inject() ---
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   */
  private fb = inject(FormBuilder);
  /**
   * @private
   * @description Service pour effectuer les opérations CRUD liées au club.
   */
  private clubService = inject(ClubService);
  /**
   * @private
   * @description Service d'authentification pour obtenir des informations sur l'utilisateur et le club géré.
   */
  private authService = inject(AuthService);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) à l'utilisateur.
   */
  private notification = inject(SweetAlertService);
  /**
   * @protected
   * @description Service Angular pour contrôler manuellement la détection de changements.
   * `protected` pour un accès potentiel dans le template (bien que non typique pour `cdr`).
   * Principalement utilisé avec `ChangeDetectionStrategy.OnPush`.
   */
  protected cdr = inject(ChangeDetectorRef);
  /**
   * @private
   * @description Service Angular pour la navigation programmatique entre les routes.
   */
  private router = inject(Router);

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Récupère l'ID du club géré, initialise la structure du formulaire, et lance le chargement
   * des données du club si un ID est disponible.
   * @see {@link initializeForm}
   * @see {@link loadClubData}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("MonclubComponent: Initialisation.");
    this.clubId = this.authService.getManagedClubId();
    this.initializeForm();

    if (this.clubId !== null) {
      console.log(`MonclubComponent: Chargement des données pour le club ID: ${this.clubId}.`);
      this.loadClubData(this.clubId);
    } else {
      console.error("MonclubComponent: Aucun ID de club géré trouvé. Impossible de charger les données.");
      this.notification.show("Erreur: Impossible de déterminer le club à charger. Veuillez contacter le support.", "error");
      this.isLoading = false;
      this.clubForm.disable(); // Le formulaire reste désactivé.
      this.cdr.detectChanges(); // Met à jour l'UI.
    }
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de tous les abonnements actifs pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("MonclubComponent: Destruction, désinscription des abonnements.");
    this.clubDataSubscription?.unsubscribe();
    this.clubUpdateSubscription?.unsubscribe();
    this.clubDeleteSubscription?.unsubscribe();
  }

  // --- INITIALISATION ET CHARGEMENT DU FORMULAIRE ---
  /**
   * @private
   * @method initializeForm
   * @description Initialise la structure du `clubForm` avec ses `FormControl` et validateurs.
   * Le formulaire est initialement désactivé.
   * @returns {void}
   */
  private initializeForm(): void {
    this.clubForm = this.fb.group({
      nom: ['', Validators.required],
      numero_voie: ['', Validators.required],
      rue: ['', Validators.required],
      codepostal: ['', Validators.required],
      ville: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      codeClub: [{ value: '', disabled: true }] // Champ 'codeClub' non modifiable par l'utilisateur.
    });
    this.clubForm.disable(); // Désactivé par défaut jusqu'au chargement des données.
    console.log("MonclubComponent: Formulaire initialisé et désactivé.");
  }

  /**
   * @private
   * @method loadClubData
   * @description Charge les données du club spécifié par son ID en utilisant `ClubService`.
   * Pré-remplit le formulaire avec les données reçues et l'active.
   * Gère les états de chargement et les erreurs.
   * @param {number} id - L'ID du club à charger.
   * @returns {void}
   */
  private loadClubData(id: number): void {
    this.isLoading = true;
    this.clubForm.disable(); // Garde le formulaire désactivé pendant le chargement.
    this.cdr.detectChanges(); // Met à jour l'UI pour montrer l'état de chargement.

    console.log(`MonclubComponent: Début du chargement des données du club ID: ${id} via ClubService.`);
    this.clubDataSubscription = this.clubService.getClubDetails(id).subscribe({
      next: (data: Club) => {
        console.log('MonclubComponent: Données du club chargées avec succès:', data);
        this.clubForm.patchValue(data); // Remplit le formulaire.
        this.clubForm.enable();         // Active les champs modifiables.
        this.clubForm.get('codeClub')?.disable(); // S'assure que 'codeClub' reste désactivé.
        this.isLoading = false;
        this.cdr.detectChanges(); // Met à jour l'UI avec le formulaire rempli.
      },
      error: (err: HttpErrorResponse) => {
        console.error('MonclubComponent: Erreur lors du chargement des données du club:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors du chargement des informations du club.', 'error');
        this.isLoading = false;
        // Le formulaire reste désactivé car les données n'ont pas pu être chargées.
        this.cdr.detectChanges();
      }
    });
  }

  // --- ACTIONS UTILISATEUR ---
  /**
   * @method copyCodeClub
   * @description Copie la valeur du champ 'codeClub' (qui est désactivé) dans le presse-papiers.
   * Affiche une notification de succès ou d'erreur.
   * @returns {void}
   */
  copyCodeClub(): void {
    const codeClub = this.clubForm.getRawValue().codeClub; // `getRawValue` pour lire un champ désactivé.
    if (codeClub) {
      navigator.clipboard.writeText(codeClub).then(
        () => {
          console.log("MonclubComponent: Code Club copié dans le presse-papiers:", codeClub);
          this.notification.show('Code Club copié dans le presse-papiers !', 'success');
        },
        (err) => {
          console.error('MonclubComponent: Erreur lors de la copie du Code Club:', err);
          this.notification.show('Erreur lors de la copie du Code Club.', 'error');
        }
      );
    } else {
      this.notification.show('Le Code Club n\'est pas disponible pour la copie.', 'warning');
    }
  }

  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire de modification du club.
   * Vérifie la validité du formulaire, prépare les données et appelle `ClubService` pour la mise à jour.
   * Gère les états de sauvegarde et les notifications de succès/erreur.
   * @returns {void}
   */
  onSubmit(): void {
    if (this.clubForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire.', 'warning');
      this.clubForm.markAllAsTouched(); // Affiche les erreurs de validation.
      return;
    }
    if (this.clubId === null) {
      this.notification.show("Erreur: ID du club inconnu. Impossible de sauvegarder.", "error");
      return;
    }
    if (this.isSaving) return; // Empêche la double soumission.

    this.isSaving = true;
    this.clubForm.disable(); // Désactive le formulaire pendant la sauvegarde.
    this.cdr.detectChanges(); // Met à jour l'UI.

    const updatedClubData: Partial<Club> = this.clubForm.value; // Récupère les valeurs des champs activés.

    console.log(`MonclubComponent: Soumission des modifications pour le club ID: ${this.clubId}`, updatedClubData);
    this.clubUpdateSubscription = this.clubService.updateClub(this.clubId, updatedClubData).subscribe({
      next: (updatedClub: Club) => {
        console.log('MonclubComponent: Club mis à jour avec succès:', updatedClub);
        this.notification.show('Les informations du club ont été mises à jour avec succès.', 'success');
        this.isSaving = false;
        this.clubForm.enable(); // Réactive le formulaire.
        this.clubForm.get('codeClub')?.disable(); // 'codeClub' reste désactivé.
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('MonclubComponent: Erreur lors de la mise à jour du club:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors de la mise à jour.', 'error');
        this.isSaving = false;
        this.clubForm.enable(); // Réactive pour permettre correction.
        this.clubForm.get('codeClub')?.disable();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method onReset
   * @description Réinitialise le formulaire à ses valeurs initiales en rechargeant les données
   * du club depuis l'API. Empêche la réinitialisation si une opération est déjà en cours.
   * @returns {void}
   */
  onReset(): void {
    if (this.clubId !== null && !this.isLoading && !this.isSaving) {
      console.log("MonclubComponent: Demande de réinitialisation du formulaire par rechargement des données.");
      this.loadClubData(this.clubId);
    } else if (this.isLoading || this.isSaving) {
      this.notification.show("Veuillez attendre la fin de l'opération en cours avant de réinitialiser.", "info");
    } else {
      this.notification.show("Impossible de réinitialiser : les données initiales du club n'ont pas été chargées.", "warning");
    }
  }

  // --- GESTION DE LA SUPPRESSION DU CLUB ---
  /**
   * @method initiateClubDeletion
   * @description Initialise le processus de suppression du club.
   * Génère la phrase de confirmation dynamique (avec la date du jour) et affiche
   * la section de confirmation de suppression dans l'interface utilisateur.
   * @returns {void}
   */
  initiateClubDeletion(): void {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', { // Format de date français.
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    this.requiredConfirmationPhrase = `Supprimer mon club le ${formattedDate}`;
    this.showDeleteConfirmation = true; // Affiche la section de confirmation.
    this.deleteConfirmationInput = '';  // Vide le champ de saisie.
    console.log(`MonclubComponent: Initiation de la suppression du club. Phrase requise: "${this.requiredConfirmationPhrase}"`);
    this.cdr.detectChanges(); // Met à jour l'UI.
  }

  /**
   * @method cancelClubDeletion
   * @description Annule le processus de suppression du club.
   * Cache la section de confirmation et réinitialise l'état `isDeletingClub`.
   * @returns {void}
   */
  cancelClubDeletion(): void {
    this.showDeleteConfirmation = false;
    this.isDeletingClub = false;
    console.log("MonclubComponent: Annulation de la suppression du club.");
    this.cdr.detectChanges();
  }

  /**
   * @method confirmClubDeletion
   * @description Confirme et exécute la suppression du club après vérification de la phrase de confirmation.
   * Appelle `ClubService.deleteClub()`. Gère l'état de suppression et les notifications.
   * Redirige l'utilisateur après une suppression réussie.
   * @returns {void}
   */
  confirmClubDeletion(): void {
    // Vérifications de sécurité avant de procéder.
    if (this.clubId === null) {
      this.notification.show("Erreur: ID du club inconnu. Suppression impossible.", "error");
      return;
    }
    if (this.deleteConfirmationInput !== this.requiredConfirmationPhrase) {
      this.notification.show("La phrase de confirmation est incorrecte. Veuillez la retaper.", "warning");
      return;
    }
    if (this.isDeletingClub) return; // Empêche la double soumission.

    this.isDeletingClub = true; // Active l'indicateur de suppression.
    this.cdr.detectChanges();   // Met à jour l'UI.

    console.log(`MonclubComponent: Confirmation de la suppression du club ID: ${this.clubId}.`);
    this.clubDeleteSubscription = this.clubService.deleteClub(this.clubId).subscribe({
      next: () => {
        console.log('MonclubComponent: Club supprimé avec succès.');
        this.notification.show('Le club a été supprimé avec succès.', 'success');
        this.isDeletingClub = false;
        // Redirige l'utilisateur, par exemple vers une page d'accueil ou un tableau de bord différent.
        this.router.navigate(['/accueil']);
        // La navigation changera la vue, donc detectChanges n'est pas forcément nécessaire ici.
      },
      error: (err: HttpErrorResponse) => {
        console.error('MonclubComponent: Erreur lors de la suppression du club:', err);
        this.isDeletingClub = false;

        // Gestion spécifique de l'erreur 409 (Conflict) si l'API la renvoie.
        // Adaptez la condition au message/code d'erreur exact de votre API.
        if (err.status === 409 || err.error?.message?.includes('evenements actifs futurs')) {
          this.notification.show('Impossible de supprimer le club : des événements futurs sont encore planifiés ou des réservations existent. Veuillez les annuler ou les supprimer d\'abord.', 'error');
        } else {
          this.notification.show(err.message || 'Une erreur est survenue lors de la suppression du club.', 'error');
        }
        this.showDeleteConfirmation = false; // Cache la confirmation en cas d'erreur.
        this.cdr.detectChanges();          // Met à jour l'UI.
      }
    });
  }
}

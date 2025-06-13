import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  LOCALE_ID
} from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { MembreService } from '../../../service/crud/membre.service';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { Membre } from '../../../model/membre';

import { LucideAngularModule } from 'lucide-angular';
import {PasswordValidators} from '../../../service/validator/password.validator';

/**
 * @Component MonCompteComponent
 * @description Page de gestion du compte personnel.
 * Permet de modifier les informations personnelles, le mot de passe et de supprimer le compte.
 * Utilise des formulaires réactifs et la stratégie `OnPush` pour optimiser les performances.
 */
@Component({
  selector: 'app-moncompte',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './moncompte.component.html',
  styleUrls: ['./moncompte.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonCompteComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  auth = inject(AuthService);
  private locale = inject(LOCALE_ID);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private membreService = inject(MembreService);
  private notification = inject(SweetAlertService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); // Nécessaire avec `OnPush`.

  // --- ÉTAT DU COMPOSANT ---
  /** Formulaire réactif pour les informations personnelles. */
  infoForm!: FormGroup;
  /** Formulaire réactif pour le changement de mot de passe. */
  passwordForm!: FormGroup;
  /** Indique si le chargement initial des données du profil est en cours. */
  isLoading = true;
  /** Indique si la sauvegarde des informations personnelles est en cours. */
  isSavingInfo = false;
  /** Indique si la modification du mot de passe est en cours. */
  isChangingPassword = false;

  // Abonnements RxJS pour un nettoyage propre.
  private infoSubscription: Subscription | null = null;
  private updateInfoSubscription: Subscription | null = null;
  private changePasswordSubscription: Subscription | null = null;
  private deleteSubscription: Subscription | null = null;

  // --- État pour la suppression de compte ---
  /** Contrôle la visibilité de la section de confirmation de suppression. */
  showDeleteConfirmation = false;
  /** Valeur saisie par l'utilisateur pour la confirmation. */
  deleteConfirmationInput = '';
  /** Phrase exacte requise pour la confirmation de suppression. */
  requiredConfirmationPhrase = '';
  /** Indique si l'opération de suppression est en cours. */
  isDeletingAccount = false;


  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Initialise les formulaires et charge les données du profil.
   */
  ngOnInit(): void {
    console.log("MonCompteComponent: Initialisation.");
    this.initializeInfoForm();
    this.initializePasswordForm();
    this.loadCurrentUserData();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction. Désabonne tous les Observables actifs.
   */
  ngOnDestroy(): void {
    console.log("MonCompteComponent: Destruction, désinscription des abonnements.");
    this.infoSubscription?.unsubscribe();
    this.updateInfoSubscription?.unsubscribe();
    this.changePasswordSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
  }

  // --- INITIALISATION DES FORMULAIRES ---
  /**
   * @private
   * @method initializeInfoForm
   * @description Initialise le formulaire des informations personnelles.
   */
  private initializeInfoForm(): void {
    this.infoForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      date_naissance: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required]
    });
    this.infoForm.disable();
    console.log("MonCompteComponent: Formulaire d'informations personnelles initialisé.");
  }

  /**
   * @private
   * @method initializePasswordForm
   * @description Initialise le formulaire de changement de mot de passe.
   */
  private initializePasswordForm(): void {
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [
        Validators.required,
        PasswordValidators.passwordComplexity()
      ]],
      confirm_password: ['', Validators.required]
    }, { validators: PasswordValidators.passwordMatch('new_password', 'confirm_password') });
  }


  // --- CHARGEMENT DES DONNÉES UTILISATEUR ---
  /**
   * @private
   * @method loadCurrentUserData
   * @description Charge les données du profil utilisateur.
   */
  private loadCurrentUserData(): void {
    this.isLoading = true;
    this.infoForm.disable();
    this.cdr.detectChanges();

    console.log("MonCompteComponent: Début du chargement des données du profil utilisateur.");
    this.infoSubscription = this.membreService.getCurrentUserProfile().subscribe({
      next: (data: Membre) => {
        console.log('MonCompteComponent: Données du profil utilisateur chargées:', data);
        const formattedData = {
          ...data,
          date_naissance: this.formatDateForInput(data.date_naissance)
        };
        this.infoForm.patchValue(formattedData);
        this.infoForm.enable();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error("MonCompteComponent: Erreur lors du chargement des données du profil:", err);
        this.notification.show(err.message || "Erreur lors du chargement de votre profil.", "error");
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @private
   * @method formatDateForInput
   * @description Formate une date en chaîne `YYYY-MM-DD` pour les inputs de type `date`.
   * @param dateValue La valeur de date à formater.
   * @returns La date formatée ou `null`.
   */
  private formatDateForInput(dateValue: string | Date | undefined | null): string | null {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        console.warn("MonCompteComponent - formatDateForInput: Date invalide reçue:", dateValue);
        return null;
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("MonCompteComponent - formatDateForInput: Erreur lors du formatage de la date:", e, "Valeur d'entrée:", dateValue);
      return null;
    }
  }

  // --- ACTIONS UTILISATEUR ---
  /**
   * @method updatePersonalInfo
   * @description Gère la soumission du formulaire d'informations personnelles.
   */
  updatePersonalInfo(): void {
    if (this.infoForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire d\'informations personnelles.', 'warning');
      this.infoForm.markAllAsTouched();
      return;
    }
    if (this.isSavingInfo) return;

    this.isSavingInfo = true;
    this.infoForm.disable();
    this.cdr.detectChanges();

    const updatedInfo: Partial<Membre> = this.infoForm.value;

    console.log("MonCompteComponent: Soumission des informations personnelles mises à jour:", updatedInfo);
    this.updateInfoSubscription = this.membreService.updateCurrentUserProfile(updatedInfo).subscribe({
      next: (updatedMembre: Membre) => {
        this.notification.show('Vos informations personnelles ont été mises à jour avec succès.', 'success');
        this.isSavingInfo = false;
        this.infoForm.enable();
        const formattedData = {...updatedMembre, date_naissance: this.formatDateForInput(updatedMembre.date_naissance)};
        this.infoForm.patchValue(formattedData);
        this.infoForm.markAsPristine();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error("MonCompteComponent: Erreur lors de la mise à jour des informations personnelles:", err);
        this.notification.show(err.message || 'Une erreur est survenue lors de la mise à jour de vos informations.', 'error');
        this.isSavingInfo = false;
        this.infoForm.enable();
        this.cdr.detectChanges();
      }
    });
  }


  // --- GESTION DE LA SUPPRESSION DE COMPTE ---
  /**
   * @method initiateAccountDeletion
   * @description Lance le processus de suppression en générant la phrase de confirmation.
   */
  initiateAccountDeletion(): void {
    const today = new Date();
    const formattedDate = formatDate(today, 'dd/MM/yyyy', this.locale);
    this.requiredConfirmationPhrase = `SUPPRIMER MON COMPTE LE ${formattedDate}`;
    this.showDeleteConfirmation = true;
    this.deleteConfirmationInput = '';
    console.log(`MonCompteComponent: Initiation de la suppression du compte. Phrase requise: "${this.requiredConfirmationPhrase}"`);
    this.cdr.detectChanges();
  }

  /**
   * @method cancelAccountDeletion
   * @description Annule le processus de suppression de compte.
   */
  cancelAccountDeletion(): void {
    this.showDeleteConfirmation = false;
    this.deleteConfirmationInput = '';
    this.requiredConfirmationPhrase = '';
    this.isDeletingAccount = false;
    console.log("MonCompteComponent: Annulation de la suppression du compte.");
    this.cdr.detectChanges();
  }

  /**
   * @method confirmAccountDeletion
   * @description Confirme et exécute la suppression du compte après vérification de la phrase.
   */
  confirmAccountDeletion(): void {
    if (this.deleteConfirmationInput !== this.requiredConfirmationPhrase) {
      this.notification.show('La phrase de confirmation ne correspond pas. Veuillez réessayer.', 'warning');
      return;
    }
    if (this.isDeletingAccount) return;

    this.isDeletingAccount = true;
    this.cdr.detectChanges();

    console.log("MonCompteComponent: Confirmation de la suppression du compte.");
    this.deleteSubscription = this.membreService.deleteCurrentUserProfile().subscribe({
      next: () => {
        this.isDeletingAccount = false;
        this.notification.show('Votre compte a été supprimé avec succès.', 'success');
        this.auth.deconnexion();
        this.router.navigate(['/connexion']);
      },
      error: (err: HttpErrorResponse) => {
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
   * @description Gère la soumission du formulaire de changement de mot de passe.
   */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire de changement de mot de passe.', 'warning');
      this.passwordForm.markAllAsTouched();
      return;
    }
    if (this.isChangingPassword) return;

    this.isChangingPassword = true;
    this.passwordForm.disable();
    this.cdr.detectChanges();

    const passwordData = {
      currentPassword: this.passwordForm.value.current_password,
      newPassword: this.passwordForm.value.new_password
    };

    console.log("MonCompteComponent: Tentative de changement de mot de passe.");
    this.changePasswordSubscription = this.authService.changePasswordConnectedUser(passwordData).subscribe({
      next: () => {
        this.notification.show('Votre mot de passe a été changé avec succès.', 'success');
        this.isChangingPassword = false;
        this.passwordForm.reset();
        this.passwordForm.enable();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error("MonCompteComponent: Erreur lors du changement de mot de passe:", err);
        const errorMessage = err.error?.message || err.error || err.message || 'Une erreur est survenue lors du changement de mot de passe.';
        this.notification.show(errorMessage, 'error');
        this.isChangingPassword = false;
        this.passwordForm.enable();
        this.cdr.detectChanges();
      }
    });
  }
}

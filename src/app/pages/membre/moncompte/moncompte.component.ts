// ----- IMPORTATIONS -----
import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
  LOCALE_ID
} from '@angular/core';
import {CommonModule, DatePipe, formatDate} from '@angular/common'; // Pour @if etc.
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'; // ReactiveFormsModule requis pour [formGroup]
import {Observable, Subscription} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { MembreService } from '../../../service/membre.service'; // Service pour les données du membre
import { NotificationService } from '../../../service/notification.service'; // Pour les messages

// Composants
import { SidebarComponent } from '../../../component/navigation/sidebar/sidebar.component';

// Modèles
import { Membre } from '../../../model/membre'; // L'interface Membre

// Autres
import { LucideAngularModule } from 'lucide-angular';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../service/security/auth.service';
import {SidebarStateService} from '../../../service/sidebar-state.service';

@Component({
  selector: 'app-moncompte',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Important pour utiliser [formGroup] et formControlName
    SidebarComponent,
    DatePipe,
    LucideAngularModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './moncompte.component.html',
  styleUrls: ['./moncompte.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Active OnPush
})
export class MonCompteComponent implements OnInit, OnDestroy {

  auth = inject(AuthService)

  private locale = inject(LOCALE_ID); // Injecter LOCALE_ID pour le formatage automatique

  private router = inject(Router); // Injecter Router
  // --- État du Composant ---
  infoForm!: FormGroup;
  passwordForm!: FormGroup; // On ignore pour l'instant
  isLoading = true;       // Chargement initial des données
  isSavingInfo = false;   // Sauvegarde des infos en cours
  // isChangingPassword = false; // Ignoré pour l'instant

  // Subscriptions pour le nettoyage
  private infoSubscription: Subscription | null = null;
  private updateInfoSubscription: Subscription | null = null;
  // private changePasswordSubscription: Subscription | null = null; // Ignoré pour l'instant

  // --- Injection des Services ---
  private fb = inject(FormBuilder);
  private membreService = inject(MembreService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  // private authService = inject(AuthService); // Pas besoin si on ne gère pas le MDP ici
  requiredConfirmationPhrase = ''; // Plus de readonly, sera défini dynamiquement

  // --- État pour la suppression de compte ---
  showDeleteConfirmation = false;
  deleteConfirmationInput = '';
  // Définir la phrase exacte requise
  isDeletingAccount = false;
  private deleteSubscription: Subscription | null = null; // Pour la suppression


  ngOnInit(): void {
    this.initializeInfoForm();
    // this.initializePasswordForm(); // Ignoré pour l'instant
    this.loadCurrentUserData(); // Charge les données de l'utilisateur connecté
  }

  ngOnDestroy(): void {
    // Nettoyage des abonnements
    this.infoSubscription?.unsubscribe();
    this.updateInfoSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe(); // Nettoyer l'abonnement de suppression
    // this.changePasswordSubscription?.unsubscribe(); // Ignoré pour l'instant
  }

  // Initialisation du formulaire d'informations personnelles
  private initializeInfoForm(): void {
    this.infoForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      date_naissance: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      numero_voie: ['', Validators.required],
      rue: ['', Validators.required],
      codepostal: ['', Validators.required],
      ville: ['', Validators.required]
      // Note: Ne pas inclure le mot de passe ici !
    });
    this.infoForm.disable(); // Désactivé tant que les données ne sont pas chargées
  }

  // // Initialisation du formulaire de changement de mot de passe (IGNORÉ POUR L'INSTANT)
  // private initializePasswordForm(): void {
  //   this.passwordForm = this.fb.group({
  //     current_password: ['', Validators.required],
  //     new_password: ['', [Validators.required, Validators.minLength(6)]],
  //     confirm_password: ['', Validators.required]
  //   }, { validators: this.passwordMatchValidator });
  // }


  // Charge les données de l'utilisateur connecté via MembreService
  private loadCurrentUserData(): void {
    this.isLoading = true;
    this.infoForm.disable();
    this.cdr.detectChanges();

    this.infoSubscription = this.membreService.getCurrentUserProfile().subscribe({
      next: (data: Membre) => {
        console.log('Données utilisateur chargées:', data);
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
        console.error("Erreur lors du chargement des données de l'utilisateur", err);
        this.notification.show(err.message || "Erreur chargement profil.", "error");
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Helper pour formater la date en YYYY-MM-DD pour l'input type="date"
  private formatDateForInput(dateValue: string | Date | undefined | null): string | null {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Erreur formatage date:", e);
      return null;
    }
  }

  // Met à jour les informations personnelles via MembreService
  updatePersonalInfo(): void {
    if (this.infoForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire d\'informations.', 'warning');
      this.infoForm.markAllAsTouched();
      return;
    }
    if (this.isSavingInfo) return;

    this.isSavingInfo = true;
    this.infoForm.disable();
    this.cdr.detectChanges();

    // L'API PUT attend un objet JSON, pas besoin de spécifier responseType: 'text'
    // On envoie toutes les valeurs du formulaire (Partial<Membre>)
    const updatedInfo: Partial<Membre> = this.infoForm.value;
    // L'API PUT /api/membres/profile n'attend PAS le mot de passe dans le payload.

    this.updateInfoSubscription = this.membreService.updateCurrentUserProfile(updatedInfo).subscribe({
      next: (updatedMembre: Membre) => {
        this.notification.show('Informations personnelles mises à jour.', 'valid');
        this.isSavingInfo = false;
        this.infoForm.enable();
        // Repatcher au cas où l'API aurait modifié/formaté des données
        const formattedData = { ...updatedMembre, date_naissance: this.formatDateForInput(updatedMembre.date_naissance) };
        this.infoForm.patchValue(formattedData);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error("Erreur MàJ informations perso:", err);
        this.notification.show(err.message || 'Erreur mise à jour informations.', 'error');
        this.isSavingInfo = false;
        this.infoForm.enable(); // Réactive pour correction
        this.cdr.detectChanges();
      }
    });
  }
  /** Affiche la section de confirmation de suppression */
  initiateAccountDeletion(): void {
      const today = new Date();
      // Utiliser formatDate directement
      // Le 3ème argument est le locale ID (ex: 'fr-FR'), le 4ème le fuseau horaire (optionnel)
      const formattedDate = formatDate(today, 'dd/MM/yyyy', this.locale);
      this.requiredConfirmationPhrase = `SUPPRIMER MON COMPTE LE ${formattedDate}`;

      this.showDeleteConfirmation = true;
      this.deleteConfirmationInput = '';
      this.cdr.detectChanges();
    }

  /** Cache la section de confirmation */
  cancelAccountDeletion(): void {
    this.showDeleteConfirmation = false;
    this.deleteConfirmationInput = '';
    this.requiredConfirmationPhrase = ''; // Optionnel: vider la phrase
    this.cdr.detectChanges();
  }

  /** Vérifie la phrase dynamique et lance la suppression */
  confirmAccountDeletion(): void {
    // Comparaison sensible à la casse (ou utiliser .toUpperCase() des deux côtés si insensible)
    if (this.deleteConfirmationInput !== this.requiredConfirmationPhrase) {
      this.notification.show('La phrase de confirmation ne correspond pas.', 'warning');
      return;
    }
    if (this.isDeletingAccount) return;

    this.isDeletingAccount = true;
    this.cdr.detectChanges();

    this.deleteSubscription = this.membreService.deleteCurrentUserProfile().subscribe({
      next: () => {
        this.isDeletingAccount = false;
        this.notification.show('Votre compte a été supprimé avec succès.', 'valid');
        this.auth.deconnexion();
        this.router.navigate(['/login']); // Ou autre page d'accueil post-connexion
        this.cdr.detectChanges();
      },
      error: (err: Error) => {
        this.isDeletingAccount = false;
        this.notification.show(`Erreur lors de la suppression du compte: ${err.message}`, 'error');
        console.error("Erreur suppression compte:", err);
        this.cdr.detectChanges();
      }
    });
  }


  // // Change le mot de passe (IGNORÉ POUR L'INSTANT)
  // changePassword(): void { /* ... */ }
  changePassword() {
    this.notification.show('Mot de passe changé faut encore le gerer bg', 'valid')
  }
}

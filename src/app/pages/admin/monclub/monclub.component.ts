import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { ClubService } from '../../../service/crud/club.service';
import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { Club } from '../../../model/club';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component MonclubComponent
 * @description Page permettant de visualiser, modifier et supprimer les informations d'un club.
 * Utilise un formulaire réactif pour l'édition et une double confirmation pour la suppression.
 * Applique la stratégie de détection de changements `OnPush` pour optimiser les performances.
 */
@Component({
  selector: 'app-monclub',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    FormsModule
  ],
  templateUrl: './monclub.component.html',
  styleUrls: ['./monclub.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonclubComponent implements OnInit, OnDestroy {

  // --- ÉTAT DU COMPOSANT ---
  clubForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  private clubId: number | null = null;

  // Abonnements pour un nettoyage propre.
  private clubDataSubscription: Subscription | null = null;
  private clubUpdateSubscription: Subscription | null = null;
  private clubDeleteSubscription: Subscription | null = null;

  // Propriétés pour la confirmation de suppression
  showDeleteConfirmation: boolean = false;
  requiredConfirmationPhrase: string = 'supprimer mon club';
  deleteConfirmationInput: string = '';
  isDeletingClub: boolean = false;

  // --- INJECTION DES SERVICES ---
  private fb = inject(FormBuilder);
  private clubService = inject(ClubService);
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  protected cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Récupère l'ID du club, initialise le formulaire
   * et charge les données du club.
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
      this.clubForm.disable();
      this.cdr.detectChanges();
    }
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne tous les Observables actifs.
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
   * @description Initialise la structure du formulaire avec ses contrôles et validateurs.
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
      codeClub: [{ value: '', disabled: true }]
    });
    this.clubForm.disable();
    console.log("MonclubComponent: Formulaire initialisé et désactivé.");
  }

  /**
   * @private
   * @method loadClubData
   * @description Charge les données du club depuis `ClubService`, remplit et active le formulaire.
   * @param id L'ID du club à charger.
   */
  private loadClubData(id: number): void {
    this.isLoading = true;
    this.clubForm.disable();
    this.cdr.detectChanges();

    console.log(`MonclubComponent: Début du chargement des données du club ID: ${id} via ClubService.`);
    this.clubDataSubscription = this.clubService.getClubDetails(id).subscribe({
      next: (data: Club) => {
        console.log('MonclubComponent: Données du club chargées avec succès:', data);
        this.clubForm.patchValue(data);
        this.clubForm.enable();
        this.clubForm.get('codeClub')?.disable();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('MonclubComponent: Erreur lors du chargement des données du club:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors du chargement des informations du club.', 'error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- ACTIONS UTILISATEUR ---
  /**
   * @method copyCodeClub
   * @description Copie le code du club dans le presse-papiers et affiche une notification.
   */
  copyCodeClub(): void {
    const codeClub = this.clubForm.getRawValue().codeClub;
    if (codeClub) {
      document.execCommand('copy'); // Utilisation de execCommand pour la compatibilité iframe
      // L'implémentation originale utilisait `navigator.clipboard.writeText`.
      // Si `document.execCommand('copy')` n'est pas suffisant ou non désiré,
      // une solution alternative avec un champ temporaire ou une interaction utilisateur
      // via une modale pourrait être envisagée.
      console.log("MonclubComponent: Code Club copié dans le presse-papiers:", codeClub);
      this.notification.show('Code Club copié dans le presse-papiers !', 'success');
    } else {
      this.notification.show('Le Code Club n\'est pas disponible pour la copie.', 'warning');
    }
  }

  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire de modification du club.
   * Valide le formulaire et appelle `ClubService` pour la mise à jour.
   */
  onSubmit(): void {
    if (this.clubForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire.', 'warning');
      this.clubForm.markAllAsTouched();
      return;
    }
    if (this.clubId === null) {
      this.notification.show("Erreur: ID du club inconnu. Impossible de sauvegarder.", "error");
      return;
    }
    if (this.isSaving) return;

    this.isSaving = true;
    this.clubForm.disable();
    this.cdr.detectChanges();

    const updatedClubData: Partial<Club> = this.clubForm.value;

    console.log(`MonclubComponent: Soumission des modifications pour le club ID: ${this.clubId}`, updatedClubData);
    this.clubUpdateSubscription = this.clubService.updateClub(this.clubId, updatedClubData).subscribe({
      next: (updatedClub: Club) => {
        console.log('MonclubComponent: Club mis à jour avec succès:', updatedClub);
        this.notification.show('Les informations du club ont été mises à jour avec succès.', 'success');
        this.isSaving = false;
        this.clubForm.enable();
        this.clubForm.get('codeClub')?.disable();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('MonclubComponent: Erreur lors de la mise à jour du club:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors de la mise à jour.', 'error');
        this.isSaving = false;
        this.clubForm.enable();
        this.clubForm.get('codeClub')?.disable();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * @method onReset
   * @description Réinitialise le formulaire à ses valeurs initiales en rechargeant les données du club.
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
   * @description Lance le processus de suppression en générant la phrase de confirmation et affichant la section dédiée.
   */
  initiateClubDeletion(): void {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    this.requiredConfirmationPhrase = `Supprimer mon club le ${formattedDate}`;
    this.showDeleteConfirmation = true;
    this.deleteConfirmationInput = '';
    console.log(`MonclubComponent: Initiation de la suppression du club. Phrase requise: "${this.requiredConfirmationPhrase}"`);
    this.cdr.detectChanges();
  }

  /**
   * @method cancelClubDeletion
   * @description Annule le processus de suppression du club.
   */
  cancelClubDeletion(): void {
    this.showDeleteConfirmation = false;
    this.isDeletingClub = false;
    console.log("MonclubComponent: Annulation de la suppression du club.");
    this.cdr.detectChanges();
  }

  /**
   * @method confirmClubDeletion
   * @description Confirme et exécute la suppression du club après vérification de la phrase.
   * Redirige l'utilisateur après succès.
   */
  confirmClubDeletion(): void {
    if (this.clubId === null) {
      this.notification.show("Erreur: ID du club inconnu. Suppression impossible.", "error");
      return;
    }
    if (this.deleteConfirmationInput !== this.requiredConfirmationPhrase) {
      this.notification.show("La phrase de confirmation est incorrecte. Veuillez la retaper.", "warning");
      return;
    }
    if (this.isDeletingClub) return;

    this.isDeletingClub = true;
    this.cdr.detectChanges();

    console.log(`MonclubComponent: Confirmation de la suppression du club ID: ${this.clubId}.`);
    this.clubDeleteSubscription = this.clubService.deleteClub(this.clubId).subscribe({
      next: () => {
        console.log('MonclubComponent: Club supprimé avec succès.');
        this.notification.show('Le club a été supprimé avec succès.', 'success');
        this.isDeletingClub = false;
        this.router.navigate(['/accueil']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('MonclubComponent: Erreur lors de la suppression du club:', err);
        this.isDeletingClub = false;

        if (err.status === 409 || err.error?.message?.includes('evenements actifs futurs')) {
          this.notification.show('Impossible de supprimer le club : des événements futurs sont encore planifiés ou des réservations existent. Veuillez les annuler ou les supprimer d\'abord.', 'error');
        } else {
          this.notification.show(err.message || 'Une erreur est survenue lors de la suppression du club.', 'error');
        }
        this.showDeleteConfirmation = false;
        this.cdr.detectChanges();
      }
    });
  }
}

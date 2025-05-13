// ----- IMPORTATIONS -----
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common'; // Nécessaire pour les imports standalone si utilisé dans le template
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

// Services
import {ClubService} from '../../../service/crud/club.service'; // Le service dédié pour le club
import {AuthService} from '../../../service/security/auth.service'; // Pour obtenir l'ID du club
// Composants
// Modèles
import {Club} from '../../../model/club'; // L'interface Club
// Autres
import {LucideAngularModule} from 'lucide-angular';
import {Router} from '@angular/router';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-monclub',
  standalone: true, // Important: rend le composant indépendant
  imports: [
    CommonModule, // Fournit @if, etc.
    ReactiveFormsModule, // Indispensable pour [formGroup]
    LucideAngularModule,
    FormsModule
  ],
  templateUrl: './monclub.component.html',
  styleUrls: ['./monclub.component.scss'], // Correction: styleUrls au pluriel
  changeDetection: ChangeDetectionStrategy.OnPush // Active la stratégie OnPush
})
export class MonclubComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy
  // --- État du Composant ---
  clubForm!: FormGroup; // Le formulaire réactif
  isLoading = false;    // Pour l'indicateur de chargement initial
  isSaving = false;     // Pour l'indicateur de sauvegarde
  private clubId: number | null = null; // ID du club géré, récupéré dynamiquement
  private clubDataSubscription: Subscription | null = null;
  private clubUpdateSubscription: Subscription | null = null;
  private clubDeleteSubscription: Subscription | null = null; // Ajouter pour la suppression


  showDeleteConfirmation: boolean = false;
  requiredConfirmationPhrase: string = 'supprimer mon club'; // Phrase à taper
  deleteConfirmationInput: string = '';
  isDeletingClub: boolean = false;

  // --- Injection des Services via inject() ---
  private fb = inject(FormBuilder);
  private clubService = inject(ClubService); // Utilise ClubService
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  protected cdr = inject(ChangeDetectorRef); // Pour déclencher la détection de changement avec OnPush
  private router = inject(Router); // Injecter Router

  ngOnInit(): void {


    this.clubId = this.authService.getManagedClubId(); // Récupère l'ID du club géré au démarrage
    this.initializeForm(); // Initialise la structure du formulaire

    if (this.clubId !== null) {
      this.loadClubData(this.clubId); // Lance le chargement des données si l'ID est connu
    } else {
      // Gère le cas où aucun club n'est géré par l'utilisateur
      this.notification.show("Erreur: Impossible de déterminer le club à charger.", "error");
      this.isLoading = false; // Assure que le chargement est terminé (même si c'est une erreur)
      this.clubForm.disable(); // Désactive le formulaire car on ne peut rien charger/modifier
      this.cdr.detectChanges(); // Met à jour l'affichage
    }
  }

  // N'oublie pas de te désabonner dans ngOnDestroy
  ngOnDestroy(): void {
    this.clubDataSubscription?.unsubscribe();
    this.clubUpdateSubscription?.unsubscribe();
    this.clubDeleteSubscription?.unsubscribe(); // Ajouter ceci
  }

  // Initialisation de la structure du formulaire (vide au début)
  private initializeForm(): void {
    this.clubForm = this.fb.group({
      nom: ['', Validators.required],
      numero_voie: ['', Validators.required],
      rue: ['', Validators.required],
      codepostal: ['', Validators.required],
      ville: ['', Validators.required],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      codeClub: [{value: '', disabled: true}] // Champ non modifiable, désactivé
    });
    this.clubForm.disable(); // Désactive le formulaire tant que les données ne sont pas chargées
  }

  // Charger les données du club en utilisant ClubService
  private loadClubData(id: number): void {
    this.isLoading = true;
    this.clubForm.disable(); // Désactive pendant le chargement
    this.cdr.detectChanges(); // Montre l'état de chargement / formulaire désactivé

    this.clubDataSubscription = this.clubService.getClubDetails(id).subscribe({
      next: (data: Club) => {
        console.log('Données du club chargées:', data);
        this.clubForm.patchValue(data); // Pré-remplit le formulaire avec les données reçues
        this.clubForm.enable(); // Réactive le formulaire
        this.clubForm.get('codeClub')?.disable(); // S'assure que codeClub reste désactivé
        this.isLoading = false; // Fin du chargement
        this.cdr.detectChanges(); // Met à jour l'affichage avec le formulaire rempli et actif
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des données du club', err);
        this.notification.show(err.message || 'Erreur chargement données club.', 'error');
        this.isLoading = false; // Fin du chargement (erreur)
        // Le formulaire reste désactivé car les données n'ont pas pu être chargées
        this.cdr.detectChanges();
      }
    });
  }

  // Copier le code club
  copyCodeClub(): void {
    // Utilise getRawValue() pour accéder à la valeur d'un champ désactivé
    const codeClub = this.clubForm.getRawValue().codeClub;
    if (codeClub) {
      navigator.clipboard.writeText(codeClub).then(
        () => this.notification.show('Code Club copié !', 'success'), // Utilise NotificationService
        (err) => {
          console.error('Erreur copie clipboard:', err);
          this.notification.show('Erreur copie Code Club.', 'error');
        }
      );
    } else {
      // Affiche un warning si le champ est vide (par exemple si chargement initial a échoué)
      this.notification.show('Code Club non disponible.', 'warning');
    }
  }

  // Soumettre les modifications via ClubService
  onSubmit(): void {
    // 1. Vérification initiale de validité et état
    if (this.clubForm.invalid) {
      this.notification.show('Veuillez corriger les erreurs dans le formulaire.', 'warning');
      this.clubForm.markAllAsTouched(); // Aide à afficher les erreurs visuellement
      return;
    }
    if (this.clubId === null) {
      this.notification.show("Erreur: ID du club inconnu pour la mise à jour.", "error");
      return;
    }
    if (this.isSaving) { // Empêche double soumission
      return;
    }

    // 2. Préparation de la sauvegarde
    this.isSaving = true; // Active l'indicateur de sauvegarde
    this.clubForm.disable(); // Désactive le formulaire pendant l'appel API
    this.cdr.detectChanges(); // Met à jour l'UI (ex: bouton désactivé/spinner)

    // Récupère les valeurs des champs *activés* du formulaire.
    // Pour un PATCH/PUT, c'est généralement ce qu'on veut.
    const updatedClubData: Partial<Club> = this.clubForm.value;

    // 3. Appel au service
    this.clubUpdateSubscription = this.clubService.updateClub(this.clubId, updatedClubData).subscribe({
      next: (updatedClub: Club) => {
        this.notification.show('Informations du club mises à jour avec succès.', 'success');
        this.isSaving = false;
        // Réactive le formulaire après succès
        this.clubForm.enable();
        this.clubForm.get('codeClub')?.disable(); // Garde codeClub désactivé
        // Optionnel: Repatcher avec les données retournées si elles peuvent différer
        // this.clubForm.patchValue(updatedClub);
        // this.clubForm.get('codeClub')?.disable();
        this.cdr.detectChanges(); // Met à jour l'UI
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de la mise à jour du club', err);
        this.notification.show(err.message || 'Erreur lors de la mise à jour.', 'error');
        this.isSaving = false;
        // Réactive le formulaire même en cas d'erreur pour permettre correction/nouvelle tentative
        this.clubForm.enable();
        this.clubForm.get('codeClub')?.disable();
        this.cdr.detectChanges();
      }
    });
  }

  // Réinitialiser le formulaire en rechargeant les données depuis l'API
  onReset(): void {
    // Vérifie qu'aucune opération n'est en cours et qu'on a un ID de club
    if (this.clubId !== null && !this.isLoading && !this.isSaving) {
      console.log("Réinitialisation du formulaire via rechargement...");
      this.loadClubData(this.clubId); // Appelle la méthode de chargement
    } else if (this.isLoading || this.isSaving) {
      this.notification.show("Veuillez attendre la fin de l'opération en cours.", "info");
    } else {
      // Cas où l'ID club est null (chargement initial a échoué)
      this.notification.show("Impossible de réinitialiser: données initiales non chargées.", "warning");
    }
  }

  // ... après les méthodes existantes (onSubmit, onReset, etc.) ...

  initiateClubDeletion(): void {
    // 1. Générer la date du jour au format local français (DD/MM/YYYY)
    const today = new Date();
    const formattedDate = today.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }); // ex: 04/05/2025

    // 2. Construire la phrase de confirmation dynamique
    this.requiredConfirmationPhrase = `Supprimer mon club le ${formattedDate}`;

    // 3. Afficher la section de confirmation et réinitialiser le champ
    this.showDeleteConfirmation = true;
    this.deleteConfirmationInput = ''; // Réinitialise le champ de saisie
    this.cdr.detectChanges(); // Met à jour l'affichage pour montrer la nouvelle phrase et la section
  }

  cancelClubDeletion(): void {
    this.showDeleteConfirmation = false;
    this.isDeletingClub = false; // Assure que l'état de chargement est réinitialisé
    this.cdr.detectChanges(); // Met à jour l'affichage
  }

  confirmClubDeletion(): void {
    if (this.clubId === null || this.deleteConfirmationInput !== this.requiredConfirmationPhrase || this.isDeletingClub) {
      // Sécurité : Ne rien faire si conditions non remplies ou déjà en cours
      return;
    }

    this.isDeletingClub = true;
    this.cdr.detectChanges(); // Montre l'état "Suppression en cours..."

    // IMPORTANT: Assure-toi d'avoir une méthode deleteClub dans ton ClubService
    this.clubDeleteSubscription = this.clubService.deleteClub(this.clubId).subscribe({
      next: () => {
        this.notification.show('Club supprimé avec succès.', 'success');
        this.isDeletingClub = false;
        // Rediriger l'utilisateur après la suppression (par exemple vers un tableau de bord)
        this.router.navigate(['/dashboard']); // Adapte '/dashboard' à ta route cible
        // Pas besoin de detectChanges ici car la navigation change la vue
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors de la suppression du club', err);
        this.isDeletingClub = false;

        // Gestion spécifique de l'erreur "événements futurs actifs"
        // NOTE: Adapte la condition ci-dessous au message/code d'erreur EXACT renvoyé par ton API
        if (err.status === 409 || err.error?.message?.includes('evenements actifs futurs')) {
          this.notification.show('Impossible de supprimer le club : des événements futurs sont encore planifiés.', 'error');
        } else {
          // Erreur générique
          this.notification.show(err.message || 'Erreur lors de la suppression du club.', 'error');
        }

        this.showDeleteConfirmation = false; // Cache la confirmation en cas d'erreur pour éviter confusion
        this.cdr.detectChanges(); // Met à jour l'affichage (bouton réactivé, message erreur)
      }
    });
  }


}

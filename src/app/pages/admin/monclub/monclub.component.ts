// ----- IMPORTATIONS -----
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common'; // Nécessaire pour les imports standalone si utilisé dans le template
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

// Services
import {ClubService} from '../../../service/club.service'; // Le service dédié pour le club
import {AuthService} from '../../../service/security/auth.service'; // Pour obtenir l'ID du club
import {NotificationService} from '../../../service/notification.service'; // Pour les messages
// Composants

// Modèles
import {Club} from '../../../model/club'; // L'interface Club
// Autres
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-monclub',
  standalone: true, // Important: rend le composant indépendant
  imports: [
    CommonModule, // Fournit @if, etc.
    ReactiveFormsModule, // Indispensable pour [formGroup]
    LucideAngularModule
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

  // --- Injection des Services via inject() ---
  private fb = inject(FormBuilder);
  private clubService = inject(ClubService); // Utilise ClubService
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef); // Pour déclencher la détection de changement avec OnPush

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

  ngOnDestroy(): void {
    // Très important: Se désabonner pour éviter les fuites mémoire
    this.clubDataSubscription?.unsubscribe();
    this.clubUpdateSubscription?.unsubscribe();
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
        () => this.notification.show('Code Club copié !', 'valid'), // Utilise NotificationService
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
        this.notification.show('Informations du club mises à jour avec succès.', 'valid');
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
}

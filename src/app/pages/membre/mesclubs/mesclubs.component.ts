// ----- IMPORTATIONS -----
import {
  ChangeDetectorRef,       // Outil pour contrôler manuellement la détection de changements.
  Component,
  inject,                   // Fonction moderne pour l'injection de dépendances.
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';         // Pour @if, @for (ou NgIf/NgForOf), pipes...
import { FormsModule } from '@angular/forms';           // Pour [(ngModel)] sur les champs de recherche et d'ajout.
import { finalize, Subscription } from 'rxjs';          // `finalize` pour exécuter du code après succès ou erreur, `Subscription` pour gérer la désinscription.

// Services
import { MembreService } from '../../../service/crud/membre.service';     // Service pour les opérations liées au membre et à ses clubs.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications et confirmations.
// import { Clipboard } from '@angular/cdk/clipboard'; // Déjà importé dans votre code.

// Modèles (Interfaces de données)
import { Club } from '../../../model/club';             // Interface décrivant un club.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * @Component MesclubsComponent
 * @description
 * Page permettant à un utilisateur (membre) de visualiser et gérer les clubs auxquels il est affilié.
 * Il peut voir la liste de ses clubs, en rejoindre de nouveaux en utilisant leur code unique,
 * et quitter les clubs auxquels il ne souhaite plus appartenir.
 * Une fonctionnalité de recherche/filtrage sur la liste des clubs est également disponible.
 *
 * @example
 * <app-mesclubs></app-mesclubs> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-mesclubs',
  standalone: true,               // Indique que c'est un composant autonome.
  imports: [                      // Dépendances nécessaires pour le template.
    CommonModule,                 // Pour les directives @if, @for, etc.
    LucideAngularModule,          // Pour les icônes.
    FormsModule                   // Pour [(ngModel)] sur les champs de saisie.
  ],
  templateUrl: './mesclubs.component.html', // Chemin vers le fichier HTML du composant.
  styleUrl: './mesclubs.component.scss',    // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisagez d'ajouter pour optimiser les performances.
})
export class MesclubsComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy.

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) et des boîtes de dialogue de confirmation.
   */
  private notification = inject(SweetAlertService); // Déjà utilisé dans le code fourni.
  /**
   * @private
   * @description Service pour les opérations liées au membre, y compris la gestion de ses clubs.
   */
  private membreService = inject(MembreService);
  /**
   * @private
   * @description Service Angular pour contrôler manuellement la détection de changements.
   * Indispensable si `ChangeDetectionStrategy.OnPush` est activé.
   */
  private cdr = inject(ChangeDetectorRef);
  // private clipboard = inject(Clipboard); // L'import est là, mais l'injection via `inject()` serait `private clipboard = inject(Clipboard);` si besoin.

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Club[]} userClubs
   * @description Tableau stockant la liste originale des clubs auxquels l'utilisateur est affilié.
   * Sert de source de vérité pour le filtrage.
   * @default []
   */
  userClubs: Club[] = [];
  /**
   * @property {Club[]} filteredClubs
   * @description Tableau stockant la liste des clubs à afficher après application du filtre de recherche.
   * C'est cette liste qui est effectivement rendue dans le template.
   * @default []
   */
  filteredClubs: Club[] = []; // Correction du nom de la propriété (était commenté dans votre code).
  /**
   * @property {boolean} isLoadingClubs
   * @description Booléen indiquant si le chargement de la liste des clubs de l'utilisateur est en cours.
   * @default false
   */
  isLoadingClubs = false;
  /**
   * @property {string | null} errorLoadingClubs
   * @description Stocke un message d'erreur si le chargement de la liste des clubs échoue.
   * @default null
   */
  errorLoadingClubs: string | null = null;

  /**
   * @property {string} joinClubCode
   * @description Le code club saisi par l'utilisateur pour tenter de rejoindre un nouveau club.
   * Lié via `[(ngModel)]`. Initialisé avec un préfixe pour guider l'utilisateur.
   * @default 'CLUB-'
   */
  joinClubCode: string = 'CLUB-';
  /**
   * @property {boolean} isJoiningClub
   * @description Booléen indiquant si une opération pour rejoindre un club est en cours.
   * @default false
   */
  isJoiningClub = false;
  /**
   * @property {string | null} errorJoiningClub
   * @description Stocke un message d'erreur si la tentative pour rejoindre un club échoue.
   * @default null
   */
  errorJoiningClub: string | null = null;

  /**
   * @property {number | null} leavingClubId
   * @description Stocke l'ID du club que l'utilisateur est en train de quitter.
   * Utilisé pour afficher un indicateur de chargement spécifique à cette action.
   * @default null
   */
  leavingClubId: number | null = null;
  /**
   * @property {Set<number>} errorLeavingClubIds
   * @description Un ensemble (Set) stockant les IDs des clubs pour lesquels une tentative de départ a échoué.
   * Permet d'afficher un message d'erreur spécifique à côté du bouton "Quitter" concerné.
   * @default new Set()
   */
  errorLeavingClubIds = new Set<number>();
  /**
   * @property {string} clubSearchTerm
   * @description Le terme de recherche saisi par l'utilisateur pour filtrer la liste de ses clubs.
   * Lié via `[(ngModel)]`.
   * @default ''
   */
  clubSearchTerm: string = '';

  // --- ABONNEMENTS RxJS ---
  /**
   * @private
   * @property {Subscription | null} clubsSub
   * @description Abonnement à l'Observable pour le chargement de la liste des clubs de l'utilisateur.
   */
  private clubsSub: Subscription | null = null;
  /**
   * @private
   * @property {Subscription | null} joinSub
   * @description Abonnement à l'Observable pour l'opération de rejoindre un club.
   */
  private joinSub: Subscription | null = null;
  /**
   * @private
   * @property {Subscription | null} leaveSub
   * @description Abonnement à l'Observable pour l'opération de quitter un club.
   */
  private leaveSub: Subscription | null = null;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Déclenche le chargement initial de la liste des clubs de l'utilisateur.
   * @see {@link loadUserClubs}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("MesclubsComponent: Initialisation.");
    this.loadUserClubs();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de tous les abonnements RxJS actifs pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("MesclubsComponent: Destruction, désinscription des abonnements.");
    this.clubsSub?.unsubscribe();
    this.joinSub?.unsubscribe();
    this.leaveSub?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadUserClubs
   * @description Charge la liste des clubs auxquels l'utilisateur est affilié via `MembreService`.
   * Réinitialise les listes et le terme de recherche.
   * Gère les états de chargement (`isLoadingClubs`) et d'erreur (`errorLoadingClubs`).
   * Utilise `finalize` pour s'assurer que `isLoadingClubs` est remis à `false` après l'opération.
   * @returns {void}
   */
  loadUserClubs(): void {
    this.isLoadingClubs = true;
    this.errorLoadingClubs = null;
    this.userClubs = [];
    this.filteredClubs = [];
    this.clubSearchTerm = ''; // Réinitialise la recherche lors du rechargement.
    this.cdr.detectChanges(); // Met à jour l'UI pour montrer l'état de chargement.

    this.clubsSub?.unsubscribe(); // Annule l'abonnement précédent s'il existe.

    this.clubsSub = this.membreService.getUserClubs().pipe(
      finalize(() => { // S'exécute après la complétion ou l'erreur de l'Observable.
        this.isLoadingClubs = false;
        this.cdr.detectChanges(); // Met à jour l'UI pour refléter la fin du chargement.
      })
    ).subscribe({
      next: (clubs: Club[]) => {
        this.userClubs = clubs;
        this.filterClubsList(); // Applique le filtre initial (qui affichera tout).
        console.log(`MesclubsComponent: ${this.userClubs.length} clubs utilisateur chargés.`);
        // cdr.detectChanges() est déjà dans finalize.
      },
      error: (error) => { // Type d'erreur plus générique pour flexibilité.
        console.error('MesclubsComponent: Erreur lors du chargement des clubs:', error);
        this.errorLoadingClubs = error?.message || "Impossible de charger la liste de vos clubs.";
        this.filteredClubs = []; // Assure que la liste est vide en cas d'erreur.
        // cdr.detectChanges() est déjà dans finalize.
      }
    });
  }

  // --- ACTIONS SUR LES CLUBS ---
  /**
   * @method joinClub
   * @description Tente de faire rejoindre un club à l'utilisateur en utilisant le `joinClubCode` saisi.
   * Valide la saisie, appelle `MembreService.joinClubByCode()`, et gère les notifications.
   * Recharge la liste des clubs après succès.
   * @returns {void}
   */
  joinClub(): void {
    const code = this.joinClubCode.trim();
    if (!code || code === 'CLUB-' || this.isJoiningClub) { // Vérifie aussi le préfixe.
      if (!code || code === 'CLUB-') {
        this.notification.show("Veuillez entrer un code club valide.", "warning");
      }
      return;
    }

    this.isJoiningClub = true;
    this.errorJoiningClub = null;
    this.errorLeavingClubIds.clear(); // Efface les erreurs de "quitter club" précédentes.
    this.cdr.detectChanges();

    this.joinSub?.unsubscribe(); // Annule l'abonnement précédent.

    this.joinSub = this.membreService.joinClubByCode(code).pipe(
      finalize(() => {
        this.isJoiningClub = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (joinedClubResponse) => { // `joinedClubResponse` peut être un Club, un message, ou void.
        // Adaptez en fonction de ce que votre API retourne réellement.
        // Ici, on suppose qu'elle pourrait retourner l'objet Club rejoint ou un message.
        let clubName = code; // Nom par défaut si l'API ne retourne pas le nom.
        if (typeof joinedClubResponse === 'object' && joinedClubResponse !== null && 'nom' in joinedClubResponse) {
          clubName = (joinedClubResponse as Club).nom || code;
        }
        this.notification.show(`Vous avez rejoint le club "${clubName}" avec succès !`, 'success');
        this.joinClubCode = 'CLUB-'; // Réinitialise le champ.
        this.loadUserClubs();       // Recharge la liste des clubs (qui appellera filterClubsList).
        console.log("MesclubsComponent: Club rejoint avec succès.");
      },
      error: (error: HttpErrorResponse) => { // Typage plus précis de l'erreur.
        console.error('MesclubsComponent: Erreur pour rejoindre le club:', error);
        this.errorJoiningClub = error.error?.message || error.message || "Impossible de rejoindre le club. Vérifiez le code ou si vous êtes déjà membre.";
        if (this.errorJoiningClub) { // Vérifie si un message d'erreur a été défini.
          this.notification.show(this.errorJoiningClub, 'error');
        }
        // cdr.detectChanges() est déjà dans finalize.
      }
    });
  }

  /**
   * @method leaveClub
   * @description Gère la demande de l'utilisateur pour quitter un club.
   * Affiche une boîte de dialogue de confirmation via `SweetAlertService`.
   * Si confirmé, appelle `MembreService.leaveClub()` et met à jour la liste des clubs.
   * Gère les états de chargement et d'erreur spécifiques à cette action.
   * @param {Club} club - Le club que l'utilisateur souhaite quitter.
   * @returns {void}
   */
  leaveClub(club: Club): void {
    if (this.leavingClubId !== null) { // Empêche les actions multiples si une est déjà en cours.
      return;
    }

    this.notification.confirmAction(
      'Quitter ce club ?',
      `Êtes-vous sûr de vouloir quitter le club "${club.nom}" ? Cette action est irréversible.`,
      () => { // Callback exécutée si l'utilisateur confirme.
        console.log(`MesclubsComponent: Confirmation reçue pour quitter le club ID: ${club.id}`);
        this.leavingClubId = club.id; // Définit l'ID du club en cours de suppression (pour l'UI).
        this.errorJoiningClub = null; // Efface l'erreur de "rejoindre" si elle était affichée.
        this.errorLeavingClubIds.delete(club.id); // Efface une erreur précédente pour CE club.
        this.cdr.detectChanges(); // Met à jour l'UI pour montrer l'état "leaving".

        this.leaveSub?.unsubscribe(); // Annule l'abonnement précédent.

        this.leaveSub = this.membreService.leaveClub(club.id).pipe(
          finalize(() => {
            this.leavingClubId = null; // Réinitialise l'ID en cours de suppression.
            this.cdr.detectChanges(); // Met à jour l'UI.
          })
        ).subscribe({
          next: () => {
            this.notification.show(`Vous avez quitté le club "${club.nom}" avec succès.`, 'success');
            this.loadUserClubs(); // Recharge la liste des clubs.
            console.log(`MesclubsComponent: Club ID ${club.id} quitté.`);
          },
          error: (error: HttpErrorResponse) => {
            console.error(`MesclubsComponent: Erreur pour quitter le club ${club.id}:`, error);
            this.errorLeavingClubIds.add(club.id); // Marque ce club comme ayant eu une erreur.
            const message = error.error?.message || error.message || `Impossible de quitter le club "${club.nom}".`;
            this.notification.show(message, 'error');
            // cdr.detectChanges() est déjà dans finalize.
          }
        });
      },
      'Oui, quitter', // Texte du bouton de confirmation.
      // 'Annuler' // Texte du bouton d'annulation (par défaut ou personnalisable).
    );
  }

  // --- LOGIQUE DE FILTRAGE ---
  /**
   * @method filterClubsList
   * @description Filtre la liste `userClubs` basée sur `clubSearchTerm`
   * (recherche sur nom, ville, code postal, code club, rue).
   * Met à jour `filteredClubs` qui est la liste affichée dans le template.
   * Appelée lorsque `clubSearchTerm` change ou après le chargement des clubs.
   * @returns {void}
   */
  filterClubsList(): void {
    const searchTerm = this.clubSearchTerm.trim().toLowerCase();
    console.log(`MesclubsComponent: Filtrage de la liste des clubs avec le terme: "${searchTerm}"`);

    if (!searchTerm) {
      this.filteredClubs = [...this.userClubs]; // Affiche tous les clubs si la recherche est vide.
    } else {
      this.filteredClubs = this.userClubs.filter(club =>
        (club.nom && club.nom.toLowerCase().includes(searchTerm)) ||
        (club.ville && club.ville.toLowerCase().includes(searchTerm)) ||
        (club.codepostal && club.codepostal.toLowerCase().includes(searchTerm)) ||
        (club.codeClub && club.codeClub.toLowerCase().includes(searchTerm)) ||
        (club.rue && club.rue.toLowerCase().includes(searchTerm))
      );
    }
    this.cdr.detectChanges(); // Assure la mise à jour de l'affichage avec la liste filtrée.
  }

  // --- MÉTHODES UTILITAIRES POUR LE TEMPLATE ---
  /**
   * @method hasLeaveError
   * @description Vérifie si une erreur s'est produite lors de la tentative de quitter un club spécifique.
   * Utilisé dans le template pour afficher conditionnellement un message d'erreur.
   * @param {number} clubId - L'ID du club à vérifier.
   * @returns {boolean} `true` si une erreur est associée à ce clubId, `false` sinon.
   */
  hasLeaveError(clubId: number): boolean {
    return this.errorLeavingClubIds.has(clubId);
  }

  /**
   * @method copyCode
   * @description Copie le code club fourni (ou le code ami de l'utilisateur) dans le presse-papiers.
   * Utilise `navigator.clipboard` (API moderne) ou `@angular/cdk/clipboard` (si injecté).
   * Affiche une notification de succès ou d'erreur.
   * @param {string | null | undefined} code - Le code à copier.
   * @param {number} [clubId] - Optionnel: L'ID du club pour un feedback visuel spécifique (non implémenté dans ce TS).
   * @returns {void}
   */
  copyCode(code: string | null | undefined, clubId?: number): void { // clubId est optionnel et pour feedback UI.
    if (!code) {
      this.notification.show('Code non disponible pour la copie.', 'warning');
      return;
    }

    // Utilisation de l'API Clipboard native du navigateur.
    navigator.clipboard.writeText(code).then(
      () => {
        this.notification.show(`Code "${code}" copié dans le presse-papiers !`, 'success');
        console.log(`MesclubsComponent: Code "${code}" copié.`);
        // Si vous voulez un feedback visuel sur la carte du club spécifique :
        if (clubId) {
          const feedbackEl = document.getElementById(`copy-feedback-${clubId}`);
          if (feedbackEl) {
            feedbackEl.textContent = 'Copié!';
            setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 1500);
          }
        }
      },
      (err) => {
        console.error('MesclubsComponent: Erreur lors de la copie du code:', err);
        this.notification.show('Erreur lors de la copie du code. Vérifiez les permissions du navigateur.', 'error');
      }
    );
  }
}

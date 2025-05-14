// ----- IMPORTATIONS -----
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common'; // Pour @if, @for (ou NgIf/NgForOf)
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { AuthService } from '../../../service/security/auth.service'; // Pour obtenir l'ID du club géré.
import { MembreService } from '../../../service/crud/membre.service'; // Service pour les opérations CRUD sur les membres.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Composants Enfants
import { MembreRowComponent } from '../../../component/membre/membre-row/membre-row.component'; // Affiche une ligne de membre.
import { FilterMembreComponent } from '../../../component/membre/filter-membre/filter-membre.component'; // Pour filtrer/trier les membres.
import { PaginationComponent } from '../../../component/navigation/pagination/pagination.component'; // Pour la pagination.

// Modèles (Interfaces de données)
import { Membre } from '../../../model/membre'; // Interface décrivant un membre.
import { RoleType } from '../../../model/role'; // Type alias pour les rôles.


/**
 * @Component MembreAdminComponent
 * @description
 * Page principale pour l'administration et la gestion des membres d'un club spécifique.
 * Ce composant affiche la liste des membres du club géré par l'utilisateur connecté,
 * permet leur filtrage par nom/prénom, leur tri, et leur pagination.
 * Il permet également la modification du rôle d'un membre via une modale de détails
 * (gérée par le composant enfant `MembreRowComponent`).
 *
 * Utilise la stratégie de détection de changements `OnPush` pour des raisons de performance.
 *
 * @example
 * <app-membre-admin></app-membre-admin> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-membre-admin', // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,             // Indique que c'est un composant autonome.
  imports: [                    // Dépendances nécessaires pour le template de ce composant.
    CommonModule,               // Pour les directives @if, @for, etc.
    MembreRowComponent,         // Pour afficher chaque membre dans le tableau.
    FilterMembreComponent,      // Pour les contrôles de filtre et de tri.
    PaginationComponent,        // Pour la navigation entre les pages de membres.
    // LucideAngularModule,     // Décommentez si des icônes Lucide sont utilisées directement dans ce template.
  ],
  templateUrl: './membreAdmin.component.html', // Chemin vers le fichier HTML du composant.
  styleUrls: ['./membreAdmin.component.scss'],   // Chemin vers le fichier SCSS/CSS du composant.
  changeDetection: ChangeDetectionStrategy.OnPush // Optimisation de la détection de changements.
})
export class MembreAdminComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  /**
   * @private
   * @description Service d'authentification pour obtenir l'ID du club actuellement géré.
   */
  private authService = inject(AuthService);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) à l'utilisateur.
   */
  private notification = inject(SweetAlertService);
  /**
   * @private
   * @description Service Angular pour contrôler manuellement la détection de changements.
   * Nécessaire avec la stratégie `ChangeDetectionStrategy.OnPush`.
   */
  private cdr = inject(ChangeDetectorRef);
  /**
   * @private
   * @description Service pour effectuer les opérations CRUD liées aux membres.
   */
  private membreService = inject(MembreService);

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Membre[]} allMembres
   * @description Tableau stockant TOUS les membres du club récupérés de l'API.
   * Sert de source de vérité pour les opérations de filtrage et de tri.
   * @default []
   */
  allMembres: Membre[] = [];
  /**
   * @property {Membre[]} filteredMembres
   * @description Tableau stockant les membres après application des filtres (recherche) et du tri.
   * C'est cette liste qui est utilisée pour la pagination.
   * @default []
   */
  filteredMembres: Membre[] = [];
  /**
   * @property {Membre[]} paginatedMembres
   * @description Tableau stockant la tranche de membres (un sous-ensemble de `filteredMembres`)
   * à afficher pour la page de pagination actuelle.
   * @default []
   */
  paginatedMembres: Membre[] = [];

  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si un chargement de données (appel API principal) est en cours.
   * @default false
   */
  isLoading = false;

  /**
   * @private
   * @property {Subscription | null} membersSubscription
   * @description Référence à l'abonnement pour le chargement des membres.
   * Permet de se désabonner proprement dans `ngOnDestroy`.
   * @default null
   */
  private membersSubscription: Subscription | null = null;

  // Propriétés pour la pagination
  /**
   * @property {number} currentPage
   * @description Le numéro de la page actuellement affichée.
   * @default 1
   */
  currentPage: number = 1;
  /**
   * @property {number} itemsPerPage
   * @description Le nombre de membres à afficher par page.
   * @default 10
   */
  itemsPerPage: number = 10;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Déclenche le chargement initial de la liste des membres du club.
   * @see {@link chargerMembresDuClub}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("MembreAdminComponent: Initialisation.");
    this.chargerMembresDuClub();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de `membersSubscription` pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("MembreAdminComponent: Destruction, désinscription de membersSubscription.");
    this.membersSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method chargerMembresDuClub
   * @description Charge la liste des membres pour le club actuellement géré par l'utilisateur.
   * Récupère l'ID du club via `AuthService`.
   * Réinitialise les listes de membres et la pagination avant le chargement.
   * Met à jour l'état `isLoading` et déclenche la détection de changements.
   * @returns {void}
   */
  chargerMembresDuClub(): void {
    const clubId = this.authService.getManagedClubId(); // ID du club géré par l'utilisateur.
    if (clubId === null) {
      this.notification.show("Erreur: ID du club géré non trouvé. Impossible de charger les membres.", "error");
      this.isLoading = false; // S'assurer que isLoading est bien à false
      this.cdr.detectChanges(); // Mettre à jour la vue pour refléter l'erreur/état vide
      return;
    }

    this.isLoading = true;
    // Réinitialise les listes et la pagination à chaque chargement.
    this.allMembres = [];
    this.filteredMembres = [];
    this.paginatedMembres = [];
    this.currentPage = 1;
    this.cdr.detectChanges(); // Met à jour l'UI pour l'état de chargement.

    console.log(`MembreAdminComponent: Début du chargement des membres pour le club ID: ${clubId}.`);
    this.membersSubscription = this.membreService.getMembersByClub(clubId).subscribe({
      next: (data: Membre[]) => {
        this.allMembres = data;
        this.filteredMembres = [...this.allMembres]; // Initialise la liste filtrée.
        this.updatePaginatedMembres();              // Calcule et affiche la première page.
        this.isLoading = false;
        console.log(`MembreAdminComponent: ${this.allMembres.length} membres chargés.`);
        // cdr.detectChanges() est appelé dans updatePaginatedMembres.
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.allMembres = []; // Assure que les listes sont vides en cas d'erreur.
        this.filteredMembres = [];
        this.paginatedMembres = [];
        console.error('MembreAdminComponent: Erreur lors du chargement des membres:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors du chargement des membres.', 'error');
        this.cdr.detectChanges(); // Met à jour l'UI pour l'état d'erreur.
      }
    });
  }

  // --- GESTION DES FILTRES ---
  /**
   * @method handleFilteredMembresChange
   * @description Gère l'événement `filteredMembresChange` émis par `FilterMembreComponent`.
   * Met à jour `filteredMembres`, réinitialise à la première page, et met à jour la vue paginée.
   * @param {Membre[]} filteredList - La nouvelle liste de membres filtrée et triée.
   * @returns {void}
   */
  handleFilteredMembresChange(filteredList: Membre[]): void {
    console.log(`MembreAdminComponent: Liste des membres filtrée/triée reçue (${filteredList.length} éléments).`);
    this.filteredMembres = filteredList;
    this.currentPage = 1; // Réinitialiser à la première page après un filtre/tri.
    this.updatePaginatedMembres();
  }

  // --- GESTION DE LA PAGINATION ---
  /**
   * @method updatePaginatedMembres
   * @description Calcule la tranche de membres à afficher (`paginatedMembres`)
   * basée sur `filteredMembres`, `currentPage`, et `itemsPerPage`.
   * Déclenche une détection de changements.
   * @returns {void}
   */
  updatePaginatedMembres(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMembres = this.filteredMembres.slice(startIndex, endIndex);
    console.log(`MembreAdminComponent: Affichage de la page ${this.currentPage} des membres. Indices de ${startIndex} à ${Math.min(endIndex, this.filteredMembres.length) -1} sur ${this.filteredMembres.length} filtrés.`);
    this.cdr.detectChanges();
  }

  /**
   * @method onPageChange
   * @description Gère l'événement `pageChange` émis par `PaginationComponent`.
   * Met à jour `currentPage` et recalcule la vue paginée.
   * @param {number} newPage - Le nouveau numéro de page.
   * @returns {void}
   */
  onPageChange(newPage: number): void {
    const totalPages = Math.ceil(this.filteredMembres.length / this.itemsPerPage);
    if (newPage >= 1 && newPage !== this.currentPage && newPage <= totalPages) {
      console.log(`MembreAdminComponent: Changement de page des membres vers la page ${newPage}.`);
      this.currentPage = newPage;
      this.updatePaginatedMembres();
    } else if (newPage > totalPages && totalPages > 0 && this.currentPage !== totalPages) {
      console.log(`MembreAdminComponent: Page ${newPage} invalide (max ${totalPages}). Redirection vers la dernière page des membres.`);
      this.currentPage = totalPages;
      this.updatePaginatedMembres();
    }
  }

  // --- GESTION DES ACTIONS SUR LES MEMBRES ---
  /**
   * @method handleSaveRole
   * @description Gère l'événement `roleChangeRequested` émis par un `MembreRowComponent`
   * (qui a lui-même reçu l'information de sa modale enfant `MembreDetailModalComponent`).
   * Appelle `MembreService` pour effectuer la modification du rôle via l'API.
   * Met à jour localement le rôle du membre dans les listes après succès pour un retour visuel.
   * @param {{ membreId: number, newRole: RoleType }} data - Les données contenant l'ID du membre et son nouveau rôle.
   * @returns {void}
   */
  handleSaveRole(data: { membreId: number, newRole: RoleType }): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club non trouvé pour la modification du rôle.", "error");
      return;
    }
    if (!data || !data.newRole) {
      this.notification.show("Erreur: Données de rôle invalides reçues pour la sauvegarde.", "error");
      return;
    }

    console.log(`MembreAdminComponent: Demande de sauvegarde de rôle. Membre ID: ${data.membreId}, Club ID: ${clubId}, Nouveau Rôle: ${data.newRole}`);
    this.membreService.changeMemberRole(data.membreId, clubId, data.newRole).subscribe({
      next: (updatedMember: Membre) => { // L'API devrait retourner le membre mis à jour.
        this.notification.show(`Le rôle du membre (ID: ${data.membreId}) a été mis à jour en ${data.newRole}.`, "success");

        // Met à jour le rôle du membre dans la liste 'allMembres'.
        const indexAll = this.allMembres.findIndex(m => m.id === data.membreId);
        if (indexAll !== -1) {
          // Créer une nouvelle référence pour `allMembres` pour la détection de changements OnPush.
          const newAllMembres = [...this.allMembres];
          newAllMembres[indexAll] = { ...newAllMembres[indexAll], role: data.newRole };
          // Ou, si `updatedMember` est l'objet complet et à jour: newAllMembres[indexAll] = updatedMember;
          this.allMembres = newAllMembres;
        }

        // Met à jour le rôle du membre dans la liste 'filteredMembres'.
        const indexFiltered = this.filteredMembres.findIndex(m => m.id === data.membreId);
        if (indexFiltered !== -1) {
          const newFilteredMembres = [...this.filteredMembres];
          newFilteredMembres[indexFiltered] = { ...newFilteredMembres[indexFiltered], role: data.newRole };
          // Ou: newFilteredMembres[indexFiltered] = updatedMember;
          this.filteredMembres = newFilteredMembres;
        }

        // Met à jour la vue paginée.
        this.updatePaginatedMembres();
        console.log(`MembreAdminComponent: Rôle du membre ID ${data.membreId} mis à jour localement.`);
      },
      error: (error: HttpErrorResponse) => {
        console.error("MembreAdminComponent: Erreur lors de la mise à jour du rôle:", error);
        this.notification.show(error.message || "Une erreur inconnue est survenue lors de la mise à jour du rôle.", "error");
      }
    });
  }
}

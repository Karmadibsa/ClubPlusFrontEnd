// ----- IMPORTATIONS -----
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core'; // Ajout OnInit, OnDestroy, ChangeDetectionStrategy
import {CommonModule} from '@angular/common'; // Nécessaire pour @for
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

// Services
import {AuthService} from '../../../service/security/auth.service';
import {NotificationService} from '../../../service/notification.service';
import {MembreService} from '../../../service/membre.service';

// Composants
import {MembreRowComponent} from '../../../component/membre/membre-row/membre-row.component';

// Modèles
import {Membre} from '../../../model/membre'; // Assure-toi que ce type est correct
import {RoleType} from '../../../model/role';
import {FilterMembreComponent} from '../../../component/membre/filter-membre/filter-membre.component';
import {PaginationComponent} from '../../../component/navigation/pagination/pagination.component';

// Autres (si besoin)
// import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-membre', // Le sélecteur utilisé dans le routing ou ailleurs
  standalone: true, // Rendre le composant standalone
  imports: [
    CommonModule, // Pour @for
    MembreRowComponent,
    FilterMembreComponent,
    PaginationComponent,
    // LucideAngularModule, // Si des icônes sont utilisées dans CE template
    // FilterMembreComponent, // Retire si non utilisé
  ],
  templateUrl: './membreAdmin.component.html',
  styleUrls: ['./membreAdmin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Utilise OnPush pour la performance
})
export class MembreAdminComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy
  // --- État du Composant ---
  membres: Membre[] = []; // Une seule liste pour les membres
  isLoading = false;
  private membersSubscription: Subscription | null = null;

  // --- Injection des Services ---
  // Pas besoin d'injecter HttpClient, Router, EventService si non utilisés ici
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private membreService = inject(MembreService);

  // --- AJOUT/MODIFICATION : État pour listes d'événements ---
  allMembres: Membre[] = []; // Liste complète originale non filtrée
  filteredMembres: Membre[] = []; // Liste après filtrage/tri (utilisée pour la pagination)
  paginatedMembres: Membre[] = []; // Liste pour affichage dans le tableau (page actuelle)

  // --- AJOUT : État pour la Pagination ---
  currentPage: number = 1;
  itemsPerPage: number = 10; // Ou une autre valeur par défaut


  ngOnInit(): void {
    this.chargerMembresDuClub(); // Renommé pour plus de clarté
  }

  ngOnDestroy(): void {
    this.membersSubscription?.unsubscribe(); // Nettoie l'abonnement à la destruction
  }

  /**
   * Charge la liste des membres, initialise les listes et la pagination.
   */
  chargerMembresDuClub(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club géré non trouvé.", "error");
      return;
    }

    this.isLoading = true;
    // Réinitialiser toutes les listes et la pagination
    this.allMembres = [];
    this.filteredMembres = [];
    this.paginatedMembres = [];
    this.currentPage = 1;
    this.cdr.detectChanges(); // Mettre à jour l'UI (montre le chargement)

    this.membersSubscription = this.membreService.getMembersByClub(clubId).subscribe({
      next: (data: Membre[]) => {
        this.allMembres = data;
        // Initialement, la liste filtrée est une copie de la liste complète
        this.filteredMembres = [...this.allMembres];
        // Mettre à jour la vue paginée initiale
        this.updatePaginatedMembres();
        this.isLoading = false;
        console.log('Membres chargés:', this.allMembres.length);
        // cdr.detectChanges() est appelé dans updatePaginatedMembres
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.allMembres = []; // Assurer que les listes sont vides en cas d'erreur
        this.filteredMembres = [];
        this.paginatedMembres = [];
        console.error('Erreur de chargement des membres:', err);
        this.notification.show(err.message || 'Erreur de chargement des membres.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Met à jour la liste filteredMembres et réinitialise la pagination.
   * Appelée par l'output (filteredMembresChange) de FilterMembreComponent.
   * @param filteredList La liste des membres filtrée/triée.
   */
  handleFilteredMembresChange(filteredList: Membre[]): void {
    console.log("Liste membres filtrée/triée reçue:", filteredList.length, "éléments");
    this.filteredMembres = filteredList;
    this.currentPage = 1; // Revenir à la première page après un filtre/tri
    this.updatePaginatedMembres();
  }

  /**
   * Met à jour la liste paginatedMembres pour affichage dans le tableau.
   * Calcule la tranche de filteredMembres à afficher.
   */
  updatePaginatedMembres(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedMembres = this.filteredMembres.slice(startIndex, endIndex);
    console.log(`Membres: Affichage page ${this.currentPage}, index ${startIndex} à ${endIndex - 1} sur ${this.filteredMembres.length} filtrés`);
    this.cdr.detectChanges(); // Mettre à jour l'affichage
  }

  /**
   * Gère le changement de page depuis le composant Pagination.
   * @param newPage Le nouveau numéro de page.
   */
  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage !== this.currentPage) {
      console.log("Membres: Changement de page vers:", newPage);
      this.currentPage = newPage;
      this.updatePaginatedMembres();
    }
  }

  /**
   * Fonction appelée quand une ligne membre (MembreRowComponent)
   * émet l'événement (roleChangeRequested).
   */
  handleSaveRole(data: { membreId: number, newRole: RoleType }): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club non trouvé.", "error");
      return;
    }
    if (!data || !data.newRole) {
      this.notification.show("Erreur: Données de rôle invalides.", "error");
      return;
    }

    console.log(`MembreAdmin: Sauvegarde du rôle demandée: Membre ID ${data.membreId}, Club ${clubId}, Rôle ${data.newRole}`);
    // Appel au service pour effectuer la modification via l'API
    this.membreService.changeMemberRole(data.membreId, clubId, data.newRole).subscribe({
      next: (updatedMember) => { // API a répondu avec succès
        this.notification.show("Rôle du membre mis à jour.", "valid");

        // Mise à jour de la liste locale 'membres'
        const index = this.membres.findIndex(m => m.id === data.membreId);
        if (index !== -1) {
          // Crée un nouveau tableau pour l'immutabilité (bon pour OnPush)
          this.membres = [
            ...this.membres.slice(0, index),
            // Fusionne l'ancien membre avec le nouveau rôle (ou utilise updatedMember si l'API le renvoie complet)
            {...this.membres[index], role: data.newRole},
            ...this.membres.slice(index + 1)
          ];
          console.log("MembreAdmin: Liste locale des membres mise à jour.");
          this.cdr.detectChanges(); // Rafraîchir l'affichage du tableau
        } else {
          console.warn(`MembreAdmin: Membre ID ${data.membreId} non trouvé dans la liste après mise à jour.`);
          // Option: Recharger toute la liste si l'élément n'est pas trouvé
          // this.chargerMembresDuClub();
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error("MembreAdmin: Erreur lors de la mise à jour du rôle:", error);
        this.notification.show(error.message || "Erreur inconnue lors de la mise à jour.", "error");
        // Pas besoin de detectChanges ici car l'état de la liste n'a pas changé
      }
    });
  }
}

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../service/security/auth.service';
import { MembreService } from '../../../service/crud/membre.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { MembreRowComponent } from '../../../component/membre/membre-row/membre-row.component';
import { FilterMembreComponent } from '../../../component/membre/filter-membre/filter-membre.component';
import { PaginationComponent } from '../../../component/navigation/pagination/pagination.component';

import { Membre } from '../../../model/membre';
import { RoleType } from '../../../model/role';


/**
 * @Component MembreAdminComponent
 * @description Page principale pour l'administration et la gestion des membres d'un club.
 * Permet de visualiser, filtrer, trier, paginer les membres et modifier leur rôle.
 * Utilise la stratégie de détection de changements `OnPush` pour optimiser les performances.
 */
@Component({
  selector: 'app-membre-admin',
  standalone: true,
  imports: [
    CommonModule,
    MembreRowComponent,
    FilterMembreComponent,
    PaginationComponent,
  ],
  templateUrl: './membreAdmin.component.html',
  styleUrls: ['./membreAdmin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MembreAdminComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef);
  private membreService = inject(MembreService);

  // --- ÉTAT DU COMPOSANT ---
  allMembres: Membre[] = [];
  filteredMembres: Membre[] = [];
  paginatedMembres: Membre[] = [];

  isLoading = false;

  private membersSubscription: Subscription | null = null;

  // Propriétés de pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Lance le chargement initial des membres.
   */
  ngOnInit(): void {
    console.log("MembreAdminComponent: Initialisation.");
    this.chargerMembresDuClub();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne `membersSubscription`.
   */
  ngOnDestroy(): void {
    console.log("MembreAdminComponent: Destruction, désinscription de membersSubscription.");
    this.membersSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method chargerMembresDuClub
   * @description Charge la liste des membres pour le club géré.
   * Gère l'ID du club, réinitialise les listes et l'état de chargement.
   */
  chargerMembresDuClub(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club géré non trouvé. Impossible de charger les membres.", "error");
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.allMembres = [];
    this.filteredMembres = [];
    this.paginatedMembres = [];
    this.currentPage = 1;
    this.cdr.detectChanges();

    console.log(`MembreAdminComponent: Début du chargement des membres pour le club ID: ${clubId}.`);
    this.membersSubscription = this.membreService.getMembersByClub(clubId).subscribe({
      next: (data: Membre[]) => {
        this.allMembres = data;
        this.filteredMembres = [...this.allMembres];
        this.updatePaginatedMembres();
        this.isLoading = false;
        console.log(`MembreAdminComponent: ${this.allMembres.length} membres chargés.`);
        // cdr.detectChanges() est appelé dans updatePaginatedMembres.
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.allMembres = [];
        this.filteredMembres = [];
        this.paginatedMembres = [];
        console.error('MembreAdminComponent: Erreur lors du chargement des membres:', err);
        this.notification.show(err.message || 'Une erreur est survenue lors du chargement des membres.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- GESTION DES FILTRES ---
  /**
   * @method handleFilteredMembresChange
   * @description Gère la liste filtrée/triée reçue du `FilterMembreComponent`.
   * @param filteredList La liste de membres filtrée et triée.
   */
  handleFilteredMembresChange(filteredList: Membre[]): void {
    console.log(`MembreAdminComponent: Liste des membres filtrée/triée reçue (${filteredList.length} éléments).`);
    this.filteredMembres = filteredList;
    this.currentPage = 1;
    this.updatePaginatedMembres();
  }

  // --- GESTION DE LA PAGINATION ---
  /**
   * @method updatePaginatedMembres
   * @description Calcule la tranche de membres à afficher pour la page courante.
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
   * @description Gère le changement de page demandé par le `PaginationComponent`.
   * @param newPage Le nouveau numéro de page.
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
   * @description Gère la demande de modification du rôle d'un membre.
   * Appelle `MembreService.changeMemberRole` et met à jour les listes localement.
   * @param data Les données contenant l'ID du membre et son nouveau rôle.
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
      next: (updatedMember: Membre) => {
        this.notification.show(`Le rôle du membre (ID: ${data.membreId}) a été mis à jour en ${data.newRole}.`, "success");

        const indexAll = this.allMembres.findIndex(m => m.id === data.membreId);
        if (indexAll !== -1) {
          const newAllMembres = [...this.allMembres];
          newAllMembres[indexAll] = { ...newAllMembres[indexAll], role: data.newRole };
          this.allMembres = newAllMembres;
        }

        const indexFiltered = this.filteredMembres.findIndex(m => m.id === data.membreId);
        if (indexFiltered !== -1) {
          const newFilteredMembres = [...this.filteredMembres];
          newFilteredMembres[indexFiltered] = { ...newFilteredMembres[indexFiltered], role: data.newRole };
          this.filteredMembres = newFilteredMembres;
        }

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

// ----- IMPORTATIONS -----
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core'; // Ajout OnInit, OnDestroy, ChangeDetectionStrategy
import { CommonModule } from '@angular/common'; // Nécessaire pour @for
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { AuthService } from '../../../service/security/auth.service';
import { NotificationService } from '../../../service/notification.service';
import { MembreService } from '../../../service/membre.service';

// Composants
import { MembreRowComponent } from '../../../component/membre/membre-row/membre-row.component';
import { SidebarComponent } from '../../../component/navigation/sidebar/sidebar.component';

// Modèles
import { Membre } from '../../../model/membre'; // Assure-toi que ce type est correct
import { RoleType } from '../../../model/role';

// Autres (si besoin)
// import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-membre', // Le sélecteur utilisé dans le routing ou ailleurs
  standalone: true, // Rendre le composant standalone
  imports: [
    CommonModule, // Pour @for
    MembreRowComponent,
    SidebarComponent,
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

  ngOnInit(): void {
    this.chargerMembresDuClub(); // Renommé pour plus de clarté
  }

  ngOnDestroy(): void {
    this.membersSubscription?.unsubscribe(); // Nettoie l'abonnement à la destruction
  }

  /**
   * Charge la liste des membres pour le club géré via MembreService.
   */
  chargerMembresDuClub(): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club géré non trouvé.", "error");
      this.isLoading = false; // S'assurer que le chargement s'arrête
      this.cdr.detectChanges(); // Mettre à jour l'UI
      return;
    }

    this.isLoading = true;
    this.membres = []; // Vide la liste pendant le chargement
    this.cdr.detectChanges(); // Montre l'état de chargement

    // Suppose que MembreService a une méthode pour obtenir les membres par club
    // Ex: getMembersByClub(clubId: number): Observable<Membre[]>
    this.membersSubscription = this.membreService.getMembersByClub(clubId).subscribe({
      next: (data: Membre[]) => {
        this.membres = data; // Met à jour la liste avec les données reçues
        this.isLoading = false; // Arrête l'indicateur de chargement
        console.log('Membres chargés:', this.membres);
        this.cdr.detectChanges(); // Met à jour l'affichage avec les données
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false; // Arrête l'indicateur de chargement
        console.error('Erreur de chargement des membres:', err);
        this.notification.show(err.message || 'Erreur de chargement des membres.', 'error');
        this.cdr.detectChanges(); // Met à jour l'affichage pour enlever le chargement
      }
    });
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
            { ...this.membres[index], role: data.newRole },
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

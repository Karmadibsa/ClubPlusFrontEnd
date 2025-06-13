import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { AmisService } from '../../../service/crud/amis.service';
import { MembreService } from '../../../service/crud/membre.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { Clipboard } from '@angular/cdk/clipboard';

import { Membre } from '../../../model/membre';
import { DemandeAmi } from '../../../model/demandeAmi';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component AmisComponent
 * @description Page de gestion des relations d'amitié de l'utilisateur.
 * Permet de visualiser, filtrer les amis, gérer les demandes (accepter/refuser/annuler),
 * et ajouter des amis par code. Affiche aussi le code ami de l'utilisateur.
 */
@Component({
  selector: 'app-amis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './amis.component.html',
  styleUrls: ['./amis.component.scss']
})
export class AmisComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private amisService = inject(AmisService);
  private notification = inject(SweetAlertService);
  private clipboard = inject(Clipboard);
  private membreService = inject(MembreService);

  // --- ÉTAT DU COMPOSANT ---
  /** Liste complète des amis de l'utilisateur. */
  friends: Membre[] = [];
  /** Liste des amis filtrée par la recherche. */
  filteredFriends: Membre[] = [];
  /** Demandes d'ami reçues par l'utilisateur. */
  receivedRequests: DemandeAmi[] = [];
  /** Demandes d'ami envoyées par l'utilisateur. */
  sentRequests: DemandeAmi[] = [];
  /** Profil de l'utilisateur connecté, incluant son code ami. */
  currentUser: Membre | null = null;

  /** Onglet actif ('friends', 'received', ou 'sent'). */
  activeTab: 'friends' | 'received' | 'sent' = 'friends';
  /** Indique si une opération (chargement ou action API) est en cours. */
  isLoading: boolean = false;
  /** Code ami saisi par l'utilisateur pour une nouvelle demande. */
  friendCodeToAdd: string = 'AMIS-';
  /** Terme de recherche pour filtrer la liste d'amis. */
  friendSearchTerm: string = '';

  private subscriptions: Subscription[] = []; // Stocke les abonnements pour désinscription.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation du composant. Charge les données initiales.
   */
  ngOnInit(): void {
    console.log("AmisComponent: Initialisation.");
    this.loadInitialData();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne tous les Observables.
   */
  ngOnDestroy(): void {
    console.log("AmisComponent: Destruction, désinscription des abonnements.");
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadInitialData
   * @description Orchestre le chargement du profil utilisateur, des amis et des demandes.
   */
  loadInitialData(): void {
    console.log("AmisComponent: Chargement des données initiales.");
    this.isLoading = true;
    this.loadCurrentUserProfile();
    this.loadFriends();
    this.loadReceivedRequests();
    this.loadSentRequests();
  }

  /**
   * @method loadCurrentUserProfile
   * @description Charge les informations du profil de l'utilisateur connecté.
   */
  loadCurrentUserProfile(): void {
    console.log("AmisComponent: Chargement du profil utilisateur.");
    const sub = this.membreService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.currentUser = profile;
        console.log("AmisComponent: Profil utilisateur chargé:", profile);
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement du profil utilisateur:", err);
        this.notification.show("Impossible de charger vos informations utilisateur.", 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method copyCode
   * @description Copie le code fourni dans le presse-papiers.
   * @param code Le code à copier.
   */
  copyCode(code: string | undefined): void {
    if (code) {
      this.clipboard.copy(code);
      this.notification.show('Code ami copié dans le presse-papiers !', 'success');
      console.log(`AmisComponent: Code "${code}" copié.`);
    } else {
      this.notification.show('Aucun code à copier.', 'warning');
    }
  }

  /**
   * @method loadFriends
   * @description Charge la liste des amis de l'utilisateur.
   */
  loadFriends(): void {
    console.log("AmisComponent: Chargement de la liste d'amis.");
    const sub = this.amisService.getCurrentFriends().subscribe({
      next: (data) => {
        this.friends = data;
        this.filterFriendsList();
        console.log(`AmisComponent: ${data.length} amis chargés.`);
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement des amis:", err);
        this.notification.show("Erreur lors du chargement de la liste d'amis.", 'error');
        this.friends = [];
        this.filteredFriends = [];
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method filterFriendsList
   * @description Filtre la liste des amis par nom ou prénom.
   */
  filterFriendsList(): void {
    const term = this.friendSearchTerm.toLowerCase().trim();
    console.log(`AmisComponent: Filtrage de la liste d'amis avec le terme: "${term}"`);

    if (!term) {
      this.filteredFriends = [...this.friends];
    } else {
      this.filteredFriends = this.friends.filter(friend =>
        (friend.nom?.toLowerCase() || '').includes(term) ||
        (friend.prenom?.toLowerCase() || '').includes(term)
      );
    }
  }

  /**
   * @method loadReceivedRequests
   * @description Charge les demandes d'ami reçues par l'utilisateur.
   */
  loadReceivedRequests(): void {
    console.log("AmisComponent: Chargement des demandes d'ami reçues.");
    const sub = this.amisService.getReceivedFriendRequests().subscribe({
      next: (data) => {
        this.receivedRequests = data;
        console.log(`AmisComponent: ${data.length} demandes reçues chargées.`);
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement des demandes reçues:", err);
        this.receivedRequests = [];
        this.notification.show("Erreur lors du chargement des demandes reçues.", 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method loadSentRequests
   * @description Charge les demandes d'ami envoyées par l'utilisateur.
   */
  loadSentRequests(): void {
    console.log("AmisComponent: Chargement des demandes d'ami envoyées.");
    const sub = this.amisService.getSentFriendRequests().subscribe({
      next: (data: DemandeAmi[]) => {
        this.sentRequests = data;
        console.log(`AmisComponent: ${data.length} demandes envoyées chargées.`);
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement des demandes envoyées:", err);
        this.sentRequests = [];
        this.notification.show("Erreur lors du chargement des demandes envoyées.", 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  // --- GESTION DES ONGLETS ---
  /**
   * @method setActiveTab
   * @description Définit l'onglet actif dans l'UI.
   * @param tabName Le nom de l'onglet à activer.
   */
  setActiveTab(tabName: 'friends' | 'received' | 'sent'): void {
    this.activeTab = tabName;
    console.log(`AmisComponent: Onglet actif changé pour: ${tabName}`);
  }

  // --- ACTIONS UTILISATEUR ---
  /**
   * @method addFriendByCode
   * @description Envoie une demande d'ami via un code.
   */
  addFriendByCode(): void {
    const code = this.friendCodeToAdd.trim();
    if (!code || code === 'AMIS-') {
      this.notification.show("Veuillez entrer un code ami valide.", 'warning');
      return;
    }
    this.isLoading = true;

    console.log(`AmisComponent: Envoi d'une demande d'ami avec le code: ${code}`);
    const sub = this.amisService.sendFriendRequestByCode(code).subscribe({
      next: (demandeCreee) => {
        this.isLoading = false;
        this.notification.show(`Demande d'ami envoyée avec succès !`, 'success');
        this.friendCodeToAdd = 'AMIS-';
        this.loadSentRequests();
        console.log("AmisComponent: Demande d'ami envoyée:", demandeCreee);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error("AmisComponent: Erreur lors de l'envoi de la demande par code:", err);
        const errorMessage = err.error?.message || err.message || "Erreur lors de l'envoi de la demande. Vérifiez le code ou si une demande existe déjà.";
        this.notification.show(errorMessage, 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method removeFriend
   * @description Demande confirmation avant de supprimer un ami.
   * @param friendId L'ID de l'ami à supprimer.
   */
  removeFriend(friendId: number): void {
    const friendToRemove = this.friends.find(f => f.id === friendId);
    const friendName = friendToRemove ? `${friendToRemove.prenom} ${friendToRemove.nom}` : `cet ami (ID: ${friendId})`;

    this.notification.confirmAction(
      `Retirer ${friendName} ?`,
      `Êtes-vous sûr de vouloir retirer définitivement ${friendName} de votre liste d'amis ?`,
      () => {
        console.log(`AmisComponent: Confirmation reçue pour supprimer l'ami ID: ${friendId}`);
        this.isLoading = true;

        const sub = this.amisService.removeFriend(friendId).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.show('Ami retiré avec succès.', 'success');
            this.loadFriends();
            console.log(`AmisComponent: Ami ID ${friendId} retiré.`);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`AmisComponent: Erreur lors de la suppression de l'ami ID ${friendId}:`, err);
            const message = err.error?.message || err.message || "Erreur lors de la suppression de l'ami.";
            this.notification.show(message, 'error');
          }
        });
        this.subscriptions.push(sub);
      },
      'Oui, retirer',
      'Annuler'
    );
  }

  /**
   * @method acceptFriendRequest
   * @description Accepte une demande d'ami reçue.
   * @param requestId L'ID de la demande à accepter.
   */
  acceptFriendRequest(requestId: number): void {
    this.isLoading = true;

    console.log(`AmisComponent: Acceptation de la demande d'ami ID: ${requestId}`);
    const sub = this.amisService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.show("Demande d'ami acceptée avec succès.", 'success');
        this.loadFriends();
        this.loadReceivedRequests();
        console.log(`AmisComponent: Demande ID ${requestId} acceptée.`);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error(`AmisComponent: Erreur lors de l'acceptation de la demande ID ${requestId}:`, err);
        this.notification.show(err.error?.message || err.message || "Erreur lors de l'acceptation de la demande.", 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method rejectFriendRequest
   * @description Demande confirmation avant de refuser une demande d'ami reçue.
   * @param requestId L'ID de la demande à refuser.
   */
  rejectFriendRequest(requestId: number): void {
    this.notification.confirmAction(
      "Refuser cette demande d'ami ?",
      "Êtes-vous sûr de vouloir refuser cette demande d'ami ?",
      () => {
        console.log(`AmisComponent: Confirmation reçue pour refuser la demande ID: ${requestId}`);
        this.isLoading = true;

        const sub = this.amisService.rejectFriendRequest(requestId).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.show("Demande d'ami refusée.", 'info');
            this.loadReceivedRequests();
            console.log(`AmisComponent: Demande ID ${requestId} refusée.`);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`AmisComponent: Erreur lors du refus de la demande ID ${requestId}:`, err);
            this.notification.show(err.error?.message || err.message || "Erreur lors du refus de la demande.", 'error');
          }
        });
        this.subscriptions.push(sub);
      },
      'Oui, refuser',
      'Annuler'
    );
  }

  /**
   * @method cancelSentFriendRequest
   * @description Demande confirmation avant d'annuler une demande d'ami envoyée.
   * @param requestId L'ID de la demande envoyée à annuler.
   */
  cancelSentFriendRequest(requestId: number): void {
    this.notification.confirmAction(
      "Annuler votre demande d'ami ?",
      "Êtes-vous sûr de vouloir annuler la demande d'ami que vous avez envoyée ?",
      () => {
        console.log(`AmisComponent: Confirmation reçue pour annuler la demande envoyée ID: ${requestId}`);
        this.isLoading = true;

        const sub = this.amisService.cancelSentFriendRequest(requestId).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.show("Demande d'ami annulée.", 'info');
            this.loadSentRequests();
            console.log(`AmisComponent: Demande envoyée ID ${requestId} annulée.`);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`AmisComponent: Erreur lors de l'annulation de la demande ID ${requestId}:`, err);
            this.notification.show(err.error?.message || err.message || "Erreur lors de l'annulation de la demande.", 'error');
          }
        });
        this.subscriptions.push(sub);
      },
      'Oui, annuler',
      'Non, laisser la demande'
    );
  }
}

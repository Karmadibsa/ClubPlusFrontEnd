// ----- IMPORTATIONS -----
import { Component, inject, OnInit, OnDestroy } from '@angular/core'; // Ajout de OnDestroy
import { CommonModule } from '@angular/common';         // Pour @if, @for (ou NgIf/NgForOf), pipes...
import { FormsModule } from '@angular/forms';           // Pour [(ngModel)]
import { Subscription } from 'rxjs';                  // Pour gérer la désinscription.

// Services
import { AmisService } from '../../../service/crud/amis.service'; // Service pour la gestion des amis.
import { MembreService } from '../../../service/crud/membre.service'; // Service pour récupérer le profil utilisateur.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications et confirmations.
import { Clipboard } from '@angular/cdk/clipboard'; // Pour copier dans le presse-papiers.

// Modèles (Interfaces de données)
import { Membre } from '../../../model/membre';         // Interface décrivant un membre.
import { DemandeAmi } from '../../../model/demandeAmi'; // Interface décrivant une demande d'ami.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * @Component AmisComponent
 * @description
 * Page permettant à l'utilisateur connecté de gérer ses relations d'amitié.
 * Cela inclut la visualisation de sa liste d'amis (avec filtrage),
 * la gestion des demandes d'ami reçues (accepter/refuser) et envoyées (annuler),
 * ainsi que l'ajout de nouveaux amis via leur code unique et la suppression d'amis existants.
 * Affiche également le code ami de l'utilisateur pour qu'il puisse le partager.
 *
 * @example
 * <app-amis></app-amis> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-amis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,        // Pour [(ngModel)] sur les champs de recherche et d'ajout.
    LucideAngularModule // Pour les icônes.
  ],
  templateUrl: './amis.component.html',
  styleUrls: ['./amis.component.scss'] // Note: 'styleUrls' est un tableau.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Peut être ajouté si des optimisations sont nécessaires.
})
export class AmisComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service pour toutes les opérations liées à la gestion des amis et des demandes d'ami.
   */
  private amisService = inject(AmisService);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) et des boîtes de dialogue de confirmation.
   */
  private notification = inject(SweetAlertService);
  /**
   * @private
   * @description Service Angular CDK pour interagir avec le presse-papiers du système.
   */
  private clipboard = inject(Clipboard);
  /**
   * @private
   * @description Service pour récupérer les informations du profil de l'utilisateur actuellement connecté.
   */
  private membreService = inject(MembreService);

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Membre[]} friends
   * @description Tableau stockant la liste complète des amis de l'utilisateur.
   * Sert de source de vérité pour le filtrage.
   * @default []
   */
  friends: Membre[] = [];
  /**
   * @property {Membre[]} filteredFriends
   * @description Tableau stockant la liste des amis à afficher après application du filtre de recherche.
   * @default []
   */
  filteredFriends: Membre[] = [];
  /**
   * @property {DemandeAmi[]} receivedRequests
   * @description Tableau stockant les demandes d'ami reçues par l'utilisateur.
   * @default []
   */
  receivedRequests: DemandeAmi[] = [];
  /**
   * @property {DemandeAmi[]} sentRequests
   * @description Tableau stockant les demandes d'ami envoyées par l'utilisateur.
   * @default []
   */
  sentRequests: DemandeAmi[] = [];
  /**
   * @property {Membre | null} currentUser
   * @description Stocke les informations du profil de l'utilisateur actuellement connecté,
   * notamment son code ami.
   * @default null
   */
  currentUser: Membre | null = null;

  /**
   * @property {'friends' | 'received' | 'sent'} activeTab
   * @description Indique l'onglet actuellement actif dans l'interface utilisateur.
   * @default 'friends'
   */
  activeTab: 'friends' | 'received' | 'sent' = 'friends';
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si une opération de chargement de données ou une action (appel API) est en cours.
   * Utilisé pour afficher des indicateurs de chargement et désactiver des boutons.
   * @default false
   */
  isLoading: boolean = false;
  /**
   * @property {string} friendCodeToAdd
   * @description Le code ami saisi par l'utilisateur pour envoyer une nouvelle demande d'ami.
   * Lié à un champ de formulaire via `[(ngModel)]`.
   * @default 'AMIS-' (préfixe pour guider l'utilisateur)
   */
  friendCodeToAdd: string = 'AMIS-';
  /**
   * @property {string} friendSearchTerm
   * @description Le terme de recherche saisi par l'utilisateur pour filtrer sa liste d'amis.
   * Lié à un champ de formulaire via `[(ngModel)]`.
   * @default ''
   */
  friendSearchTerm: string = '';

  /**
   * @private
   * @property {Subscription[]} subscriptions
   * @description Tableau pour stocker tous les abonnements RxJS afin de les désinscrire
   * proprement dans `ngOnDestroy`.
   */
  private subscriptions: Subscription[] = [];

  // Le constructeur est implicitement fourni par Angular car pas de logique complexe.
  // Si AmisService était injecté via le constructeur : constructor(private amisService: AmisService) {}

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Déclenche le chargement de toutes les données initiales nécessaires à la page.
   * @see {@link loadInitialData}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("AmisComponent: Initialisation.");
    this.loadInitialData();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de tous les abonnements RxJS stockés pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("AmisComponent: Destruction, désinscription des abonnements.");
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadInitialData
   * @description Orchestre le chargement de toutes les listes de données nécessaires :
   * profil de l'utilisateur, liste d'amis, demandes reçues et demandes envoyées.
   * @returns {void}
   */
  loadInitialData(): void {
    console.log("AmisComponent: Chargement des données initiales.");
    this.isLoading = true; // Indicateur de chargement global pour le chargement initial.
    // Le profil est chargé en premier pour potentiellement utiliser le code ami rapidement.
    this.loadCurrentUserProfile();
    this.loadFriends();
    this.loadReceivedRequests();
    this.loadSentRequests();
    // Note : isLoading sera mis à false par le dernier appel de chargement qui se termine
    // ou par chaque appel individuellement si nécessaire (ici, `loadFriends` semble le gérer globalement).
  }

  /**
   * @method loadCurrentUserProfile
   * @description Charge les informations du profil de l'utilisateur actuellement connecté.
   * @returns {void}
   */
  loadCurrentUserProfile(): void {
    // Ne pas remettre isLoading à true si loadInitialData l'a déjà fait.
    console.log("AmisComponent: Chargement du profil utilisateur.");
    const sub = this.membreService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.currentUser = profile;
        console.log("AmisComponent: Profil utilisateur chargé:", profile);
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement du profil utilisateur:", err);
        this.notification.show("Impossible de charger vos informations utilisateur.", 'error');
        // this.isLoading = false; // Géré par le `complete` de `loadFriends` ou un `finalize`.
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method copyCode
   * @description Copie le code ami de l'utilisateur (ou tout autre code fourni) dans le presse-papiers.
   * @param {string | undefined} code - Le code à copier.
   * @returns {void}
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
   * Met à jour `friends` et `filteredFriends`.
   * Gère l'indicateur `isLoading`.
   * @returns {void}
   */
  loadFriends(): void {
    // this.isLoading = true; // Géré par loadInitialData ou par action spécifique.
    console.log("AmisComponent: Chargement de la liste d'amis.");
    const sub = this.amisService.getCurrentFriends().subscribe({
      next: (data) => {
        this.friends = data;
        this.filterFriendsList(); // Applique le filtre initial (qui affichera tout si searchTerm est vide).
        console.log(`AmisComponent: ${data.length} amis chargés.`);
        // this.cdr.detectChanges(); // Si OnPush
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement des amis:", err);
        this.notification.show("Erreur lors du chargement de la liste d'amis.", 'error');
        this.friends = []; this.filteredFriends = []; // Vide les listes en cas d'erreur.
        this.isLoading = false; // S'assurer que isLoading est false si c'est le dernier appel.
      },
      complete: () => {
        // Ce `complete` est un bon endroit pour mettre isLoading à false si les autres chargements
        // sont aussi terminés ou gèrent leur propre isLoading.
        // Si c'est le "dernier" appel attendu dans loadInitialData, on peut le mettre ici.
        this.isLoading = false;
        // this.cdr.detectChanges(); // Si OnPush
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method filterFriendsList
   * @description Filtre la liste `friends` basée sur `friendSearchTerm` (nom ou prénom).
   * Met à jour `filteredFriends` qui est la liste affichée dans le template.
   * Appelée lorsque `friendSearchTerm` change.
   * @returns {void}
   */
  filterFriendsList(): void {
    const term = this.friendSearchTerm.toLowerCase().trim();
    console.log(`AmisComponent: Filtrage de la liste d'amis avec le terme: "${term}"`);

    if (!term) {
      this.filteredFriends = [...this.friends]; // Affiche tous les amis si la recherche est vide.
    } else {
      this.filteredFriends = this.friends.filter(friend =>
        (friend.nom?.toLowerCase() || '').includes(term) ||
        (friend.prenom?.toLowerCase() || '').includes(term)
      );
    }
    // this.cdr.detectChanges(); // Si OnPush
  }

  /**
   * @method loadReceivedRequests
   * @description Charge la liste des demandes d'ami reçues par l'utilisateur.
   * @returns {void}
   */
  loadReceivedRequests(): void {
    // this.isLoading = true; // Géré par loadInitialData ou par action spécifique.
    console.log("AmisComponent: Chargement des demandes d'ami reçues.");
    const sub = this.amisService.getReceivedFriendRequests().subscribe({
      next: (data) => {
        this.receivedRequests = data;
        console.log(`AmisComponent: ${data.length} demandes reçues chargées.`);
        // this.isLoading = false; // Attendre la fin des autres chargements.
        // this.cdr.detectChanges(); // Si OnPush
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement des demandes reçues:", err);
        this.receivedRequests = [];
        this.notification.show("Erreur lors du chargement des demandes reçues.", 'error');
        // this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method loadSentRequests
   * @description Charge la liste des demandes d'ami envoyées par l'utilisateur.
   * @returns {void}
   */
  loadSentRequests(): void {
    // this.isLoading = true; // Géré par loadInitialData ou par action spécifique.
    console.log("AmisComponent: Chargement des demandes d'ami envoyées.");
    const sub = this.amisService.getSentFriendRequests().subscribe({
      next: (data: DemandeAmi[]) => {
        this.sentRequests = data;
        console.log(`AmisComponent: ${data.length} demandes envoyées chargées.`);
        // this.isLoading = false; // Attendre la fin des autres chargements.
        // this.cdr.detectChanges(); // Si OnPush
      },
      error: (err) => {
        console.error("AmisComponent: Erreur lors du chargement des demandes envoyées:", err);
        this.sentRequests = [];
        this.notification.show("Erreur lors du chargement des demandes envoyées.", 'error');
        // this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // --- GESTION DES ONGLETS ---
  /**
   * @method setActiveTab
   * @description Définit l'onglet actif dans l'interface utilisateur.
   * @param {'friends' | 'received' | 'sent'} tabName - Le nom de l'onglet à activer.
   * @returns {void}
   */
  setActiveTab(tabName: 'friends' | 'received' | 'sent'): void {
    this.activeTab = tabName;
    console.log(`AmisComponent: Onglet actif changé pour: ${tabName}`);
    // this.cdr.detectChanges(); // Si OnPush et que des styles dépendent de activeTab.
  }

  // --- ACTIONS UTILISATEUR (AVEC NOTIFICATIONS ET CONFIRMATIONS) ---
  /**
   * @method addFriendByCode
   * @description Envoie une demande d'ami en utilisant le code ami fourni par l'utilisateur.
   * Valide la saisie, appelle `AmisService`, et gère les notifications de succès/erreur.
   * Met à jour la liste des demandes envoyées après succès.
   * @returns {void}
   */
  addFriendByCode(): void {
    const code = this.friendCodeToAdd.trim();
    if (!code || code === 'AMIS-') { // Vérifie aussi si c'est juste le préfixe.
      this.notification.show("Veuillez entrer un code ami valide.", 'warning');
      return;
    }
    this.isLoading = true;
    // this.cdr.detectChanges(); // Si OnPush

    console.log(`AmisComponent: Envoi d'une demande d'ami avec le code: ${code}`);
    const sub = this.amisService.sendFriendRequestByCode(code).subscribe({
      next: (demandeCreee) => { // L'API retourne la demande créée.
        this.isLoading = false;
        this.notification.show(`Demande d'ami envoyée avec succès à l'utilisateur associé au code !`, 'success');
        this.friendCodeToAdd = 'AMIS-'; // Réinitialise le champ.
        this.loadSentRequests();     // Met à jour la liste des demandes envoyées.
        console.log("AmisComponent: Demande d'ami envoyée:", demandeCreee);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error("AmisComponent: Erreur lors de l'envoi de la demande par code:", err);
        const errorMessage = err.error?.message || err.message || "Erreur lors de l'envoi de la demande. Vérifiez le code ou si une demande existe déjà.";
        this.notification.show(errorMessage, 'error');
        // this.cdr.detectChanges(); // Si OnPush
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method removeFriend
   * @description Demande la confirmation de l'utilisateur avant de supprimer un ami.
   * Si confirmé, appelle `AmisService` pour supprimer l'ami et met à jour la liste d'amis.
   * @param {number} friendId - L'ID du membre à supprimer de la liste d'amis.
   * @returns {void}
   */
  removeFriend(friendId: number): void {
    const friendToRemove = this.friends.find(f => f.id === friendId);
    const friendName = friendToRemove ? `${friendToRemove.prenom} ${friendToRemove.nom}` : `cet ami (ID: ${friendId})`;

    this.notification.confirmAction(
      `Retirer ${friendName} ?`,
      `Êtes-vous sûr de vouloir retirer définitivement ${friendName} de votre liste d'amis ?`,
      () => { // Callback si l'utilisateur confirme.
        console.log(`AmisComponent: Confirmation reçue pour supprimer l'ami ID: ${friendId}`);
        this.isLoading = true;
        // this.cdr.detectChanges(); // Si OnPush

        const sub = this.amisService.removeFriend(friendId).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.show('Ami retiré avec succès.', 'success');
            this.loadFriends(); // Recharge la liste des amis.
            console.log(`AmisComponent: Ami ID ${friendId} retiré.`);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`AmisComponent: Erreur lors de la suppression de l'ami ID ${friendId}:`, err);
            const message = err.error?.message || err.message || "Erreur lors de la suppression de l'ami.";
            this.notification.show(message, 'error');
            // this.cdr.detectChanges(); // Si OnPush
          }
        });
        this.subscriptions.push(sub);
      },
      'Oui, retirer', // Texte du bouton de confirmation.
      'Annuler'          // Texte du bouton d'annulation.
    );
  }

  /**
   * @method acceptFriendRequest
   * @description Accepte une demande d'ami reçue.
   * Appelle `AmisService` et met à jour les listes d'amis et de demandes reçues.
   * @param {number} requestId - L'ID de la demande d'ami à accepter.
   * @returns {void}
   */
  acceptFriendRequest(requestId: number): void {
    this.isLoading = true;
    // this.cdr.detectChanges(); // Si OnPush

    console.log(`AmisComponent: Acceptation de la demande d'ami ID: ${requestId}`);
    const sub = this.amisService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.show("Demande d'ami acceptée avec succès.", 'success');
        this.loadFriends();           // Met à jour la liste d'amis.
        this.loadReceivedRequests();  // Met à jour la liste des demandes reçues.
        console.log(`AmisComponent: Demande ID ${requestId} acceptée.`);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error(`AmisComponent: Erreur lors de l'acceptation de la demande ID ${requestId}:`, err);
        this.notification.show(err.error?.message || err.message || "Erreur lors de l'acceptation de la demande.", 'error');
        // this.cdr.detectChanges(); // Si OnPush
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method rejectFriendRequest
   * @description Demande la confirmation de l'utilisateur avant de refuser une demande d'ami reçue.
   * Si confirmé, appelle `AmisService` et met à jour la liste des demandes reçues.
   * @param {number} requestId - L'ID de la demande d'ami à refuser.
   * @returns {void}
   */
  rejectFriendRequest(requestId: number): void {
    this.notification.confirmAction(
      "Refuser cette demande d'ami ?",
      "Êtes-vous sûr de vouloir refuser cette demande d'ami ?",
      () => { // Callback si confirmé.
        console.log(`AmisComponent: Confirmation reçue pour refuser la demande ID: ${requestId}`);
        this.isLoading = true;
        // this.cdr.detectChanges(); // Si OnPush

        const sub = this.amisService.rejectFriendRequest(requestId).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.show("Demande d'ami refusée.", 'info'); // 'info' est approprié pour un refus.
            this.loadReceivedRequests(); // Met à jour la liste des demandes reçues.
            console.log(`AmisComponent: Demande ID ${requestId} refusée.`);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`AmisComponent: Erreur lors du refus de la demande ID ${requestId}:`, err);
            this.notification.show(err.error?.message || err.message || "Erreur lors du refus de la demande.", 'error');
            // this.cdr.detectChanges(); // Si OnPush
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
   * @description Demande la confirmation de l'utilisateur avant d'annuler une demande d'ami envoyée.
   * Si confirmé, appelle `AmisService` et met à jour la liste des demandes envoyées.
   * @param {number} requestId - L'ID de la demande d'ami envoyée à annuler.
   * @returns {void}
   */
  cancelSentFriendRequest(requestId: number): void {
    this.notification.confirmAction(
      "Annuler votre demande d'ami ?",
      "Êtes-vous sûr de vouloir annuler la demande d'ami que vous avez envoyée ?",
      () => { // Callback si confirmé.
        console.log(`AmisComponent: Confirmation reçue pour annuler la demande envoyée ID: ${requestId}`);
        this.isLoading = true;
        // this.cdr.detectChanges(); // Si OnPush

        const sub = this.amisService.cancelSentFriendRequest(requestId).subscribe({
          next: () => {
            this.isLoading = false;
            this.notification.show("Demande d'ami annulée.", 'info'); // 'info' est approprié.
            this.loadSentRequests(); // Met à jour la liste des demandes envoyées.
            console.log(`AmisComponent: Demande envoyée ID ${requestId} annulée.`);
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`AmisComponent: Erreur lors de l'annulation de la demande ID ${requestId}:`, err);
            this.notification.show(err.error?.message || err.message || "Erreur lors de l'annulation de la demande.", 'error');
            // this.cdr.detectChanges(); // Si OnPush
          }
        });
        this.subscriptions.push(sub);
      },
      'Oui, annuler',
      'Non, laisser la demande'
    );
  }
}

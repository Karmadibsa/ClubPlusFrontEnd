import {Component, inject, OnInit} from '@angular/core'; // Ajout OnInit
import {CommonModule} from '@angular/common'; // Ajout pour standalone
import {FormsModule} from '@angular/forms';
import {Membre} from '../../../model/membre';
import {AmisService} from '../../../service/model/amis.service';
import {DemandeAmi} from '../../../model/demandeAmi';
import {LucideAngularModule} from 'lucide-angular';
import {MembreService} from '../../../service/model/membre.service';
import {Clipboard} from '@angular/cdk/clipboard';
import {SweetAlertService} from '../../../service/sweet-alert.service'; // Assurez que le chemin est correct

@Component({
  selector: 'app-amis',
  standalone: true, // Ajout car imports est utilisé
  imports: [
    CommonModule, // Ajout
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './amis.component.html',
  styleUrls: ['./amis.component.scss'] // Utilise styleUrls (pluriel)
})
export class AmisComponent implements OnInit { // Implémente OnInit

  private swalService = inject(SweetAlertService);

  private clipboard = inject(Clipboard); // <-- Injecter Clipboard
  private membreService = inject(MembreService); // <-- Injection de MembreService via inject
  private notification = inject(SweetAlertService);
  // --- State Variables ---
  friends: Membre[] = [];
  filteredFriends: Membre[] = []; // <-- NOUVEAU: Liste affichée et filtrée
  receivedRequests: DemandeAmi[] = [];
  sentRequests: DemandeAmi[] = [];
  currentUser: Membre | null = null; // <-- Propriété pour stocker le profil utilisateur

  activeTab: 'friends' | 'received' | 'sent' = 'friends';
  isLoading: boolean = false;
  friendCodeToAdd: string = 'AMIS-';
  friendSearchTerm: string = ''; // <-- NOUVEAU: Terme de recherche pour les amis


  constructor(private amisService: AmisService) {
  }

  ngOnInit(): void {
    this.loadInitialData();
    // Nettoyage des logs de débogage précédents
    // console.log('...');
  }

  // --- Data Loading (inchangé) ---
  loadInitialData(): void {
    this.loadFriends();
    this.loadReceivedRequests();
    this.loadSentRequests();
    this.loadCurrentUserProfile(); // Charger le profil en premier (ou en parallèle)

  }

  loadCurrentUserProfile(): void {
    this.isLoading = true; // Peut utiliser un indicateur de chargement spécifique si besoin
    this.membreService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        this.currentUser = profile;
        // Ne pas mettre isLoading à false ici si d'autres appels sont en cours
        // this.isLoading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement du profil utilisateur:", err);
        this.notification.show("Impossible de charger les informations utilisateur.", 'error');
        // this.isLoading = false; // Mettre à false en cas d'erreur
      }
      // Note: On suppose que isLoading sera mis à false à la fin des autres appels load...()
    });

  }

  copyCode(code: string | undefined): void {
    if (code) {
      this.clipboard.copy(code);
      this.notification.show('Code ami copié dans le presse-papiers !', 'success');
    }
  }

  loadFriends(): void {
    this.isLoading = true;
    this.amisService.getCurrentFriends().subscribe({
      next: (data) => {
        this.friends = data; // Stocke la liste originale
        this.filteredFriends = [...this.friends]; // Initialise la liste filtrée avec la copie complète
        // this.isLoading = false; // On laisse complete() gérer isLoading
      },
      error: (err) => {
        console.error("Erreur lors du chargement des amis:", err);
        this.notification.show("Erreur chargement amis.", 'error');
        this.isLoading = false; // Mettre à false en cas d'erreur
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // --- NOUVELLE MÉTHODE : Filtrer la liste d'amis ---
  filterFriendsList(): void {
    const term = this.friendSearchTerm.toLowerCase().trim();

    if (!term) {
      // Si la recherche est vide, afficher toute la liste originale
      this.filteredFriends = [...this.friends];
    } else {
      // Sinon, filtrer la liste originale
      this.filteredFriends = this.friends.filter(friend =>
        friend.nom.toLowerCase().includes(term) ||
        friend.prenom.toLowerCase().includes(term)
      );
    }
  }

  loadReceivedRequests(): void {
    this.isLoading = true; // Ajout isLoading
    this.amisService.getReceivedFriendRequests().subscribe({
      next: (data) => {
        this.receivedRequests = data;
        this.isLoading = false; // Ajout isLoading
      },
      error: (err) => {
        console.error("Erreur lors du chargement des demandes reçues:", err);
        this.isLoading = false; // Ajout isLoading
        this.notification.show("Erreur lors du chargement des demandes reçues.", 'error'); // Notification d'erreur
      }
    });
  }

  loadSentRequests(): void {
    this.isLoading = true;
    this.amisService.getSentFriendRequests().subscribe({
      next: (data: DemandeAmi[]) => {
        this.sentRequests = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des demandes envoyées:", err);
        this.isLoading = false;
        this.notification.show("Erreur lors du chargement des demandes envoyées.", 'error'); // Notification d'erreur
      }
    });
  }

  // --- Tab Management (inchangé) ---
  setActiveTab(tabName: 'friends' | 'received' | 'sent'): void {
    this.activeTab = tabName;
  }

  // --- Actions avec Notifications ---

  addFriendByCode(): void {
    const code = this.friendCodeToAdd.trim(); // Utiliser une variable locale
    if (!code) {
      this.notification.show("Veuillez entrer un code ami.", 'warning'); // ou 'error'
      return;
    }
    this.isLoading = true;

    this.amisService.sendFriendRequestByCode(code).subscribe({
      next: (demandeCreee) => {
        this.isLoading = false;
        this.notification.show(`Demande d'ami envoyée avec succès !`, 'success');
        this.friendCodeToAdd = ''; // Vider le champ après succès
        this.loadSentRequests(); // Mettre à jour la liste des demandes envoyées
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Erreur lors de l'envoi de la demande par code:", err);
        // Utiliser le message d'erreur retourné par le service si disponible
        const errorMessage = err.message || "Erreur lors de l'envoi de la demande.";
        this.notification.show(errorMessage, 'error');
      }
    });
  }

  removeFriend(friendId: number): void {

    // --- Remplacement de confirm() ---
    this.swalService.confirmAction(
      'Retirer cet ami ?', // Titre
      'Êtes-vous sûr de vouloir retirer définitivement cet ami de votre liste ?', // Texte

      // --- Callback si confirmé ---
      () => {
        // --- Code qui était après le confirm() va ici ---
        console.log('Confirmation reçue, suppression ami ID:', friendId);
        this.isLoading = true;
        // Optionnel: this.cdr.detectChanges(); si OnPush

        this.amisService.removeFriend(friendId).subscribe({
          next: () => {
            this.isLoading = false;
            this.swalService.show('Ami retiré avec succès.', 'success'); // Nouveau
            this.loadFriends(); // Recharger la liste
            // Optionnel: this.cdr.detectChanges(); si OnPush
          },
          error: (err) => {
            this.isLoading = false;
            console.error("Erreur lors de la suppression de l'ami:", err);
            const message = err.message || "Erreur lors de la suppression de l'ami.";
            this.swalService.show(message, 'error'); // Nouveau
            // Optionnel: this.cdr.detectChanges(); si OnPush
          }
        });
        // ---------------------------------------------
      }
      // --- Fin Callback ---
      , 'Oui, retirer' // Texte bouton confirmer (optionnel)
      // , 'Annuler' // Texte bouton annuler (optionnel)
    );
  }

  acceptFriendRequest(requestId: number): void {
    this.isLoading = true; // Ajout
    this.amisService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.isLoading = false; // Ajout
        this.notification.show("Demande acceptée.", 'success');
        this.loadFriends();
        this.loadReceivedRequests();
      },
      error: (err) => {
        this.isLoading = false; // Ajout
        console.error("Erreur lors de l'acceptation de la demande:", err);
        this.notification.show(err.message || "Erreur lors de l'acceptation de la demande.", 'error'); // Message d'erreur plus précis
      }
    });
  }

  rejectFriendRequest(requestId: number): void {
    this.swalService.confirmAction(
      "Refuser cette demande d'ami ?", // Titre de la modale
      "Êtes-vous sûr de vouloir refuser cette demande d'ami ?", // Texte de la modale
      () => { // --- Début de la fonction de rappel (Callback) si confirmé ---
        this.isLoading = true;
        this.amisService.rejectFriendRequest(requestId).subscribe({
          next: () => {
            this.isLoading = false;
            // La notification 'success' peut sembler étrange pour un refus.
            // 'info' pourrait être plus approprié, ou pas de type spécifique.
            this.notification.show("Demande refusée.", 'info');
            this.loadReceivedRequests(); // Recharger la liste des demandes reçues
          },
          error: (err) => {
            this.isLoading = false;
            console.error("Erreur lors du refus de la demande:", err);
            this.notification.show(err.message || "Erreur lors du refus de la demande.", 'error');
          }
        });
      }, // --- Fin de la fonction de rappel ---
      'Oui, refuser', // Texte du bouton de confirmation
      'Annuler'       // Texte du bouton d'annulation (optionnel)
    );
  }


  cancelSentFriendRequest(requestId: number): void {
    this.swalService.confirmAction(
      "Annuler votre demande d'ami ?", // Titre de la modale
      "Êtes-vous sûr de vouloir annuler la demande d'ami que vous avez envoyée ?", // Texte de la modale
      () => { // --- Début de la fonction de rappel (Callback) si confirmé ---
        this.isLoading = true;
        this.amisService.cancelSentFriendRequest(requestId).subscribe({
          next: () => {
            this.isLoading = false;
            // 'info' pourrait être plus approprié que 'success' pour une annulation.
            this.notification.show("Demande annulée.", 'info');
            this.loadSentRequests(); // Recharger la liste des demandes envoyées
          },
          error: (err) => {
            this.isLoading = false;
            console.error("Erreur lors de l'annulation de la demande:", err);
            this.notification.show(err.message || "Erreur lors de l'annulation de la demande.", 'error');
          }
        });
      }, // --- Fin de la fonction de rappel ---
      'Oui, annuler', // Texte du bouton de confirmation
      'Non, laisser'    // Texte du bouton d'annulation (optionnel, ex: "Garder la demande")
    );
  }
}


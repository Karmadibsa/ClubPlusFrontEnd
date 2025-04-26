// ----- IMPORTATIONS -----
// Modules Angular essentiels
import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, PercentPipe } from '@angular/common'; // Pour *ngIf, *ngFor, le pipe 'percent'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Pour faire les appels API
import { Router } from '@angular/router'; // Pour la navigation (si besoin)
import { forkJoin, Observable, of, Subscription } from 'rxjs'; // Outils pour gérer plusieurs appels API en parallèle (forkJoin)
import { catchError, map } from 'rxjs/operators'; // Outil pour gérer les erreurs API (catchError)

// Services de votre application
import { AuthService } from '../../../service/security/auth.service';       // Pour savoir qui est connecté et quel club il gère
import { NotificationService } from '../../../service/notification.service'; // Pour afficher des messages (succès, erreur)
import { MembreService } from '../../../service/membre.service';           // Pour les opérations liées aux membres
import { EventService } from '../../../service/event.service';             // Pour les opérations liées aux événements

// Composants utilisés dans le template HTML
import { SidebarComponent } from '../../../component/navigation/sidebar/sidebar.component'; // Votre menu latéral
import { StatCardComponent } from '../../../component/dashboard/stat-card/stat-card.component'; // Carte pour afficher un chiffre clé
import { EventRowComponent } from '../../../component/event/event-row/event-row.component';       // Ligne du tableau des événements
import { MembreRowComponent } from '../../../component/membre/membre-row/membre-row.component';      // Ligne du tableau des membres
import { MembreDetailModalComponent } from '../../../component/membre/membre-detail-modal/membre-detail-modal.component'; // Modale pour voir/modifier un membre

// Types de données (Modèles)
import { Membre } from '../../../model/membre'; // Interface décrivant un Membre (à créer/vérifier)
import { Evenement } from '../../../model/evenement'; // Interface décrivant un Evenement (à créer/vérifier)
import { RoleType } from '../../../model/role';         // Type pour les rôles ('MEMBRE', 'RESERVATION', 'ADMIN')

// Outils pour les graphiques (Chart.js via ng2-charts)
import { ChartData, ChartOptions } from 'chart.js'; // Types pour configurer les graphiques
import { BaseChartDirective } from 'ng2-charts';   // La directive pour afficher un graphique dans le HTML

// -------------------------

// Configuration du composant Angular
@Component({
  selector: 'app-dashboard', // Nom de la balise HTML: <app-dashboard>
  standalone: true,          // Composant "moderne" qui gère ses propres dépendances
  imports: [                 // Liste des modules et composants nécessaires pour le template HTML
    CommonModule,
    PercentPipe,
    SidebarComponent,
    BaseChartDirective,      // Nécessaire pour <canvas baseChart ...>
    StatCardComponent,
    EventRowComponent,
    MembreRowComponent,
    MembreDetailModalComponent
  ],
  templateUrl: './dashboard.component.html', // Fichier HTML de ce composant
  styleUrls: ['./dashboard.component.scss'],   // Fichier CSS/SCSS de ce composant
  // Stratégie de détection de changement (Optimisation) :
  // Angular ne vérifiera ce composant que si ses @Input changent ou si on le lui demande explicitement (via cdr.detectChanges()).
  // Cela peut améliorer les performances mais demande plus d'attention (utiliser detectChanges après des mises à jour asynchrones).
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy { // Implémente OnInit (pour l'init) et OnDestroy (pour le nettoyage)

  // --- Dépendances Injectées ---
  // On demande à Angular de nous fournir des instances des services dont on a besoin.
  // 'inject()' est la façon moderne de le faire.
  private http = inject(HttpClient); // Pour les appels directs (ici utilisé pour les stats, pourrait être dans un service)
  private authService = inject(AuthService); // Pour obtenir l'ID du club géré
  private notification = inject(NotificationService); // Pour afficher les popups de message
  private router = inject(Router); // Pour changer de page (pas utilisé ici, mais souvent utile)
  private cdr = inject(ChangeDetectorRef); // Outil pour dire à Angular "rafraîchis l'affichage" (nécessaire avec OnPush)
  private membreService = inject(MembreService); // Service pour les opérations sur les membres
  private eventService = inject(EventService); // Service pour les opérations sur les événements

  // --- État du Composant ---
  // Propriétés pour stocker les données affichées sur le tableau de bord

  // Indicateurs Clés (KPIs)
  totalEvents: number | string = '...'; // Initialisé à '...' pour montrer un état de chargement
  upcomingEventsCount: number | string = '...';
  averageEventOccupancy: number | string | null = null; // Peut être null ou 'N/A' si pas de données
  totalActiveMembers: number | string | null = null;
  totalParticipations: number | string | null = null;
  isEditEventModalVisible = false; // Contrôle la visibilité de la modale d'édition
  selectedEventForEditModal: Evenement | undefined = undefined; // Stocke l'événement à modifier (ou undefined si création)

  // Listes pour les tableaux
  lastFiveMembers: Membre[] = []; // Tableau pour stocker les 5 derniers membres
  nextFiveEvents: Evenement[] = []; // Tableau pour stocker les 5 prochains événements

  // État pour la modale Membre
  isRoleModalVisible = false; // Est-ce que la modale de détail/rôle membre est ouverte ?
  selectedMemberForRoleModal: Membre | null = null; // Quel membre est affiché dans la modale ?

  // État pour le chargement global
  isLoading = true; // Affiche un indicateur de chargement au début

  // Pour garder une référence à l'appel API principal et pouvoir l'annuler si besoin
  private dataSubscription: Subscription | null = null;

  // URL de base de l'API (souvent mieux dans les fichiers environment.ts)
  private readonly baseApiUrl = 'http://localhost:8080/api';

  // --- Configuration des Graphiques ---
  // Options de base partagées par les deux graphiques
  private baseChartOptions: ChartOptions = {
    responsive: true, // Le graphique s'adapte à la taille du conteneur
    maintainAspectRatio: false, // Permet de définir hauteur/largeur indépendamment
    plugins: { // Configuration des extensions Chart.js
      legend: { display: false }, // Cache la légende (souvent redondante pour des graphiques simples)
      tooltip: { // Configuration de la bulle d'info au survol
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // Fond sombre semi-transparent
        titleFont: { family: "'Poppins', sans-serif", weight: 'bold', size: 13 },
        bodyFont: { family: "'Poppins', sans-serif", size: 12 },
        padding: 12,
        cornerRadius: 3,
        displayColors: false, // Cache la petite boîte de couleur dans le tooltip
      }
    },
    font: { family: "'Poppins', sans-serif", size: 12 }, // Police par défaut pour le graphique
    // L'animation simple par défaut de Chart.js est utilisée.
  };

  // Options spécifiques pour le graphique LIGNE des inscriptions
  public membersChartOptions: ChartOptions<'line'> = {
    ...this.baseChartOptions, // Copie les options de base
    scales: { // Configuration des axes
      y: { // Axe Y (vertical - Nombre d'inscriptions)
        beginAtZero: true, // Commence à 0
        grid: { color: 'rgba(0, 0, 0, 0.05)' }, // Couleur légère pour la grille
        ticks: { color: '#555', precision: 0 }, // Couleur et format des graduations (entiers)
        border: { display: false } // Cache la ligne de l'axe
      },
      x: { // Axe X (horizontal - Mois)
        grid: { display: false }, // Cache la grille verticale
        ticks: { color: '#555' },
        border: { display: false }
      }
    },
    interaction: { // Comportement au survol
      intersect: false, // Affiche le tooltip même si on n'est pas pile sur un point
      mode: 'index', // Affiche le tooltip pour toutes les données au même point horizontal
    },
  };
  // Données pour le graphique ligne (initialement vide)
  public membersChartData: ChartData<'line'> = { labels: [], datasets: [] };

  // Options spécifiques pour le graphique BARRES des notes
  public ratingsChartOptions: ChartOptions<'bar'> = {
    ...this.baseChartOptions, // Copie les options de base
    scales: {
      y: { // Axe Y (vertical - Note moyenne)
        beginAtZero: true, max: 5, // Échelle de 0 à 5
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#555', stepSize: 1 }, // Graduation tous les 1 point
        border: { display: false }
      },
      x: { // Axe X (horizontal - Catégories de notes)
        grid: { display: false },
        ticks: { color: '#555' },
        border: { display: false }
      }
    }
  };
  // Données pour le graphique barres (initialement vide)
  public ratingsChartData: ChartData<'bar'> = { labels: [], datasets: [] };


  // --- Cycle de Vie Angular ---

  // Fonction exécutée par Angular juste après la création du composant
  ngOnInit(): void {
    console.log("DashboardComponent initialisé.");
    // Récupère l'ID du club que l'utilisateur actuel gère (depuis AuthService)
    const clubId = this.authService.getManagedClubId();
    if (clubId !== null) {
      // Si on a un ID de club, on lance le chargement de toutes les données
      this.loadAllDashboardData(clubId);
    } else {
      // Si pas d'ID de club, on gère l'erreur (ex: afficher message, stopper chargement)
      this.handleMissingClubId();
    }
  }

  // Fonction exécutée par Angular juste avant la destruction du composant (ex: changement de page)
  ngOnDestroy(): void {
    console.log("DashboardComponent détruit.");
    // C'est TRÈS important d'annuler les appels API en cours pour éviter des erreurs ou fuites mémoire
    this.dataSubscription?.unsubscribe();
  }

  // --- Chargement des Données ---

  /** Lance tous les appels API nécessaires pour le dashboard en parallèle */
  private loadAllDashboardData(clubId: number): void {
    this.isLoading = true; // Affiche l'indicateur de chargement
    this.resetData(); // Vide les anciennes données pour montrer l'état de chargement
    console.log(`Chargement des données pour le club ID: ${clubId}`);

    // Préparation des différents appels API (sans les lancer tout de suite)
    // Chaque appel est un "Observable" (un flux de données potentiel)

    // 1. Appel pour les statistiques générales
    const summaryUrl = `${this.baseApiUrl}/stats/clubs/${clubId}/dashboard-summary`;
    const summary$: Observable<DashboardSummaryDTO | null> = this.http.get<DashboardSummaryDTO>(summaryUrl).pipe(
      catchError(err => { // Si CET appel échoue...
        console.error("Erreur API Summary:", err);
        this.notification.show("Erreur chargement résumé dashboard.", "error");
        return of(null); // ...on retourne 'null' pour que les autres appels continuent
      })
    );

    // 2. Appel pour les 5 derniers membres (via MembreService)
    const latestMembers$: Observable<Membre[] | null> = this.membreService.getLatestMembers().pipe(
      catchError(err => { // Si CET appel échoue...
        console.error("Erreur API Derniers Membres:", err);
        this.notification.show("Erreur chargement derniers membres.", "error");
        return of(null); // ...on retourne 'null'
      })
    );

    // 3. Appel pour les 5 prochains événements (via EventService)
    const nextEvents$: Observable<Evenement[] | null> = this.eventService.getNextEvents().pipe(
      catchError(err => { // Si CET appel échoue...
        console.error("Erreur API Prochains Evénements:", err);
        this.notification.show("Erreur chargement prochains événements.", "error");
        return of(null); // ...on retourne 'null'
      })
    );

    // Lance tous les appels préparés ci-dessus en MÊME TEMPS (parallèle)
    // et attend que TOUS aient répondu (ou échoué individuellement avec 'of(null)')
    this.dataSubscription = forkJoin([summary$, latestMembers$, nextEvents$]).subscribe({
      // 'next' est exécuté quand TOUS les appels ont répondu
      next: ([summaryResponse, membersResponse, eventsResponse]) => {
        console.log("Réponses API reçues (summary, membres, events):", summaryResponse, membersResponse, eventsResponse);

        // Traiter la réponse des stats (si elle n'est pas null)
        if (summaryResponse) {
          this.updateSummaryData(summaryResponse); // Met à jour KPIs et données graphiques
        } else {
          // Indiquer une erreur si le résumé n'a pas pu être chargé
          this.totalEvents = "Erreur";
          // ...on pourrait mettre "Erreur" pour les autres KPIs aussi
        }

        // Traiter la réponse des membres (si non null, sinon liste vide)
        this.lastFiveMembers = membersResponse ?? []; // ?? [] veut dire: si membersResponse est null/undefined, utilise []

        // Traiter la réponse des événements (si non null, sinon liste vide)
        this.nextFiveEvents = eventsResponse ?? [];

        // Fin du chargement
        this.isLoading = false;
        // IMPORTANT (à cause de ChangeDetectionStrategy.OnPush):
        // Dit à Angular de vérifier et mettre à jour l'affichage MAINTENANT,
        // car les données ont changé suite à un événement asynchrone (réponse API).
        this.cdr.detectChanges();
        console.log("Données Dashboard mises à jour et affichage rafraîchi.");
      },
      // 'error' ne devrait pas être appelé ici si on utilise `catchError(.. of(null))`
      // mais c'est une sécurité au cas où.
      error: (error: HttpErrorResponse) => {
        console.error("Erreur inattendue dans forkJoin (ne devrait pas arriver):", error);
        this.handleApiError(error, 'global dashboard'); // Gestion d'erreur générique
      }
    });
  }

  /** Remet les propriétés à leur état initial avant le chargement */
  private resetData(): void {
    this.totalEvents = "...";
    this.upcomingEventsCount = "...";
    this.averageEventOccupancy = null;
    this.totalActiveMembers = null;
    this.totalParticipations = null;
    this.membersChartData = { labels: [], datasets: [] };
    this.ratingsChartData = { labels: [], datasets: [] };
    this.lastFiveMembers = [];
    this.nextFiveEvents = [];
    this.cdr.detectChanges(); // Rafraîchir pour montrer l'état '...' ou vide
  }

  // --- Mise à Jour des Données Spécifiques ---

  /** Met à jour les KPIs et lance la mise à jour des graphiques */
  private updateSummaryData(response: DashboardSummaryDTO): void {
    this.totalEvents = response.totalEvents ?? 'N/A'; // Utilise 'N/A' si la donnée est manquante
    this.upcomingEventsCount = response.upcomingEventsCount30d ?? 'N/A';
    this.totalActiveMembers = response.totalActiveMembers ?? 'N/A';
    this.totalParticipations = response.totalParticipations ?? 'N/A';
    this.updateAverageOccupancy(response.averageEventOccupancyRate);
    this.updateMembersChartData(response.monthlyRegistrations);
    this.updateRatingsChartData(response.averageEventRatings);
  }

  /** Met à jour le KPI Taux d'Occupation (formatage si besoin) */
  private updateAverageOccupancy(rate: number | undefined | null): void {
    if (typeof rate === 'number') {
      // Supposons que l'API renvoie un % (ex: 75.5 pour 75.5%)
      // Le pipe 'percent' attend une valeur entre 0 et 1 (ex: 0.755)
      this.averageEventOccupancy = rate / 100;
    } else {
      this.averageEventOccupancy = 'N/A'; // Valeur si donnée invalide/manquante
    }
  }

  /** Prépare les données pour le graphique LIGNE des inscriptions */
  private updateMembersChartData(registrations: MonthlyRegistrationPoint[] | undefined | null): void {
    if (!registrations || registrations.length === 0) {
      console.log("Pas de données d'inscription pour le graphique.");
      this.membersChartData = { labels: [], datasets: [] }; // Assurer que c'est vide
      return;
    }
    // Transformation des données reçues en format attendu par Chart.js
    this.membersChartData = {
      labels: registrations.map(point => point.monthYear), // Les labels sur l'axe X (ex: "Jan 2024")
      datasets: [{ // Un seul jeu de données (la ligne)
        data: registrations.map(point => point.count), // Les valeurs Y (nombre d'inscriptions)
        label: 'Inscriptions', // Nom du jeu de données (pour tooltip)
        // Styles de la ligne et du remplissage
        fill: true,
        backgroundColor: 'rgba(26, 95, 122, 0.1)', // Remplissage sous la ligne
        borderColor: '#1a5f7a', // Couleur de la ligne
        tension: 0.3, // Arrondi de la ligne
        // ... autres styles ...
      }]
    };
    console.log("Données graphique Inscriptions préparées.");
  }

  /** Prépare les données pour le graphique BARRES des notes */
  private updateRatingsChartData(ratings: AverageRatings | undefined | null): void {
    if (!ratings || Object.keys(ratings).length === 0) {
      console.log("Pas de données de notes pour le graphique.");
      this.ratingsChartData = { labels: [], datasets: [] }; // Assurer que c'est vide
      return;
    }
    // Ordre et libellés souhaités pour l'axe X
    const orderedKeys = ['organisation', 'proprete', 'ambiance', 'fairPlay', 'niveauJoueurs', 'moyenneGenerale'];
    const displayLabels: Record<string, string> = { /* ... comme avant ... */ organisation: 'Organisation', proprete: 'Propreté', ambiance: 'Ambiance', fairPlay: 'Fairplay', niveauJoueurs: 'Niveau', moyenneGenerale: 'Moyenne' };

    // Transformation des données reçues
    this.ratingsChartData = {
      labels: orderedKeys.map(key => displayLabels[key] || key), // Les labels sur l'axe X
      datasets: [{ // Un seul jeu de données (les barres)
        data: orderedKeys.map(key => ratings[key] ?? 0), // Les valeurs Y (la note, 0 si manquante)
        label: 'Note Moyenne', // Nom du jeu de données
        // Styles des barres
        backgroundColor: 'rgba(242, 97, 34, 0.6)', // Couleur orange semi-transparente
        borderColor: '#f26122',
        borderRadius: 5,
        // ... autres styles ...
      }]
    };
    console.log("Données graphique Notes préparées.");
  }

  // --- Gestion Modale Membre ---

  /** Fonction appelée quand une ligne membre émet (openModal) */
  handleOpenRoleModal(membre: Membre): void {
    console.log('Ouverture modale demandée pour:', membre);
    if (membre) {
      this.selectedMemberForRoleModal = membre; // Mémorise le membre à afficher
      this.isRoleModalVisible = true; // Rend la modale visible (le *ngIf dans le HTML va réagir)
      this.cdr.detectChanges(); // Important avec OnPush pour que l'affichage change
    } else {
      console.error('handleOpenRoleModal reçu sans données membre !');
    }
  }

  /**
   * Gère la demande de suppression émise par une ligne d'événement.
   * Affiche une confirmation, appelle le service si confirmé, et met à jour l'UI.
   * @param eventToDelete L'objet événement reçu depuis le @Output deleteRequest de EventRowComponent.
   */
  handleDeleteEventRequest(eventToDelete: Evenement): void {
    console.log("Demande de suppression reçue pour:", eventToDelete);

    // 1. Confirmation utilisateur
    const confirmation = confirm(`Êtes-vous sûr de vouloir désactiver l'événement "${eventToDelete.nom}" (ID: ${eventToDelete.id}) ? Cette action est généralement réversible.`);

    if (confirmation) {
      console.log("Confirmation reçue. Appel de l'API de suppression...");
      // 2. Appel au service (si confirmé)
      this.eventService.softDeleteEvent(eventToDelete.id).subscribe({
        // 3. Traitement du succès
        next: () => {
          this.notification.show(`L'événement "${eventToDelete.nom}" a été désactivé.`, 'valid');

          // 4. Mise à jour de la liste locale (création d'un NOUVEAU tableau sans l'élément supprimé)
          this.nextFiveEvents = this.nextFiveEvents.filter(event => event.id !== eventToDelete.id);

          // 5. Rafraîchissement de l'affichage (important avec OnPush)
          this.cdr.detectChanges();
          console.log("Événement retiré de la liste locale et affichage mis à jour.");
        },
        // 6. Traitement de l'erreur
        error: (error) => {
          console.error("Erreur lors de la désactivation de l'événement:", error);
          // Affiche l'erreur formatée venant du service
          this.notification.show(error.message || "Erreur inconnue lors de la désactivation.", 'error');
          // On ne modifie pas la liste locale en cas d'erreur
        }
      });
    } else {
      console.log("Suppression annulée par l'utilisateur.");
      // Optionnel: Afficher une notification "Annulé" ?
      // this.notification.show("Désactivation annulée.", "info");
    }
  }
  /** Fonction appelée quand la modale membre émet (saveRole) */
  handleSaveRole(data: { membreId: number, newRole: RoleType }): void {
    const clubId = this.authService.getManagedClubId();
    if (clubId === null) {
      this.notification.show("Erreur: ID du club non trouvé.", "error");
      return;
    }
    if (!data || !data.newRole) { // Vérification simple
      this.notification.show("Erreur: Données de rôle invalides.", "error");
      return;
    }

    console.log(`Sauvegarde du rôle demandée: Membre ID ${data.membreId}, Club ${clubId}, Rôle ${data.newRole}`);
    // Appel au service pour effectuer la modification via l'API
    this.membreService.changeMemberRole(data.membreId, clubId, data.newRole).subscribe({
      next: (updatedMember) => { // API a répondu avec succès
        this.notification.show("Rôle du membre mis à jour.", "valid");

        // --- Mise à jour de la liste locale (IMPORTANT) ---
        // Cherche l'index du membre modifié dans notre liste 'lastFiveMembers'
        const index = this.lastFiveMembers.findIndex(m => m.id === data.membreId);
        if (index !== -1) {
          // Crée une NOUVELLE liste en remplaçant l'ancien membre par le nouveau (ou en modifiant juste le rôle)
          this.lastFiveMembers = [
            ...this.lastFiveMembers.slice(0, index), // partie avant
            { ...this.lastFiveMembers[index], role: data.newRole }, // membre mis à jour (au moins le rôle)
            // Si l'API renvoyait tout l'objet membre `updatedMember`, on utiliserait ça:
            // updatedMember,
            ...this.lastFiveMembers.slice(index + 1) // partie après
          ];
          console.log("Liste locale des membres mise à jour.");
          this.cdr.detectChanges(); // Rafraîchir l'affichage du tableau
        }
        // --- Fin Mise à jour locale ---

        this.closeMemberDetailModal(); // Ferme la modale
      },
      error: (error) => { // L'appel API a échoué
        console.error("Erreur lors de la mise à jour du rôle:", error);
        // Affiche le message d'erreur venant du service (qui l'a reçu de l'API)
        this.notification.show(error.message || "Erreur inconnue lors de la mise à jour.", "error");
        // On ne ferme PAS la modale ici, l'utilisateur peut réessayer.
      }
    });
  }

  /** Fonction appelée quand la modale membre émet (close) */
  closeMemberDetailModal(): void {
    console.log("Fermeture modale détails membre.");
    this.isRoleModalVisible = false; // Cache la modale
    this.selectedMemberForRoleModal = null; // Oublie le membre sélectionné
    // Pas besoin de detectChanges ici si la fermeture est initiée par un clic (déjà détecté par Angular)
    // Mais ça ne fait pas de mal si on veut être sûr:
    // this.cdr.detectChanges();
  }

  // --- Gestion des Événements (Placeholder) ---

  // --- Gestion des Événements (Modification - Complétée) ---

  /** Ouvre la modale pour modifier un événement existant */
  handleOpenEditModal(eventToEdit: Evenement): void {
    console.log("Ouverture modale d'édition demandée pour:", eventToEdit);
    this.selectedEventForEditModal = eventToEdit; // Mémorise l'événement
    this.isEditEventModalVisible = true; // Affiche la modale
    this.cdr.detectChanges(); // Nécessaire avec OnPush
  }

  /** Ouvre la modale pour créer un nouvel événement */
  openCreateEventModal(): void {
    console.log("Ouverture modale de création d'événement demandée.");
    this.selectedEventForEditModal = undefined; // Assure qu'aucun événement n'est passé (mode création)
    this.isEditEventModalVisible = true; // Affiche la modale
    this.cdr.detectChanges(); // Nécessaire avec OnPush
  }

  // --- Gestion des Erreurs (Simplifiée) ---

  /** Gère une erreur API générique pour l'affichage */
  private handleApiError(error: HttpErrorResponse, context: string): void {
    console.error(`Erreur API (${context}):`, error);
    this.notification.show(`Erreur chargement (${context}). Vérifiez la console.`, "error");
    this.isLoading = false; // Arrêter le chargement
    // Mettre les KPIs en état d'erreur pour l'utilisateur
    this.totalEvents = "Erreur";
    this.upcomingEventsCount = "Erreur";
    // ...etc
    this.cdr.detectChanges(); // Rafraîchir pour montrer l'état d'erreur
  }

  /** Gère le cas où on ne trouve pas l'ID du club géré */
  private handleMissingClubId(): void {
    console.error("Impossible de récupérer l'ID du club géré.");
    this.notification.show("Erreur: Impossible de déterminer le club géré.", "error");
    this.isLoading = false;
    this.totalEvents = 'Erreur Club ID'; // Afficher un message clair
    // ...etc
    this.cdr.detectChanges();
  }
} // Fin de la classe DashboardComponent


// --- Interfaces DTO (Data Transfer Object) ---
// Décrivent la structure des données ATTENDUES des réponses API spécifiques.
// Idéalement, ces interfaces devraient être dans des fichiers séparés (ex: src/app/models/dto.model.ts)

// Structure attendue de l'API /stats/clubs/{clubId}/dashboard-summary
interface DashboardSummaryDTO {
  totalEvents: number;
  upcomingEventsCount30d: number;
  averageEventOccupancyRate: number; // Ex: 75.5 pour 75.5%
  monthlyRegistrations: MonthlyRegistrationPoint[];
  averageEventRatings: AverageRatings;
  totalMembers: number; // Ajouté car présent dans votre code initial
  totalActiveMembers: number;
  totalParticipations: number;
}

// Structure pour un point du graphique d'inscriptions
interface MonthlyRegistrationPoint {
  count: number;    // Nombre d'inscriptions
  monthYear: string; // Label du mois (ex: "Jan 2024")
}

// Structure pour les notes moyennes
interface AverageRatings {
  // La clé est la catégorie de note (ex: 'organisation'), la valeur est la note moyenne
  [category: string]: number | null | undefined;
  // Ex: { organisation: 4.2, ambiance: 4.8, moyenneGenerale: 4.5 }
}
// --------------------------------------------------

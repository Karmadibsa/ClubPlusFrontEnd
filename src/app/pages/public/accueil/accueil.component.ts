// ----- IMPORTATIONS -----
import {
  Component,
  OnInit,
  OnDestroy  // À ajouter si vous gérez des abonnements manuellement
} from '@angular/core';
import { finalize, Subscription } from 'rxjs'; // `finalize` pour exécuter du code après succès ou erreur de l'Observable.
// `Subscription` pour gérer la désinscription.

// Composants de Navigation/Layout
import { FooterComponent } from '../../../component/navigation/footer/footer.component'; // Pied de page.
import { NavbarComponent } from '../../../component/navigation/navbar/navbar.component'; // Barre de navigation.

// Modèles (Interfaces de données)
import { HomepageStats } from '../../../model/HomepageStats'; // Interface décrivant les statistiques de la page d'accueil.

// Services
import { PublicDataService } from '../../../service/crud/public-data.service'; // Service pour récupérer les données publiques.

// Autres (Icônes, Modules Communs)
import { LucideAngularModule } from 'lucide-angular'; // Pour les icônes Lucide.

/**
 * @Component AccueilComponent
 * @description
 * Page d'accueil principale de l'application "Club Plus".
 * Cette page vise à présenter l'application aux nouveaux visiteurs, à afficher des statistiques
 * clés pour démontrer l'activité de la plateforme (nombre de clubs, d'événements, de membres),
 * et à inciter à l'inscription ou à la connexion.
 * Elle récupère les statistiques dynamiquement via `PublicDataService`.
 *
 * @example
 * <app-accueil></app-accueil> <!-- Typiquement le composant racine pour la route '/' ou '/accueil' -->
 */
@Component({
  selector: 'app-accueil',       // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,             // Indique que c'est un composant autonome.
  imports: [                    // Dépendances nécessaires pour le template.
    FooterComponent,            // Affiche le pied de page.
    NavbarComponent,            // Affiche la barre de navigation.
    LucideAngularModule,        // Pour les icônes Lucide.
  ],
  templateUrl: './accueil.component.html', // Chemin vers le fichier HTML du composant.
  styleUrl: './accueil.component.scss'    // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisagez pour optimiser si la page devient plus complexe.
})
export class AccueilComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy.

  // --- INJECTIONS DE SERVICES ---
  /**
   * @private
   * @description Service pour récupérer les données publiques, notamment les statistiques de la page d'accueil.
   * Injecté via le constructeur pour la compatibilité avec les versions antérieures ou par préférence.
   * `inject(PublicDataService)` est aussi une option moderne.
   */
  private publicDataService: PublicDataService; // Sera initialisé dans le constructeur.
  // private cdr = inject(ChangeDetectorRef); // À injecter si ChangeDetectionStrategy.OnPush est utilisé.

  // --- PROPRIÉTÉS DU COMPOSANT (DONNÉES POUR L'AFFICHAGE) ---
  /**
   * @property {HomepageStats | null} stats
   * @description Objet stockant les statistiques à afficher sur la page d'accueil
   * (nombre de clubs, d'événements, de membres).
   * Initialisé à `null` avant le chargement.
   * @default null
   */
  stats: HomepageStats | null = null;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si le chargement des statistiques est en cours.
   * Utilisé pour afficher un indicateur de chargement.
   * @default true
   */
  isLoading: boolean = true;
  /**
   * @property {boolean} errorLoading
   * @description Booléen indiquant si une erreur s'est produite lors du chargement des statistiques.
   * Utilisé pour afficher un message d'erreur ou des données de secours.
   * @default false
   */
  errorLoading: boolean = false;

  /**
   * @private
   * @property {Subscription | null} statsSubscription
   * @description Référence à l'abonnement pour le chargement des statistiques.
   * Permet de se désabonner proprement dans `ngOnDestroy`.
   * @default null
   */
  private statsSubscription: Subscription | null = null;

  /**
   * @constructor
   * @param {PublicDataService} publicDataServiceInstance - Instance injectée de PublicDataService.
   *        (Renommé pour éviter la collision de nom avec la propriété de classe lors de l'injection via constructeur).
   */
  constructor(publicDataServiceInstance: PublicDataService) {
    this.publicDataService = publicDataServiceInstance; // Assignation à la propriété de classe.
  }

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Déclenche le chargement initial des statistiques de la page d'accueil.
   * @see {@link loadStats}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("AccueilComponent: Initialisation.");
    this.loadStats();
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de `statsSubscription` pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("AccueilComponent: Destruction, désinscription de statsSubscription.");
    this.statsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES STATISTIQUES ---
  /**
   * @method loadStats
   * @description Charge les statistiques de la page d'accueil via `PublicDataService.getHomepageStats()`.
   * Gère les états `isLoading` et `errorLoading`.
   * Utilise l'opérateur RxJS `finalize` pour s'assurer que `isLoading` est remis à `false`
   * que l'appel API réussisse ou échoue.
   * En cas d'erreur, des statistiques de secours (fallback) sont affichées.
   * @returns {void}
   */
  loadStats(): void {
    this.isLoading = true;
    this.errorLoading = false;
    // this.cdr.detectChanges(); // Si OnPush et si le template dépend de isLoading/errorLoading.

    this.statsSubscription?.unsubscribe(); // Annule un abonnement précédent s'il existe.

    console.log("AccueilComponent: Début du chargement des statistiques.");
    this.statsSubscription = this.publicDataService.getHomepageStats()
      .pipe(
        finalize(() => { // S'exécute toujours après la complétion ou l'erreur de l'Observable.
          this.isLoading = false;
          // this.cdr.detectChanges(); // Si OnPush.
          console.log("AccueilComponent: Chargement des statistiques terminé (succès ou échec). isLoading:", this.isLoading);
        })
      )
      .subscribe({
        next: (data: HomepageStats) => {
          this.stats = data;
          console.log("AccueilComponent: Statistiques chargées avec succès:", this.stats);
        },
        error: (err: any) => { // Type `any` pour attraper différentes structures d'erreur.
          console.error("AccueilComponent: Erreur lors de la récupération des statistiques:", err);
          this.errorLoading = true;
          // Fournit des données de secours (fallback) en cas d'échec de l'API.
          // Cela évite d'afficher des erreurs brutes ou des sections vides à l'utilisateur.
          this.stats = { clubCount: 250, eventCount: 600, memberCount: 11000 };
          console.warn("AccueilComponent: Utilisation des statistiques de secours en raison d'une erreur API.");
        }
      });
  }

  // --- FONCTION UTILITAIRE POUR LE FORMATAGE ---
  /**
   * @method formatNumber
   * @description Formate un grand nombre pour un affichage plus concis (ex: 11000 -> "11K+").
   * Utilisé dans le template pour afficher les statistiques.
   * Gère les cas où la valeur est `undefined` ou `null`.
   * @param {number | undefined | null} value - La valeur numérique à formater.
   * @param {string} [suffix=''] - Un suffixe optionnel à ajouter après le nombre formaté (ex: '+' pour "11K+").
   * @returns {string} Le nombre formaté sous forme de chaîne, ou "..." si la valeur est indéfinie.
   */
  formatNumber(value: number | undefined | null, suffix: string = ''): string {
    if (value === undefined || value === null) {
      return '...'; // Affiche '...' si les données ne sont pas encore chargées ou en cas d'erreur.
    }
    if (value >= 10000) { // Seuil pour passer en format "K".
      return Math.floor(value / 1000) + 'K+';
    }
    if (value >= 1000) { // Pour les nombres entre 1000 et 9999, on peut afficher le nombre complet ou "1K+", "2K+" etc.
      // Pour un affichage plus précis entre 1000 et 9999:
      // return value.toLocaleString('fr-FR'); // Utilise le formatage localisé
      // Pour un format "XK+" simplifié :
      return Math.floor(value / 1000) + 'K+';
    }
    return value.toString() + suffix; // Affiche le nombre tel quel pour les valeurs < 1000.
  }
}

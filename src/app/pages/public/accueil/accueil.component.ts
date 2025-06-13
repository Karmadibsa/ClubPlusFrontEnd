import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { FooterComponent } from '../../../component/navigation/footer/footer.component';
import { NavbarComponent } from '../../../component/navigation/navbar/navbar.component';

import { HomepageStats } from '../../../model/HomepageStats';

import { PublicDataService } from '../../../service/crud/public-data.service';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component AccueilComponent
 * @description Page d'accueil principale de l'application.
 * Présente l'application, affiche des statistiques clés et incite à l'inscription/connexion.
 * Récupère les statistiques dynamiquement.
 */
@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    FooterComponent,
    NavbarComponent,
    LucideAngularModule,
  ],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private publicDataService: PublicDataService;

  /**
   * @constructor
   * @param publicDataServiceInstance Instance de PublicDataService injectée.
   */
  constructor(publicDataServiceInstance: PublicDataService) {
    this.publicDataService = publicDataServiceInstance;
  }

  // --- ÉTAT DU COMPOSANT ---
  /** Statistiques de la page d'accueil (nombre de clubs, événements, membres). */
  stats: HomepageStats | null = null;
  /** Indique si le chargement des statistiques est en cours. */
  isLoading: boolean = true;
  /** Indique si une erreur s'est produite lors du chargement des statistiques. */
  errorLoading: boolean = false;

  private statsSubscription: Subscription | null = null; // Gère la désinscription.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Lance le chargement initial des statistiques.
   */
  ngOnInit(): void {
    console.log("AccueilComponent: Initialisation.");
    this.loadStats();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction. Désabonne `statsSubscription`.
   */
  ngOnDestroy(): void {
    console.log("AccueilComponent: Destruction, désinscription de statsSubscription.");
    this.statsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES STATISTIQUES ---
  /**
   * @method loadStats
   * @description Charge les statistiques via `PublicDataService`.
   * Gère les états de chargement et d'erreur, avec un fallback si l'API échoue.
   */
  loadStats(): void {
    this.isLoading = true;
    this.errorLoading = false;

    this.statsSubscription?.unsubscribe();

    console.log("AccueilComponent: Début du chargement des statistiques.");
    this.statsSubscription = this.publicDataService.getHomepageStats()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          console.log("AccueilComponent: Chargement des statistiques terminé (succès ou échec). isLoading:", this.isLoading);
        })
      )
      .subscribe({
        next: (data: HomepageStats) => {
          this.stats = data;
          console.log("AccueilComponent: Statistiques chargées avec succès:", this.stats);
        },
        error: (err: any) => {
          console.error("AccueilComponent: Erreur lors de la récupération des statistiques:", err);
          this.errorLoading = true;
          this.stats = { clubCount: 250, eventCount: 600, memberCount: 11000 };
          console.warn("AccueilComponent: Utilisation des statistiques de secours en raison d'une erreur API.");
        }
      });
  }

  // --- FONCTION UTILITAIRE POUR LE FORMATAGE ---
  /**
   * @method formatNumber
   * @description Formate un grand nombre pour un affichage plus concis (ex: 11000 -> "11K+").
   * @param value La valeur numérique à formater.
   * @param suffix Un suffixe optionnel (par défaut '').
   * @returns Le nombre formaté ou "..." si la valeur est indéfinie.
   */
  formatNumber(value: number | undefined | null, suffix: string = ''): string {
    if (value === undefined || value === null) {
      return '...';
    }
    if (value >= 10000) {
      return Math.floor(value / 1000) + 'K+';
    }
    if (value >= 1000) {
      return Math.floor(value / 1000) + 'K+';
    }
    return value.toString() + suffix;
  }
}

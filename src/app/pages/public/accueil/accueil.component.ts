import {Component} from '@angular/core';
import {FooterComponent} from '../../../component/navigation/footer/footer.component';
import {NavbarComponent} from '../../../component/navigation/navbar/navbar.component';
import {HomepageStats} from '../../../model/HomepageStats';
import {PublicDataService} from '../../../service/crud/public-data.service';
import {finalize} from 'rxjs/operators';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-accueil',
  imports: [
    FooterComponent,
    NavbarComponent,
    LucideAngularModule
  ],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent {

  // Propriétés pour stocker les statistiques
  stats: HomepageStats | null = null;
  isLoading: boolean = true;
  errorLoading: boolean = false;

  constructor(private publicDataService: PublicDataService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.errorLoading = false;
    this.publicDataService.getHomepageStats()
      .pipe(
        finalize(() => this.isLoading = false) // Arrête le chargement à la fin (succès ou erreur)
      )
      .subscribe({
        next: (data) => {
          this.stats = data;
        },
        error: (err) => {
          console.error("Erreur lors de la récupération des statistiques", err);
          this.errorLoading = true;
          // Initialiser stats avec des valeurs par défaut ou laisser null
          this.stats = { clubCount: 250, eventCount: 600, memberCount: 11000 }; // Ou valeurs d'erreur/fallback
        }
      });
  }

  // Fonction optionnelle pour formater les grands nombres (ex: 11000 -> 11K)
  formatNumber(value: number | undefined | null, suffix: string = ''): string {
    if (value === undefined || value === null) return '...';
    if (suffix === 'K' && value >= 1000) {
      return Math.floor(value / 1000) + 'K+';
    }
    return value.toString() + suffix;
  }
}

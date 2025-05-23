// ----- IMPORTATIONS -----
import {Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild} from '@angular/core'; // `inject` n'est pas nécessaire si pas utilisé.

// Composants de Navigation/Layout
import { NavbarComponent } from "../../../component/navigation/navbar/navbar.component"; // Barre de navigation principale.
import { FooterComponent } from '../../../component/navigation/footer/footer.component'; // Pied de page de l'application.

// Autres (Icônes, Modules Communs)
import { LucideAngularModule } from 'lucide-angular';
import {SwiperContainer} from 'swiper/element';
import {CommonModule} from '@angular/common'; // Pour les icônes Lucide.

/**
 * @Component AboutComponent
 * @description
 * Page "À Propos" de l'application. Elle présente des informations générales
 * sur l'application, son nom, le développeur, le contexte du projet (formation),
 * l'école, ainsi que les technologies utilisées et les principales fonctionnalités.
 *
 * Cette page est principalement informative et contient du contenu statique.
 * Elle intègre les composants `NavbarComponent` et `FooterComponent` pour une mise en page cohérente.
 *
 * @example
 * <app-about></app-about> <!-- Typiquement utilisé comme composant de route, ex: '/a-propos' -->
 */
@Component({
  selector: 'app-about',         // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,             // Indique que c'est un composant autonome.
  imports: [                    // Dépendances nécessaires pour le template.
    NavbarComponent,            // Affiche la barre de navigation.
    LucideAngularModule,        // Pour les icônes Lucide utilisées dans le template.
    FooterComponent,            // Affiche le pied de page.
    CommonModule
  ],
  templateUrl: './about.component.html', // Chemin vers le fichier HTML du composant.
  styleUrl: './about.component.scss',  // Chemin vers le fichier SCSS/CSS du composant.
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Ajoutez ceci

})
export class AboutComponent { // Pas de `OnInit` ou `OnDestroy` nécessaires pour ce composant simple.

  // --- PROPRIÉTÉS DU COMPOSANT (Données pour l'affichage) ---
  /**
   * @property {string} appName
   * @description Le nom de l'application.
   * @default 'Club Plus'
   */
  appName: string = 'Club Plus';

  /**
   * @property {string} developerName
   * @description Le nom du développeur de l'application.
   * @default 'Axel MOMPER'
   */
  developerName: string = 'Axel MOMPER';

  /**
   * @property {string} projectContext
   * @description Le contexte dans lequel le projet a été réalisé.
   * @default 'Projet réalisé dans le cadre du titre professionnel CDA-JAVA 2024-2025'
   */
  projectContext: string = 'Projet réalisé dans le cadre du titre professionnel CDA-JAVA 2024-2025';

  /**
   * @property {string} schoolName
   * @description Le nom de l'école ou de l'institution de formation.
   * @default 'Metz Numeric School'
   */
  schoolName: string = 'Metz Numeric School';

  /**
   * @property {string[]} technologies
   * @description Un tableau listant les principales technologies et outils utilisés pour développer l'application.
   * Utilisé pour générer une liste dans le template.
   */
  technologies: string[] = [
    'Angular',
    'TypeScript',
    'Spring Boot',
    'Java 17',
    'MySQL',
    'Hibernate/JPA',
    'Spring Security',
    'Maven',
    'Git & GitHub ',
    'HTML5',
    'CSS3/SCSS',
    'Lucide Icons ',
    'SweetAlert2',
    'jsPDF & qrious',
    'Chart.js'
  ];

  /**
   * @property {string[]} features
   * @description Un tableau listant les principales fonctionnalités de l'application.
   * Utilisé pour générer une liste dans le template.
   */
  features: string[] = [
    'Gestion complète des utilisateurs (inscription, connexion, profil, rôles)',
    'Système de réservation d\'événements par catégories de places',
    'Gestion administrative des événements (CRUD complet)',
    'Suivi des participations et validation des présences via scan de QR codes',
    'Système de notation des événements par les participants sur plusieurs critères',
    'Fonctionnalité sociale : gestion d\'une liste d\'amis et demandes d\'ami',
    'Tableau de bord administrateur avec statistiques clés et graphiques (taux d\'occupation, inscriptions, notes moyennes)',
    'Gestion de l\'affiliation des membres aux clubs (rejoindre/quitter un club via code)',
    'Gestion des informations du club par les administrateurs',
    'Thème clair/sombre adaptable',
    'Interface utilisateur responsive pour une utilisation sur mobile et bureau'
  ];

  @ViewChild('swiperContainer') swiperContainerRef?: ElementRef<SwiperContainer>;
  private swiperInstance: SwiperContainer['swiper'] | null = null;

  ngAfterViewInit() {
    if (this.swiperContainerRef?.nativeElement) {
      const swiperEl = this.swiperContainerRef.nativeElement;

      const swiperParams = {
        slidesPerView: 3,
        spaceBetween: 16,
        loop: true,
        autoplay: {
          delay: 2000, // <<< AUGMENTÉ LE DÉLAI
          disableOnInteraction: false, // Important: l'autoplay reprendra après interaction utilisateur
        },
        pagination: {
          clickable: true,
        },
        slidesPerGroup: 1,
      };

      Object.assign(swiperEl, swiperParams);
      swiperEl.initialize();
      this.swiperInstance = swiperEl.swiper;

      if (this.swiperInstance) {
        // Si l'autoplay est configuré dans les paramètres, essayez de le démarrer.
        // Swiper Element devrait normalement le faire automatiquement, mais cela peut aider.
        if (this.swiperInstance.params.autoplay && (this.swiperInstance.params.autoplay as any).delay) {
          this.swiperInstance.autoplay.start(); // <<< ESSAYEZ DE DÉMARRER L'AUTOPLAY
        }

        // Écouteurs pour la pagination (comme avant)
        this.swiperInstance.on('slideChange', () => {
          if (this.swiperInstance?.pagination && this.swiperInstance.pagination.el) {
            this.swiperInstance.pagination.update();
          }
        });

        this.swiperInstance.on('init', () => {
          if (this.swiperInstance?.pagination && this.swiperInstance.pagination.el) {
            this.swiperInstance.pagination.update();
          }
        });

        if (this.swiperInstance.params.loop && this.swiperInstance.pagination && this.swiperInstance.pagination.el) {
          this.swiperInstance.pagination.update();
        }
      }
    }
  }
}

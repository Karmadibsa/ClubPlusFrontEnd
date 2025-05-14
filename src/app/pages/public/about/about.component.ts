// ----- IMPORTATIONS -----
import { Component } from '@angular/core'; // `inject` n'est pas nécessaire si pas utilisé.

// Composants de Navigation/Layout
import { NavbarComponent } from "../../../component/navigation/navbar/navbar.component"; // Barre de navigation principale.
import { FooterComponent } from '../../../component/navigation/footer/footer.component'; // Pied de page de l'application.

// Autres (Icônes, Modules Communs)
import { LucideAngularModule } from 'lucide-angular'; // Pour les icônes Lucide.
// import { CommonModule } from '@angular/common'; // À ajouter si @if, @for, etc. sont utilisés dans le template.

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
    // CommonModule,            // À ajouter si @if, @for, ou des pipes de CommonModule sont utilisés.
  ],
  templateUrl: './about.component.html', // Chemin vers le fichier HTML du composant.
  styleUrl: './about.component.scss'    // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Pourrait être ajouté, bien que moins critique
  // pour une page avec principalement du contenu statique.
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

  // Pas de logique métier complexe dans ce composant, il affiche principalement des données statiques.
  // Le constructeur est implicitement fourni par Angular.
}

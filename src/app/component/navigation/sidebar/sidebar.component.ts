/**
 * Importations nécessaires.
 */
// Component, inject: Éléments de base d'Angular.
import { Component, inject, OnDestroy, OnInit } from '@angular/core'; // Ajout de OnInit, OnDestroy
// LucideAngularModule: Pour les icônes.
import { LucideAngularModule } from 'lucide-angular';
// RouterLink, RouterLinkActive: Directives pour la navigation et le style des liens actifs.
import { RouterLink, RouterLinkActive } from "@angular/router";
// FormsModule: Potentiellement pour des contrôles de formulaire dans la sidebar (bien que non évident ici).
import { FormsModule } from '@angular/forms';
// AuthService: Pour vérifier l'état d'authentification et le rôle.
import { AuthService } from '../../../service/security/auth.service';
// SidebarStateService: Pour gérer l'état (réduit/étendu) de la sidebar.
import { SidebarStateService } from '../../../service/sidebar-state.service';
// Observable, Subscription: Types RxJS pour la programmation réactive et la gestion des abonnements.
import { Observable, Subscription } from 'rxjs';
// AsyncPipe: Pipe Angular pour s'abonner automatiquement à un Observable dans le template et gérer la désinscription.
// CommonModule (qui exporte AsyncPipe) sera importé via `imports`.
import { AsyncPipe, CommonModule } from '@angular/common';
// ThemeService: Pour gérer le changement de thème clair/sombre.
import { ThemeService } from '../../../service/theme.service';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-sidebar',        // Sélecteur CSS pour utiliser ce composant.
  standalone: true,              // Indique que c'est un composant autonome.
  imports: [
    LucideAngularModule,        // Pour les icônes <lucide-icon>.
    RouterLink,                 // Pour la directive `routerLink`.
    RouterLinkActive,           // Pour la directive `routerLinkActive`.
    FormsModule,                // Si des éléments de formulaire sont utilisés.
    AsyncPipe,                  // Pour utiliser le pipe `async` dans le template avec `isCollapsed$`.
    // CommonModule              // Importé pour AsyncPipe et d'autres directives/pipes communs si nécessaire.
    // Note: AsyncPipe est maintenant standalone et peut être importé directement.
    // Cependant, si d'autres éléments de CommonModule sont utilisés (@if, @for), il faudrait CommonModule.
    // Pour la simplicité, et puisque AsyncPipe est souvent avec d'autres, on peut laisser CommonModule.
    CommonModule
  ],
  templateUrl: './sidebar.component.html', // Template HTML de la sidebar.
  styleUrl: './sidebar.component.scss'    // Styles SCSS spécifiques à la sidebar.
})
// Implémente OnInit pour l'initialisation et OnDestroy pour le nettoyage (désinscription).
export class SidebarComponent implements OnInit, OnDestroy {
  // --- INJECTIONS DE SERVICES ---
  private themeService = inject(ThemeService);

  isDarkMode: () => boolean = this.themeService.isDarkMode.bind(this.themeService);


  auth = inject(AuthService);                     // Pour l'état d'authentification et le rôle.
  sidebarStateService = inject(SidebarStateService); // Pour l'état de la sidebar (réduite/étendue).

  // --- PROPRIÉTÉS POUR L'ÉTAT DE LA SIDEBAR ---

  /**
   * @property isCollapsed$
   * @description Un Observable qui émet l'état actuel (réduit/étendu) de la sidebar.
   *              Il est initialisé dans `ngOnInit` en s'abonnant à l'Observable
   *              exposé par `SidebarStateService`.
   *              Le template HTML utilisera le pipe `async` pour s'abonner à cet Observable
   *              et afficher la sidebar en conséquence (ex: `[class.is-collapsed]="isCollapsed$ | async"`).
   *              `undefined` est utilisé pour l'initialisation avant `ngOnInit`.
   */
  isCollapsed$: Observable<boolean> | undefined;

  // --- CYCLE DE VIE ---

  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie appelé une fois après l'initialisation du composant.
   *              Utilisé ici pour obtenir la référence à l'Observable `isCollapsed$`
   *              du `SidebarStateService`.
   */
  ngOnInit(): void {
    // Assigne l'Observable de l'état de la sidebar du service à la propriété locale.
    // Le template pourra alors utiliser `isCollapsed$ | async`.
    this.isCollapsed$ = this.sidebarStateService.isCollapsed$;

    // Si vous aviez besoin de vous abonner manuellement dans le code TypeScript :
    // this.stateSubscription = this.sidebarStateService.isCollapsed$.subscribe(isCollapsed => {
    //   console.log('Sidebar state changed in component:', isCollapsed);
    //   // Vous pourriez avoir une propriété locale `isSidebarCurrentlyCollapsed = isCollapsed;`
    //   // et appeler `this.cdr.markForCheck()` si OnPush.
    // });
    // Mais avec `isCollapsed$` utilisé directement avec `async` pipe, ce n'est pas nécessaire.
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie appelé juste avant que le composant ne soit détruit.
   *              C'est l'endroit crucial pour se désabonner des Observables auxquels on s'est
   *              abonné manuellement pour éviter les fuites de mémoire.
   *              **Correction**: Comme noté ci-dessus, si `isCollapsed$` est uniquement utilisé
   *              avec le pipe `async` dans le template, `stateSubscription` n'est pas créé,
   *              et donc la désinscription ici n'est pas nécessaire pour CET Observable.
   *              Elle reste une bonne pratique si d'autres abonnements manuels sont présents.
   */
  ngOnDestroy(): void {
    // this.stateSubscription?.unsubscribe(); // Se désabonne si un abonnement manuel existait.
    // À retirer si seul AsyncPipe est utilisé pour isCollapsed$.
  }

  // --- MÉTHODES D'ACTION ---

  /**
   * @method toggleTheme
   * @description Bascule le thème de l'application (clair/sombre) en appelant le `ThemeService`.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
    // Le `ThemeService` gère l'application du thème au DOM et la persistance.
    // Le `SidebarComponent` pourrait aussi vouloir refléter le thème actuel (ex: icône différente).
    // Si c'est le cas, `ThemeService` devrait exposer un Observable pour l'état du thème,
    // auquel ce composant pourrait s'abonner (ou utiliser un getter comme `themeService.isDarkMode()`).
  }

  /**
   * @method isDarkModeForTemplate
   * @description Un getter simple pour utiliser dans le template afin de vérifier l'état du thème.
   *              Alternative à la propriété de fonction `isDarkMode`.
   */
  get isDarkModeForTemplate(): boolean {
    return this.themeService.isDarkMode();
  }

  /**
   * @method toggleSidebar
   * @description Bascule l'état (réduit/étendu) de la sidebar en appelant la méthode
   *              correspondante du `SidebarStateService`.
   *              Le service gère la mise à jour de l'état et sa persistance.
   *              Ce composant (et d'autres) réagira au changement via l'abonnement
   *              à `isCollapsed$`.
   */
  toggleSidebar(): void {
    this.sidebarStateService.toggleSidebar();
    // Le commentaire "Plus besoin d'émettre l'événement ou de gérer localStorage ici" est correct.
    // Le service centralise cette logique.
  }

  /**
   * @method logout (Exemple, si la déconnexion est initiée depuis la sidebar)
   */
  logout(): void {
    this.auth.deconnexion();
    // Redirection généralement gérée par un garde ou un abonnement à un état d'authentification.
    // Ou navigation directe : inject(Router).navigateByUrl('/connexion');
  }
}

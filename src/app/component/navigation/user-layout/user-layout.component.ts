/**
 * Importations nécessaires.
 */
// Component, inject, OnInit: Éléments de base d'Angular.
import { Component, inject, OnInit } from '@angular/core';
// SidebarComponent: Le composant de la barre latérale qui sera inclus dans cette mise en page.
import { SidebarComponent } from '../sidebar/sidebar.component';
// RouterOutlet: Directive d'Angular qui marque l'endroit où les composants routés seront affichés.
import { RouterOutlet } from '@angular/router';
// Observable: Type RxJS pour les flux de données asynchrones.
import { Observable } from 'rxjs';
// SidebarStateService: Service pour obtenir l'état (réduit/étendu) de la sidebar.
import { SidebarStateService } from '../../../service/sidebar-state.service';
// AsyncPipe: Pipe Angular pour s'abonner/se désabonner automatiquement aux Observables dans le template.
// CommonModule (qui exporte AsyncPipe) sera importé via `imports`.
import { AsyncPipe, CommonModule } from '@angular/common';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-user-layout',   // Sélecteur CSS pour utiliser ce composant.
  // Ce composant est typiquement utilisé comme composant de route
  // pour un ensemble de routes (ex: toutes les routes sous '/app').
  standalone: true,               // Indique que c'est un composant autonome.
  imports: [
    SidebarComponent,           // Importe le composant Sidebar pour l'utiliser dans le template.
    RouterOutlet,               // Importe RouterOutlet pour le rendu des routes enfants.
    AsyncPipe,                  // Pour utiliser le pipe `async` avec `isSidebarCollapsed$`.
    // CommonModule            // Peut être ajouté si d'autres directives/pipes communs sont nécessaires.
    // AsyncPipe est maintenant standalone.
  ],
  templateUrl: './user-layout.component.html', // Template HTML définissant la structure de la mise en page.
  styleUrl: './user-layout.component.scss'    // Styles SCSS spécifiques à cette mise en page.
})
// Implémente OnInit pour l'initialisation.
export class UserLayoutComponent implements OnInit {
  // Injection de SidebarStateService pour accéder à l'état de la sidebar.
  sidebarStateService = inject(SidebarStateService);

  /**
   * @property isSidebarCollapsed$
   * @description Un Observable qui émet l'état actuel (réduit/étendu) de la sidebar.
   *              Il est initialisé dans `ngOnInit` en s'abonnant à l'Observable
   *              exposé par `SidebarStateService`.
   *              Le template HTML de `UserLayoutComponent` peut utiliser cet Observable
   *              (via le pipe `async`) pour ajuster des classes CSS sur le conteneur de contenu principal,
   *              par exemple pour décaler le contenu lorsque la sidebar est étendue.
   */
  isSidebarCollapsed$: Observable<boolean> | undefined;

  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie appelé une fois après l'initialisation du composant.
   *              Utilisé ici pour obtenir la référence à l'Observable `isCollapsed$`
   *              du `SidebarStateService`.
   */
  ngOnInit(): void {
    // Assigne l'Observable de l'état de la sidebar du service à la propriété locale.
    // Le template de ce composant pourra alors utiliser `isSidebarCollapsed$ | async`.
    this.isSidebarCollapsed$ = this.sidebarStateService.isCollapsed$;
  }
}

/**
 * Importations nécessaires.
 */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../service/security/auth.service';
import { SidebarStateService } from '../../../service/sidebar-state.service';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ThemeService } from '../../../service/theme.service';

/**
 * Gère la logique de la barre de navigation latérale (sidebar).
 *
 * Ce composant utilise des services dédiés pour gérer son état (réduit/étendu)
 * et le thème de l'application, tout en affichant des liens de menu adaptés
 * au rôle de l'utilisateur connecté.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    AsyncPipe
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  /** Observable qui expose l'état (réduit/étendu) de la sidebar pour le template. */
  public isCollapsed$!: Observable<boolean>;

  /** Méthode pour vérifier si le mode sombre est actif, liée au service de thème. */
  public isDarkMode: (() => boolean) | undefined;

  /** Service d'authentification pour vérifier le rôle de l'utilisateur. */
  public readonly auth = inject(AuthService);

  private readonly themeService = inject(ThemeService);
  private readonly sidebarStateService = inject(SidebarStateService);

  /**
   * Initialise le composant en liant les propriétés locales aux services.
   */
  ngOnInit(): void {
    // Lie la propriété locale à l'observable du service pour une utilisation avec le pipe `async`.
    this.isCollapsed$ = this.sidebarStateService.isCollapsed$;
    // Lie la méthode locale à celle du service pour un accès direct depuis le template.
    this.isDarkMode = this.themeService.isDarkMode.bind(this.themeService);
  }

  /**
   * Nettoie les abonnements manuels lors de la destruction du composant.
   * Note : Non requis pour les observables utilisés exclusivement avec le pipe `async`.
   */
  ngOnDestroy(): void {
    // Si des abonnements manuels (`.subscribe()`) étaient faits dans ce composant,
    // ils devraient être nettoyés ici pour éviter les fuites de mémoire.
  }

  /**
   * Bascule le thème de l'application (clair/sombre) via le ThemeService.
   */
  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Bascule l'état (réduit/étendu) de la sidebar via le SidebarStateService.
   */
  public toggleSidebar(): void {
    this.sidebarStateService.toggleSidebar();
  }

  /**
   * Déconnecte l'utilisateur via le AuthService.
   */
  public logout(): void {
    this.auth.deconnexion();
  }
}

import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'ThemeService' qui gère le basculement entre les thèmes clair et sombre de l'application.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2; // Utilisé pour manipuler le DOM.
  private currentTheme: 'light' | 'dark' = 'light'; // Thème actuel appliqué.

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme(); // Initialise le thème au démarrage du service.
  }

  /**
   * @private
   * @method initializeTheme
   * @description Définit le thème initial de l'application en fonction de la priorité :
   * 1. `localStorage` (préférence utilisateur).
   * 2. Préférence du système d'exploitation.
   * 3. Thème par défaut ('light').
   */
  private initializeTheme(): void {
    const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null;
    const prefersDark = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      this.currentTheme = storedTheme;
    } else if (prefersDark) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = 'light';
    }
    this.applyTheme(this.currentTheme);

    // Écoute les changements de préférence de thème de l'OS si aucune préférence n'est stockée.
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('app-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light', false); // Applique sans sauvegarder.
        }
      });
    }
  }

  /**
   * @method isDarkMode
   * @description Vérifie si le thème actuel est le mode sombre.
   * @returns `true` si le thème est 'dark', `false` sinon.
   */
  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * @method setTheme
   * @description Applique un nouveau thème ('light' ou 'dark') à l'application.
   * @param theme Le thème à appliquer.
   * @param savePreference Indique si la préférence doit être sauvegardée dans `localStorage`.
   */
  setTheme(theme: 'light' | 'dark', savePreference: boolean = true): void {
    this.currentTheme = theme;
    this.applyTheme(theme);

    if (savePreference) {
      localStorage.setItem('app-theme', theme);
    } else {
      localStorage.removeItem('app-theme'); // Supprime la préférence si on suit l'OS.
    }
  }

  /**
   * @method toggleTheme
   * @description Bascule entre le thème clair et le thème sombre, et sauvegarde la nouvelle préférence.
   */
  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  /**
   * @private
   * @method applyTheme
   * @description Applique concrètement le thème au DOM en ajoutant/supprimant l'attribut `data-theme` sur l'élément `<html>`.
   * @param theme Le thème ('light' ou 'dark') à appliquer.
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const element = this.document.documentElement; // Cible l'élément <html>.

    if (theme === 'dark') {
      this.renderer.setAttribute(element, 'data-theme', 'dark');
    } else {
      this.renderer.removeAttribute(element, 'data-theme');
    }
  }
}

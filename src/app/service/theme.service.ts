import {Inject, Injectable, Renderer2, RendererFactory2} from '@angular/core';
import {DOCUMENT} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: 'light' | 'dark' = 'light'; // Thème par défaut

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Priorité : 1. Stockage local, 2. Préférence OS, 3. Défaut (light)
    this.currentTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);

    // Optionnel: Écouter les changements de préférence OS
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Appliquer le thème OS uniquement si aucun thème n'est explicitement stocké
      if (!localStorage.getItem('app-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light', false); // Ne pas sauvegarder si on suit l'OS
      }
    });
  }

  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  setTheme(theme: 'light' | 'dark', savePreference: boolean = true): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    if (savePreference) {
      localStorage.setItem('app-theme', theme);
    } else {
      // Si on ne sauvegarde pas (ex: suit l'OS), on retire une éventuelle ancienne préférence
      localStorage.removeItem('app-theme');
    }
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    // Appliquer l'attribut au body ou html
    const element = this.document.documentElement; // Cible <html>
    // Ou: const element = this.document.body;    // Cible <body>

    if (theme === 'dark') {
      this.renderer.setAttribute(element, 'data-theme', 'dark');
    } else {
      // Retirer l'attribut pour revenir au thème par défaut (light)
      this.renderer.removeAttribute(element, 'data-theme');
    }
  }
}

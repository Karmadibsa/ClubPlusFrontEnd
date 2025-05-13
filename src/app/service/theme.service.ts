import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que ThemeService est un service fourni au niveau racine.
 * Une seule instance sera créée et partagée dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /**
   * @private renderer
   * @description Instance de Renderer2, utilisée pour manipuler le DOM (ajouter/supprimer des attributs).
   */
  private renderer: Renderer2;

  /**
   * @private currentTheme
   * @description Stocke l'état actuel du thème appliqué ('light' ou 'dark').
   *              Initialisé par défaut à 'light', mais sera mis à jour par `initializeTheme`.
   */
  private currentTheme: 'light' | 'dark' = 'light'; // Type union pour les thèmes possibles.

  /**
   * Constructeur du service.
   * @param rendererFactory Factory pour créer une instance de Renderer2.
   * @param document Référence à l'objet `document` global, injecté via le token `DOCUMENT`.
   */
  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document // Injection de l'objet document
  ) {
    // 1. Création d'une instance de Renderer2.
    //    `rendererFactory.createRenderer(null, null)` crée un renderer global.
    this.renderer = rendererFactory.createRenderer(null, null);

    // 2. Initialisation du thème au démarrage du service.
    //    Cette méthode va déterminer le thème à appliquer en fonction du stockage local,
    //    des préférences OS, ou du thème par défaut.
    this.initializeTheme();
  }

  /**
   * @private initializeTheme
   * @description Méthode privée appelée par le constructeur pour définir le thème initial de l'application.
   *              Elle suit une logique de priorité pour déterminer le thème :
   *              1. Thème stocké dans `localStorage` (préférence utilisateur explicite).
   *              2. Préférence de thème du système d'exploitation (mode sombre/clair de l'OS).
   *              3. Thème par défaut ('light').
   */
  private initializeTheme(): void {
    // 3. Récupération du thème potentiellement stocké dans localStorage.
    //    `as 'light' | 'dark'` est une assertion de type ; on suppose que si une valeur est stockée,
    //    elle sera l'une de ces deux chaînes. Une validation plus poussée pourrait être ajoutée.
    const storedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null; // Peut être null

    // 4. Détection de la préférence de thème du système d'exploitation.
    //    `window.matchMedia('(prefers-color-scheme: dark)').matches` vérifie si l'OS
    //    est configuré en mode sombre.
    const prefersDark = typeof window !== 'undefined' && // S'assurer que window existe (pour SSR)
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // 5. Logique de priorité pour déterminer le thème initial.
    if (storedTheme) {
      this.currentTheme = storedTheme; // Priorité 1: Thème stocké localement
    } else if (prefersDark) {
      this.currentTheme = 'dark';     // Priorité 2: Préférence OS (sombre)
    } else {
      this.currentTheme = 'light';    // Priorité 3: Défaut (clair) ou Préférence OS (clair)
    }
    // Le thème par défaut 'light' est déjà assigné, donc la dernière condition est implicite.
    // Ligne équivalente plus explicite :
    // this.currentTheme = storedTheme || (prefersDark ? 'dark' : 'light');

    // 6. Application du thème déterminé.
    this.applyTheme(this.currentTheme);

    // 7. (Optionnel mais bonne pratique) Écouter les changements de préférence de thème de l'OS.
    //    Si l'utilisateur change le mode sombre/clair de son OS pendant que l'application est ouverte,
    //    et qu'il n'a pas explicitement choisi un thème dans l'application (pas de `storedTheme`),
    //    l'application peut s'adapter.
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // On change le thème de l'application pour correspondre à l'OS
        // SEULEMENT si l'utilisateur n'a pas déjà sauvegardé une préférence de thème
        // dans l'application (via localStorage).
        if (!localStorage.getItem('app-theme')) {
          // `e.matches` est `true` si l'OS est maintenant en mode sombre.
          // `false` en argument de `setTheme` pour ne pas sauvegarder cette préférence induite par l'OS.
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  /**
   * @method isDarkMode
   * @description Vérifie si le thème actuellement appliqué est le mode sombre.
   * @returns {boolean} `true` si le thème est 'dark', `false` sinon.
   */
  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * @method setTheme
   * @description Applique un nouveau thème ('light' ou 'dark') à l'application.
   * @param theme Le thème à appliquer.
   * @param savePreference Booléen indiquant si cette préférence de thème doit être
   *                       sauvegardée dans `localStorage` pour les sessions futures.
   *                       Par défaut à `true`. Mis à `false` si on applique un thème
   *                       basé sur la préférence OS sans interaction utilisateur directe.
   */
  setTheme(theme: 'light' | 'dark', savePreference: boolean = true): void {
    this.currentTheme = theme; // Met à jour l'état interne du thème.
    this.applyTheme(theme);    // Applique le thème au DOM.

    if (savePreference) {
      // 8. Si `savePreference` est vrai, stocke le choix de thème dans localStorage.
      localStorage.setItem('app-theme', theme);
    } else {
      // 9. Si `savePreference` est faux (ex: on suit dynamiquement la préférence de l'OS
      //    sans que l'utilisateur ait cliqué sur un bouton de thème), on s'assure
      //    de supprimer toute préférence explicitement stockée précédemment.
      //    Cela permet à l'écouteur de changement d'OS de continuer à fonctionner.
      localStorage.removeItem('app-theme');
    }
  }

  /**
   * @method toggleTheme
   * @description Bascule entre le thème clair et le thème sombre.
   *              Sauvegarde automatiquement la nouvelle préférence.
   */
  toggleTheme(): void {
    // Détermine le nouveau thème en inversant le thème actuel, puis l'applique et le sauvegarde.
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    // `savePreference` est `true` par défaut dans `setTheme`, donc la préférence est sauvegardée.
  }

  /**
   * @private applyTheme
   * @description Méthode privée qui applique concrètement le thème au DOM en modifiant
   *              un attribut sur l'élément `<html>` (ou `<body>`).
   *              Les styles CSS doivent être configurés pour réagir à cet attribut
   *              (ex: `html[data-theme="dark"] body { background-color: #333; color: #fff; }`).
   *
   * @param theme Le thème ('light' ou 'dark') à appliquer.
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    // Cible l'élément racine `<html>` pour appliquer l'attribut de thème.
    // Cibler `<html>` est souvent préféré à `<body>` car cela permet
    // de styler des éléments comme la barre de défilement ou la couleur de fond
    // de la page entière plus facilement.
    const element = this.document.documentElement; // Cible l'élément <html>
    // Alternative : const element = this.document.body; // Cible l'élément <body>

    if (theme === 'dark') {
      // 10. Si le thème est 'dark', ajoute (ou met à jour) l'attribut `data-theme="dark"`.
      //     Le `Renderer2` est utilisé pour manipuler le DOM de manière sûre.
      this.renderer.setAttribute(element, 'data-theme', 'dark');
    } else {
      // 11. Si le thème est 'light' (ou tout autre thème considéré comme "par défaut"),
      //     retire l'attribut `data-theme`.
      //     Vos styles CSS par défaut (sans `data-theme`) définiront alors le thème clair.
      this.renderer.removeAttribute(element, 'data-theme');
    }
    // Vous pourriez aussi utiliser `this.renderer.addClass(element, 'theme-dark')` et
    // `this.renderer.removeClass(element, 'theme-dark')` si vous préférez utiliser des classes CSS.
  }
}

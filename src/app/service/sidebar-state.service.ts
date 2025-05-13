import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * @Injectable({ providedIn: 'root' })
 * Déclare que SidebarStateService est un service fourni au niveau racine de l'application.
 * Cela signifie qu'une seule instance de ce service sera créée et partagée
 * à travers toute l'application, ce qui est idéal pour gérer un état global comme celui d'une sidebar.
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {

  // 1. Utilisation de BehaviorSubject pour la gestion de l'état.
  //    - `private isCollapsedSubject`: C'est le sujet RxJS qui va stocker et émettre
  //      l'état actuel de la sidebar (réduite ou non). Il est privé pour que
  //      seul le service puisse émettre de nouvelles valeurs via `.next()`.
  //    - `new BehaviorSubject<boolean>(this.getInitialState())`:
  //      - `<boolean>`: Spécifie que le sujet émettra des valeurs booléennes (`true` si réduite, `false` sinon).
  //      - `this.getInitialState()`: Le BehaviorSubject est initialisé avec une valeur de départ.
  //        Cette valeur est récupérée de `localStorage` (si disponible) pour permettre
  //        la persistance de l'état de la sidebar entre les sessions utilisateur.
  private isCollapsedSubject = new BehaviorSubject<boolean>(this.getInitialState());

  // 2. Exposition de l'état sous forme d'Observable public.
  //    - `public isCollapsed$: Observable<boolean>`: C'est la version publique et "lecture seule"
  //      de l'état. Les composants s'abonneront à cet `Observable` pour réagir
  //      aux changements d'état de la sidebar.
  //    - `this.isCollapsedSubject.asObservable()`: Convertit le `BehaviorSubject` en un `Observable` standard.
  //      Cela empêche les composants externes d'appeler `.next()` directement sur le sujet,
  //      respectant l'encapsulation (seul le service doit modifier l'état).
  //    - La convention de nommage `$` à la fin (`isCollapsed$`) indique quil s'agit d'un Observable.
  public isCollapsed$: Observable<boolean> = this.isCollapsedSubject.asObservable();

  /**
   * Constructeur du service.
   * Dans ce cas, il est vide car l'initialisation du BehaviorSubject (qui appelle `getInitialState`)
   * se fait directement lors de la déclaration de la propriété.
   */
  constructor() {
    // Aucune logique spécifique nécessaire dans le constructeur ici,
    // l'initialisation du BehaviorSubject gère l'appel à getInitialState.
  }

  /**
   * @private getInitialState
   * @description Méthode privée pour récupérer l'état initial de la sidebar (réduite ou non)
   *              depuis le `localStorage` du navigateur.
   *              Cela permet de conserver la préférence de l'utilisateur entre les sessions.
   *
   * @returns {boolean} `true` si la sidebar doit être initialement réduite, `false` sinon.
   */
  private getInitialState(): boolean {
    // 3. Vérification de la disponibilité de `localStorage`.
    //    `typeof localStorage !== 'undefined'` est une vérification importante, surtout si
    //    l'application utilise le rendu côté serveur (SSR avec Angular Universal),
    //    où `localStorage` (objet du navigateur) n'est pas disponible.
    if (typeof localStorage !== 'undefined') {
      const storedState = localStorage.getItem('sidebarCollapsed'); // Récupère la valeur stockée.
      // `localStorage` stocke tout sous forme de chaînes. Il faut donc convertir
      // la chaîne "true" en booléen `true`.
      return storedState === 'true';
    }
    // 4. Valeur par défaut si `localStorage` n'est pas disponible ou si rien n'y est stocké.
    //    Par défaut, la sidebar n'est pas réduite.
    return false;
  }

  /**
   * @method toggleSidebar
   * @description Bascule l'état actuel de la sidebar (de réduite à non réduite, et vice-versa).
   *              Met à jour le `BehaviorSubject` et persiste le nouvel état dans `localStorage`.
   */
  toggleSidebar(): void {
    // 5. Calcul du nouvel état.
    //    `this.isCollapsedSubject.value` donne la valeur actuelle émise par le BehaviorSubject.
    const newState = !this.isCollapsedSubject.value;

    // 6. Émission du nouvel état.
    //    `this.isCollapsedSubject.next(newState)` informe tous les abonnés
    //    (les composants écoutant `isCollapsed$`) du changement d'état.
    this.isCollapsedSubject.next(newState);

    // 7. Persistance du nouvel état dans `localStorage`.
    //    On vérifie à nouveau si `localStorage` est disponible.
    if (typeof localStorage !== 'undefined') {
      // Le booléen `newState` est converti en chaîne ("true" ou "false") pour le stockage.
      localStorage.setItem('sidebarCollapsed', newState.toString());
    }
  }
}

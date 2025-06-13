import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'SidebarStateService' qui gère l'état global (réduit/non réduit) de la barre latérale.
 * Fournit une instance unique (singleton) dans toute l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {

  // Sujet qui stocke et émet l'état de la sidebar (réduite ou non).
  // Initialisé avec l'état persistant du localStorage.
  private isCollapsedSubject = new BehaviorSubject<boolean>(this.getInitialState());

  // Version publique et lecture seule de l'état de la sidebar.
  public isCollapsed$: Observable<boolean> = this.isCollapsedSubject.asObservable();

  /**
   * @method getInitialState
   * @description Récupère l'état initial de la sidebar depuis le `localStorage` pour persister la préférence.
   * @returns `true` si la sidebar doit être réduite, `false` sinon.
   */
  private getInitialState(): boolean {
    if (typeof localStorage !== 'undefined') {
      const storedState = localStorage.getItem('sidebarCollapsed');
      return storedState === 'true';
    }
    return false; // État par défaut si localStorage n'est pas disponible ou vide.
  }

  /**
   * @method toggleSidebar
   * @description Bascule l'état actuel de la sidebar (réduite/non réduite)
   * et persiste le nouvel état dans `localStorage`.
   */
  toggleSidebar(): void {
    const newState = !this.isCollapsedSubject.value; // Calcule le nouvel état.
    this.isCollapsedSubject.next(newState);          // Informe les abonnés du changement.

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', newState.toString()); // Persiste l'état.
    }
  }
}

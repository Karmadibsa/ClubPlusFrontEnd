import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {

  // Utilisation de BehaviorSubject pour conserver la dernière valeur et la fournir aux nouveaux souscripteurs
  private isCollapsedSubject = new BehaviorSubject<boolean>(this.getInitialState());
  // Exposition de l'état sous forme d'Observable pour que les composants s'y abonnent
  public isCollapsed$: Observable<boolean> = this.isCollapsedSubject.asObservable();

  constructor() {
  }

  // Méthode pour récupérer l'état initial depuis localStorage
  private getInitialState(): boolean {
    if (typeof localStorage !== 'undefined') { // Vérifier si localStorage est disponible
      const storedState = localStorage.getItem('sidebarCollapsed');
      return storedState === 'true';
    }
    return false; // Valeur par défaut si localStorage n'est pas dispo (SSR par ex.)
  }

  // Méthode pour basculer l'état
  toggleSidebar(): void {
    const newState = !this.isCollapsedSubject.value;
    this.isCollapsedSubject.next(newState);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', newState.toString());
    }
  }

  // Méthode pour obtenir la valeur actuelle (si nécessaire, mais préférez l'Observable)
  getCurrentState(): boolean {
    return this.isCollapsedSubject.value;
  }
}

import {Component, inject} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {RouterLink, RouterLinkActive} from "@angular/router";
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../service/security/auth.service';
import {SidebarStateService} from '../../../service/sidebar-state.service';
import {Observable, Subscription} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [
    LucideAngularModule,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    AsyncPipe
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  auth = inject(AuthService);
  sidebarStateService = inject(SidebarStateService); // Injection du service

  isCollapsed$: Observable<boolean> | undefined; // Observable pour l'état
  private stateSubscription?: Subscription; // Pour se désabonner proprement

  ngOnInit(): void {
    this.isCollapsed$ = this.sidebarStateService.isCollapsed$;
  }

  ngOnDestroy(): void {
    // Très important pour éviter les fuites mémoire !
    this.stateSubscription?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleSidebar(); // Appelle la méthode du service
    // Plus besoin d'émettre l'événement ou de gérer localStorage ici
  }
}


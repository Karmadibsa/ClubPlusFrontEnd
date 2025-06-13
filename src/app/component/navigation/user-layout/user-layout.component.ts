/**
 * Importations nécessaires.
 */
import { Component, inject, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { SidebarStateService } from '../../../service/sidebar-state.service';
import { AsyncPipe, CommonModule } from '@angular/common';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    SidebarComponent,
    RouterOutlet,
    AsyncPipe,
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
// Implémente OnInit pour l'initialisation.
export class UserLayoutComponent implements OnInit {

  sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed$: Observable<boolean> | undefined;

  ngOnInit(): void {

    this.isSidebarCollapsed$ = this.sidebarStateService.isCollapsed$;
  }
}

import {Component, inject, OnInit} from '@angular/core';
import {SidebarComponent} from '../sidebar/sidebar.component';
import {RouterOutlet} from '@angular/router';
import {Observable} from 'rxjs';
import {SidebarStateService} from '../../../service/sidebar-state.service';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-user-layout',
  imports: [
    SidebarComponent,
    RouterOutlet,
    AsyncPipe
  ],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit {
  sidebarStateService = inject(SidebarStateService);
  isSidebarCollapsed$: Observable<boolean> | undefined;

  ngOnInit(): void {
    this.isSidebarCollapsed$ = this.sidebarStateService.isCollapsed$;
  }
}

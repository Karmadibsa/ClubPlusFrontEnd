import {Component, inject} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../service/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    LucideAngularModule,
    RouterLink,
    RouterLinkActive,
    FormsModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  auth = inject(AuthService)
  private router = inject(Router); // Injecter si redirection utilisée


  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}

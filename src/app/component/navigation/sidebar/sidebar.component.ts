import {Component, inject} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {FormsModule} from '@angular/forms';

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
  private router = inject(Router); // Injecter si redirection utilisée

  logout() {
    console.log("deconnexion")
    this.router.navigate(['/accueil']); // Ou '/login' selon votre route
  }

  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}

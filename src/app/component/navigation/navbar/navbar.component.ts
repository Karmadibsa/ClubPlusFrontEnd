import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../service/security/auth.service';
import {FormBuilder} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {NotificationService} from '../../../service/notification.service';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    LucideAngularModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  // --- Injections ---
  auth = inject(AuthService)
  private router = inject(Router);
  notification = inject(NotificationService)

  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  MoveToEspace(): void {
    const userRole = this.auth.role;
    if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
      this.isMenuOpen = false; // Ferme le menu si ouvert lors du clic
      this.router.navigateByUrl("/app/dashboard");
      this.notification.show(`Connexion réussie (${userRole}). Accès au tableau de bord.`, "valid");
    } else if (userRole === 'ROLE_MEMBRE') {
      this.isMenuOpen = false; // Ferme le menu si ouvert lors du clic
      this.router.navigateByUrl("/app/event"); // Assurez-vous que cette route existe
      this.notification.show("Connexion réussie (MEMBRE). Accès aux événements.", "valid");
    } else {
      console.warn("Rôle utilisateur non géré pour la redirection:", userRole);
      this.notification.show(`Connexion réussie (${userRole}), redirection par défaut.`, "info");
      this.router.navigateByUrl("/");
    }
  }
}

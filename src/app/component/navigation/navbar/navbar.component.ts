import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../service/security/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { CommonModule } from '@angular/common';

/**
 * Gère la logique de la barre de navigation principale de l'application.
 *
 * Ce composant est responsable de l'affichage des liens de navigation,
 * de l'adaptation de l'affichage pour les mobiles (menu "burger"), et de la
 * gestion des actions conditionnelles (connexion, déconnexion, accès à l'espace utilisateur).
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, // Nécessaire pour @if
    RouterLink,
    LucideAngularModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {

  /** Service pour l'authentification, utilisé pour vérifier l'état et le rôle de l'utilisateur. */
  public readonly auth = inject(AuthService);
  /** Vrai si le menu mobile est actuellement ouvert. */
  public isMenuOpen = false;

  private readonly router = inject(Router);
  private readonly notification = inject(SweetAlertService);

  /**
   * Bascule l'état (ouvert/fermé) du menu de navigation mobile.
   */
  public toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Redirige l'utilisateur vers son espace personnel en fonction de son rôle.
   */
  public MoveToEspace(): void {
    const userRole = this.auth.role;

    // Ferme le menu mobile avant toute navigation.
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }

    if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
      this.router.navigateByUrl("/app/dashboard");
      this.notification.show(`Bienvenue. Vous êtes redirigé vers votre tableau de bord.`, "success");
    } else if (userRole === 'ROLE_MEMBRE') {
      this.router.navigateByUrl("/app/event");
      this.notification.show("Bienvenue ! Accès à la liste des événements.", "success");
    } else {
      // Cas par défaut ou si le rôle est inattendu.
      this.router.navigateByUrl("/");
    }
  }

  /**
   * Déconnecte l'utilisateur et le redirige vers la page de connexion.
   */
  public logout(): void {
    this.auth.deconnexion(); // Méthode à implémenter dans AuthService
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
    this.router.navigateByUrl('/connexion');
    this.notification.show('Vous avez été déconnecté.', 'info');
  }
}

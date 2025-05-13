/**
 * Importations nécessaires.
 */
// Component, inject: Éléments de base d'Angular.
import { Component, inject } from '@angular/core';
// Router: Pour la navigation programmatique.
// RouterLink: Directive pour la navigation déclarative dans le template.
import { Router, RouterLink } from '@angular/router';
// AuthService: Pour vérifier l'état d'authentification et le rôle de l'utilisateur.
import { AuthService } from '../../../service/security/auth.service'; // Assurez-vous du chemin.
// LucideAngularModule: Pour les icônes.
import { LucideAngularModule } from 'lucide-angular';
// SweetAlertService: Pour afficher des notifications.
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-navbar',         // Sélecteur CSS pour utiliser ce composant (ex: <app-navbar></app-navbar>).
  standalone: true,              // Supposons qu'il soit autonome.
  imports: [
    RouterLink,                   // Nécessaire pour utiliser `routerLink` dans le template.
    LucideAngularModule,          // Pour les icônes <lucide-icon>.
    // CommonModule pourrait être nécessaire si vous utilisez *ngIf/@if, etc., dans le template.
  ],
  templateUrl: './navbar.component.html', // Template HTML de la barre de navigation.
  styleUrl: './navbar.component.scss'    // Styles SCSS spécifiques à la barre de navigation.
})
export class NavbarComponent {
  // --- INJECTIONS DE SERVICES ---
  // Utilisation de `inject()` pour une injection concise.
  auth = inject(AuthService);                 // Service d'authentification pour accéder à `auth.connecte` et `auth.role`.
  private router = inject(Router);            // Service de routage pour la navigation programmatique.
  notification = inject(SweetAlertService);   // Service pour afficher des notifications.

  // --- PROPRIÉTÉS INTERNES ---

  /**
   * @property isMenuOpen
   * @description Booléen pour contrôler l'état (ouvert/fermé) d'un menu de navigation mobile (burger menu).
   *              Sera utilisé dans le template pour afficher/masquer le menu et potentiellement
   *              pour appliquer des styles (ex: changer l'icône du burger).
   */
  isMenuOpen = false;

  // --- MÉTHODES ---

  /**
   * @method toggleMenu
   * @description Bascule l'état de `isMenuOpen` (de `true` à `false` et vice-versa).
   *              Généralement appelée par un clic sur un bouton "burger" dans le template.
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    // this.cdr.detectChanges(); // Pourrait être nécessaire si OnPush et que le template
    // doit réagir immédiatement au changement de isMenuOpen pour des classes CSS.
  }

  /**
   * @method MoveToEspace
   * @description Redirige l'utilisateur vers une page appropriée en fonction de son rôle.
   *              Cette méthode semble être conçue pour être appelée après une connexion réussie
   *              ou peut-être par un lien "Mon Espace" qui s'adapte au rôle.
   *              Cependant, la logique de redirection *après connexion* est plus typiquement
   *              gérée dans le composant de connexion lui-même ou via un garde de routage
   *              qui redirige en fonction du rôle une fois l'utilisateur authentifié.
   *              L'appel à `this.notification.show(...)` ici suggère qu'elle est pensée pour
   *              être appelée juste après la connexion.
   */
  MoveToEspace(): void {
    const userRole = this.auth.role; // Récupère le rôle de l'utilisateur connecté depuis AuthService.

    // Ferme le menu mobile si ouvert, avant de naviguer.
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }

    if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
      // Si l'utilisateur est un Admin ou un Gestionnaire de Réservation.
      this.router.navigateByUrl("/app/dashboard"); // Redirige vers le tableau de bord.
      // Affiche une notification de succès.
      this.notification.show(`Bienvenue ${userRole}. Vous êtes redirigé vers votre tableau de bord.`, "success");
    } else if (userRole === 'ROLE_MEMBRE') {
      // Si l'utilisateur est un Membre standard.
      this.router.navigateByUrl("/app/event"); // Redirige vers la page des événements.
      // Assurez-vous que "/app/event" est une route valide.
      this.notification.show("Bienvenue ! Accès à la liste des événements.", "success");
    } else {
      // Cas où le rôle n'est pas géré ou l'utilisateur n'est pas connecté (userRole serait null).
      // Si userRole est null, cela signifie que l'utilisateur n'est pas connecté,
      // donc la redirection vers la page d'accueil est logique.
      // Si userRole a une valeur inattendue, c'est aussi une redirection par défaut sûre.
      console.warn("NavbarComponent - MoveToEspace: Rôle utilisateur non géré pour la redirection spécifique:", userRole);
      this.notification.show(`Bienvenue ! Redirection vers l'accueil. (Rôle: ${userRole || 'Non défini'})`, "info");
      this.router.navigateByUrl("/"); // Redirige vers la page d'accueil.
    }
  }

  /**
   * @method logout (Exemple de méthode de déconnexion, typiquement présente dans une navbar)
   * @description Déconnecte l'utilisateur et le redirige.
   */
  logout(): void {
    this.auth.deconnexion(); // Appelle la méthode de déconnexion de AuthService.
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
    this.router.navigateByUrl('/connexion'); // Redirige vers la page de connexion.
    this.notification.show('Vous avez été déconnecté.', 'info');
  }
}

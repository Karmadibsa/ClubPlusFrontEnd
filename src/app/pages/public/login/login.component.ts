import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {catchError} from 'rxjs/operators'; // Pour la gestion d'erreurs RxJS
import {throwError} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NotificationService} from '../../../service/notification.service';
import {AuthService} from '../../../service/security/auth.service'; // Pour relancer les erreurs RxJS

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    LucideAngularModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  // --- Injections ---
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient); // Injection de HttpClient
  auth = inject(AuthService)
notification = inject(NotificationService)
  // --- Propriétés ---
  passwordFieldType: string = 'password';

    loginForm = this.fb.group({
      email: ['alice.admin@club.fr', [Validators.required, Validators.email]],
      password: ['password', Validators.required]
    });

  // --- Identifiants de test (basés sur votre SQL [1]) ---
  // IMPORTANT: Assurez-vous que ces utilisateurs existent et sont actifs dans votre BDD
  // Le mot de passe 'password' correspond au hash $2y$10$A7.AsjGP0ptMeaRHIivES.8YyMXBSuCYy0T6F6.7Id1Ih5p/3hihG
  private readonly ADMIN_EMAIL = 'alice.admin@club.fr';
  private readonly MEMBER_EMAIL = 'bob.membre@email.com'; // Ou david.autre@email.com, eva.multi@email.com
  private readonly RESA_EMAIL = 'charlie.resa@club.fr';
  private readonly COMMON_PASSWORD = 'password'; // Le mot de passe en clair avant hashage

  // --- Méthode de soumission ---
  onConnexion(): void {
if(this.loginForm.valid){
  this.http.post(
    "http://localhost:8080/api/auth/connexion",
    this.loginForm.value,
    {responseType: "text"})
    .subscribe({
      next : jwt => {
        this.auth.decodeJwt(jwt)
        const userRole = this.auth.role;
        if (!userRole) {
          console.error("Impossible de déterminer le rôle utilisateur après connexion (this.auth.role est null).");
          this.notification.show("Erreur de rôle après connexion.", "error");
          this.router.navigateByUrl('/');
          return;
        }
        if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
          this.router.navigateByUrl("/dashboard");
          this.notification.show(`Connexion réussie (${userRole}). Accès au tableau de bord.`, "valid");
        } else if (userRole === 'ROLE_MEMBRE') {
          this.router.navigateByUrl("/event"); // Assurez-vous que cette route existe
          this.notification.show("Connexion réussie (MEMBRE). Accès aux événements.", "valid");
        } else {
          console.warn("Rôle utilisateur non géré pour la redirection:", userRole);
          this.notification.show(`Connexion réussie (${userRole}), redirection par défaut.`, "info");
          this.router.navigateByUrl("/");
        }
      },
      error : erreur => {
        if(erreur.status === 401){
          this.notification.show("L'e-mail et/ou le mot de passe n'est pas correct", "error")
        }
      }
    })
}
  }
// --- Méthode générique de simulation ---
  private simulateLoginWithCredentials(email: string, password: string, roleName: string): void {
    console.warn(`Simulation de connexion en tant que ${roleName} via formulaire...`);

    // 1. Pré-remplir le formulaire
    this.loginForm.patchValue({
      email: email,
      password: password
    });

    // 2. Marquer les contrôles comme 'touched' pour la validation (optionnel mais bonne pratique)
    this.loginForm.markAllAsTouched();

    // 3. Appeler directement la méthode de soumission
    // Comme nous avons rempli le formulaire avec des données valides (on suppose),
    // la vérification this.loginForm.valid dans onConnexion devrait passer.
    this.onConnexion();
  }

  // --- Méthodes appelées par les boutons de simulation ---
  simulateLoginAsMember(): void {
    this.simulateLoginWithCredentials(this.MEMBER_EMAIL, this.COMMON_PASSWORD, 'MEMBRE');
  }

  simulateLoginAsAdmin(): void {
    this.simulateLoginWithCredentials(this.ADMIN_EMAIL, this.COMMON_PASSWORD, 'ADMIN');
  }

  simulateLoginAsResa(): void {
    this.simulateLoginWithCredentials(this.RESA_EMAIL, this.COMMON_PASSWORD, 'RESERVATION');
  }
  // --- Méthode pour basculer l'affichage du mot de passe ---
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
}

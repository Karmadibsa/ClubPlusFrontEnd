import {
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../service/security/auth.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

/**
 * @Component LoginComponent
 * @description Page de connexion permettant aux utilisateurs de s'authentifier.
 * Gère le formulaire de connexion et la redirection post-authentification.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    ReactiveFormsModule,
    CommonModule, // Ajout de CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  protected isLoading = false;
  private loginSubscription: Subscription | null = null;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(SweetAlertService);

  passwordFieldType: string = 'password';

  loginForm!: FormGroup;

  // Identifiants de test pour les simulations.
  private readonly ADMIN_EMAIL = 'alice.admin@club.fr';
  private readonly MEMBER_EMAIL = 'bob.membre@email.com';
  private readonly RESA_EMAIL = 'charlie.resa@club.fr';
  private readonly COMMON_PASSWORD = 'password';

  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation du composant. Initialise le formulaire de connexion.
   */
  ngOnInit(): void {
    this.initForm();
  }

  /**
   * @private
   * @method initForm
   * @description Initialise la structure du formulaire de connexion avec les validateurs.
   */
  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    console.log("LoginComponent: Formulaire de connexion initialisé.");

    // Optionnel: Pré-remplir pour le développement.
    // this.loginForm.patchValue({
    //   email: this.ADMIN_EMAIL,
    //   password: this.COMMON_PASSWORD
    // });
  }

  /**
   * @method onConnexion
   * @description Gère la soumission du formulaire. Valide et tente la connexion.
   */
  onConnexion(): void {
    if (this.loginForm.invalid) {
      this.notification.show("Veuillez remplir correctement l'e-mail et le mot de passe.", "warning");
      this.loginForm.markAllAsTouched();
      console.warn("LoginComponent: Tentative de connexion avec un formulaire invalide.");
      return;
    }

    this.isLoading = true;
    const credentials = this.loginForm.getRawValue() as { email: string; password: any };

    this.loginSubscription?.unsubscribe();

    console.log("LoginComponent: Tentative de connexion avec les identifiants:", {email: credentials.email, password: '***'});
    this.loginSubscription = this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        const userRole = this.authService.getRole();

        if (!userRole) {
          console.error("LoginComponent: Rôle utilisateur indéterminé après connexion. Redirection vers l'accueil.");
          this.notification.show("Erreur de rôle après connexion. Veuillez contacter le support.", "error");
          this.router.navigateByUrl('/');
          return;
        }

        if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
          this.router.navigateByUrl("/app/dashboard");
        } else if (userRole === 'ROLE_MEMBRE') {
          this.router.navigateByUrl("/app/event");
        } else {
          console.warn("LoginComponent: Rôle utilisateur non géré pour la redirection:", userRole, ". Redirection vers l'accueil.");
          this.router.navigateByUrl("/");
        }
      },
      error: (error: Error) => {
        this.isLoading = false;
        console.error('LoginComponent: Erreur de connexion reçue:', error);

        let displayMessage = error.message || "Une erreur est survenue lors de la connexion.";
        if (error.message.includes('401') || error.message.toLowerCase().includes('identifiants invalides')) {
          displayMessage = "L'adresse e-mail ou le mot de passe fourni est incorrect.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          displayMessage = "Erreur de réseau. Vérifiez votre connexion ou réessayez plus tard.";
        }
        this.notification.show(displayMessage, "error");
      }
    });
  }

  // --- MÉTHODES DE SIMULATION DE CONNEXION ---
  /**
   * @private
   * @method simulateLoginWithCredentials
   * @description Simule une connexion avec des identifiants prédéfinis.
   * @param email L'email pour la simulation.
   * @param password Le mot de passe pour la simulation.
   * @param roleName Le nom du rôle pour les logs.
   */
  private simulateLoginWithCredentials(email: string, password: string, roleName: string): void {
    console.warn(`LoginComponent: Simulation de connexion en tant que ${roleName} via le formulaire.`);
    this.loginForm.patchValue({ email, password });
    this.loginForm.markAllAsTouched();
    this.onConnexion();
  }

  /**
   * @method simulateLoginAsMember
   * @description Simule une connexion en tant que Membre.
   */
  simulateLoginAsMember(): void {
    this.simulateLoginWithCredentials(this.MEMBER_EMAIL, this.COMMON_PASSWORD, 'MEMBRE');
  }

  /**
   * @method simulateLoginAsAdmin
   * @description Simule une connexion en tant qu'Administrateur.
   */
  simulateLoginAsAdmin(): void {
    this.simulateLoginWithCredentials(this.ADMIN_EMAIL, this.COMMON_PASSWORD, 'ADMIN');
  }

  /**
   * @method simulateLoginAsResa
   * @description Simule une connexion en tant que Gestionnaire de Réservation.
   */
  simulateLoginAsResa(): void {
    this.simulateLoginWithCredentials(this.RESA_EMAIL, this.COMMON_PASSWORD, 'GESTIONNAIRE RESERVATION');
  }

  // --- MÉTHODE UTILITAIRE POUR L'UI ---
  /**
   * @method togglePasswordVisibility
   * @description Bascule la visibilité du champ mot de passe.
   */
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    console.log("LoginComponent: Visibilité du mot de passe basculée à:", this.passwordFieldType);
  }

  // --- NETTOYAGE LORS DE LA DESTRUCTION DU COMPOSANT ---
  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction. Désabonne `loginSubscription`.
   */
  ngOnDestroy(): void {
    console.log("LoginComponent: Destruction, désinscription de loginSubscription.");
    this.loginSubscription?.unsubscribe();
  }
}

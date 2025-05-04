import {Component, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {LucideAngularModule} from 'lucide-angular';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {NotificationService} from '../../../service/model/notification.service';
import {AuthService} from '../../../service/security/auth.service';
import {Subscription} from 'rxjs';
import {SweetAlertService} from '../../../service/sweet-alert.service'; // Pour relancer les erreurs RxJS

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  protected isLoading = false;
  private loginSubscription: Subscription | null = null; // Pour se désabonner

  // --- Injections ---
  private fb = inject(FormBuilder);
  private router = inject(Router);
  // HttpClient est retiré, AuthService est utilisé à la place
  private authService = inject(AuthService); // Renommé de 'auth' à 'authService' pour clarté
  private notification = inject(SweetAlertService); // Renommé de 'notification' pour clarté

  // --- Propriétés ---
  passwordFieldType: string = 'password';

  loginForm = this.fb.group({
    // Garde tes validateurs
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
    // Décommente si tu veux pré-remplir pour tester
    // email: ['alice.admin@club.fr', [Validators.required, Validators.email]],
    // password: ['password', Validators.required]
  });

  // --- Identifiants de test (Conservés pour les boutons de simulation) ---
  private readonly ADMIN_EMAIL = 'alice.admin@club.fr';
  private readonly MEMBER_EMAIL = 'bob.membre@email.com';
  private readonly RESA_EMAIL = 'charlie.resa@club.fr';
  private readonly COMMON_PASSWORD = 'password';

  // --- Méthode de soumission refactorisée ---
  onConnexion(): void {
    // 1. Vérification initiale de validité
    if (this.loginForm.invalid) {
      this.notification.show("Veuillez remplir correctement l'e-mail et le mot de passe.", "warning");
      this.loginForm.markAllAsTouched(); // Marque tous les champs comme touchés pour afficher les erreurs
      return; // Arrête l'exécution si le formulaire n'est pas valide
    }

    // 2. Démarrer le chargement et préparer les données
    this.isLoading = true;
    const credentials = this.loginForm.getRawValue() as { email: string, password: any };
    // Annule la souscription précédente si elle existe
    this.loginSubscription?.unsubscribe();

    // 3. Appel au service d'authentification
    this.loginSubscription = this.authService.login(credentials).subscribe({
      next: () => {
        // Succès ! Le service a déjà traité le JWT et mis à jour son état.
        this.isLoading = false;
        const userRole = this.authService.getRole(); // Récupère le rôle depuis le service

        console.log(`Connexion réussie. Rôle détecté: ${userRole}`);

        // Logique de redirection basée sur le rôle (inchangée)
        if (!userRole) {
          console.error("Impossible de déterminer le rôle utilisateur après connexion.");
          this.notification.show("Erreur de rôle après connexion.", "error");
          this.router.navigateByUrl('/');
          return;
        }

        if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
          this.router.navigateByUrl("/app/dashboard");
        } else if (userRole === 'ROLE_MEMBRE') {
          this.router.navigateByUrl("/app/event"); // Vérifie que cette route est correcte
        } else {
          console.warn("Rôle utilisateur non géré pour la redirection:", userRole);
          this.router.navigateByUrl("/");
        }
      },
      error: (error: Error) => { // Type Error car handleError renvoie `throwError(() => new Error(errorMessage))`
        // Échec de la connexion (géré par le service, l'erreur est retransmise ici)
        this.isLoading = false;
        console.error('Erreur reçue dans LoginComponent:', error);

        // Affiche le message d'erreur préparé par le service
        // Ou une vérification spécifique si nécessaire (bien que le service puisse déjà le faire)
        if (error.message.includes('401')) { // Vérification basique si le status est dans le message
          this.notification.show("L'e-mail et/ou le mot de passe n'est pas correct.", "error");
        } else {
          this.notification.show(error.message || "Une erreur est survenue lors de la connexion.", "error");
        }
      }
    });
  }

  // --- Méthodes de simulation (utilisent maintenant le flux refactorisé via onConnexion) ---
  private simulateLoginWithCredentials(email: string, password: string, roleName: string): void {
    console.warn(`Simulation de connexion en tant que ${roleName} via formulaire...`);
    this.loginForm.patchValue({ email, password });
    this.loginForm.markAllAsTouched();
    this.onConnexion(); // Appelle la méthode refactorisée
  }

  simulateLoginAsMember(): void {
    this.simulateLoginWithCredentials(this.MEMBER_EMAIL, this.COMMON_PASSWORD, 'MEMBRE');
  }

  simulateLoginAsAdmin(): void {
    this.simulateLoginWithCredentials(this.ADMIN_EMAIL, this.COMMON_PASSWORD, 'ADMIN');
  }

  simulateLoginAsResa(): void {
    this.simulateLoginWithCredentials(this.RESA_EMAIL, this.COMMON_PASSWORD, 'RESERVATION');
  }

  // --- Méthode utilitaire (inchangée) ---
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  // --- Nettoyage ---
  ngOnDestroy(): void {
    // Se désabonner lors de la destruction du composant pour éviter les fuites mémoire
    this.loginSubscription?.unsubscribe();
  }
}

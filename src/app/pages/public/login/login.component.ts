// ----- IMPORTATIONS -----
import {
  Component,
  inject,         // Fonction moderne pour l'injection de dépendances.
  OnInit,         // À ajouter si ngOnInit est implémenté (ici, il est implicite).
  OnDestroy       // Pour gérer la désinscription des abonnements.
  // ChangeDetectorRef // À ajouter si ChangeDetectionStrategy.OnPush est utilisé.
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Pour les formulaires réactifs.
import { Router, RouterLink } from '@angular/router'; // Pour la navigation et les liens de route.
import { Subscription } from 'rxjs';                // Pour gérer la désinscription.

// Services
import { AuthService } from '../../../service/security/auth.service'; // Service pour les opérations d'authentification.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Autres (Icônes, Modules Communs)
import { LucideAngularModule } from 'lucide-angular'; // Pour les icônes Lucide.
// import { CommonModule } from '@angular/common'; // À ajouter si @if, @for, etc. sont utilisés.

/**
 * @Component LoginComponent
 * @description
 * Page de connexion permettant aux utilisateurs de s'authentifier sur l'application.
 * Elle utilise un formulaire réactif pour la saisie de l'email et du mot de passe.
 * Après validation des identifiants via `AuthService`, l'utilisateur est redirigé
 * vers une page appropriée en fonction de son rôle (Tableau de bord, Liste des événements, etc.).
 * Des boutons de simulation de connexion sont présents pour faciliter le développement.
 *
 * @example
 * <app-login></app-login> <!-- Typiquement utilisé comme composant de route, ex: '/connexion' -->
 */
@Component({
  selector: 'app-login',           // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,               // Indique que c'est un composant autonome.
  imports: [                      // Dépendances nécessaires pour le template.
    RouterLink,                   // Pour le lien "Pas encore de compte ?".
    LucideAngularModule,          // Pour les icônes (ex: visibilité du mot de passe).
    ReactiveFormsModule,          // Indispensable pour `[formGroup]` et `formControlName`.
    // CommonModule,              // À ajouter si @if, @for, ou des pipes de CommonModule sont utilisés.
  ],
  templateUrl: './login.component.html', // Chemin vers le fichier HTML du composant.
  styleUrls: ['./login.component.scss']  // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisagez pour optimiser les performances.
})
export class LoginComponent implements OnDestroy { // Implémente OnDestroy (OnInit est implicite si constructeur/propriétés initialisées).

  // --- PROPRIÉTÉS DU COMPOSANT ---
  /**
   * @protected
   * @property {boolean} isLoading
   * @description Booléen indiquant si la tentative de connexion (appel API) est en cours.
   * Utilisé pour désactiver le bouton de soumission et afficher un feedback visuel.
   * `protected` permet l'accès dans le template si nécessaire (bien que `public` soit plus courant).
   * @default false
   */
  protected isLoading = false;
  /**
   * @private
   * @property {Subscription | null} loginSubscription
   * @description Référence à l'abonnement pour l'opération de connexion.
   * Permet de se désabonner proprement dans `ngOnDestroy`.
   * @default null
   */
  private loginSubscription: Subscription | null = null;

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   */
  private fb = inject(FormBuilder);
  /**
   * @private
   * @description Service Angular pour la navigation programmatique.
   */
  private router = inject(Router);
  /**
   * @private
   * @description Service d'authentification, utilisé pour la méthode de connexion.
   */
  private authService = inject(AuthService);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) à l'utilisateur.
   */
  private notification = inject(SweetAlertService);
  // private cdr = inject(ChangeDetectorRef); // À injecter si ChangeDetectionStrategy.OnPush est utilisé.

  // --- PROPRIÉTÉS POUR LE FORMULAIRE ET L'UI ---
  /**
   * @property {string} passwordFieldType
   * @description Détermine le type de l'input du mot de passe ('password' ou 'text')
   * pour permettre de masquer/afficher le mot de passe.
   * @default 'password'
   */
  passwordFieldType: string = 'password';

  /**
   * @property {FormGroup} loginForm
   * @description Le formulaire réactif Angular utilisé pour la saisie de l'email et du mot de passe.
   * Initialisé directement avec les validateurs requis.
   */
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]], // Champ email, requis et doit être un email valide.
    password: ['', Validators.required]                   // Champ mot de passe, requis.
    // Section pour pré-remplir les champs à des fins de test (commentée par défaut).
    // email: ['alice.admin@club.fr', [Validators.required, Validators.email]],
    // password: ['password', Validators.required]
  });

  // --- Identifiants de test pour les boutons de simulation ---
  /** @private Identifiant email pour le rôle Administrateur (simulation). */
  private readonly ADMIN_EMAIL = 'alice.admin@club.fr';
  /** @private Identifiant email pour le rôle Membre (simulation). */
  private readonly MEMBER_EMAIL = 'bob.membre@email.com';
  /** @private Identifiant email pour le rôle Gestionnaire de Réservation (simulation). */
  private readonly RESA_EMAIL = 'charlie.resa@club.fr';
  /** @private Mot de passe commun pour les simulations. */
  private readonly COMMON_PASSWORD = 'password';

  // Le constructeur est implicitement fourni car les injections sont via inject() et
  // loginForm est initialisé directement avec une valeur. ngOnInit n'est pas
  // explicitement nécessaire si pas d'autre logique d'initialisation.

  // --- MÉTHODE DE SOUMISSION DU FORMULAIRE DE CONNEXION ---
  /**
   * @method onConnexion
   * @description Gère la soumission du formulaire de connexion.
   * 1. Valide le formulaire. Si invalide, marque tous les champs comme "touchés"
   *    pour afficher les erreurs de validation et notifie l'utilisateur.
   * 2. Prépare les identifiants et active l'état de chargement.
   * 3. Appelle `authService.login()` pour tenter l'authentification.
   * 4. En cas de succès, récupère le rôle de l'utilisateur via `authService.getRole()`
   *    et redirige vers la page appropriée (Tableau de bord, Événements, etc.).
   * 5. En cas d'échec, affiche un message d'erreur.
   * @returns {void}
   */
  onConnexion(): void {
    // Vérification initiale de la validité du formulaire.
    if (this.loginForm.invalid) {
      this.notification.show("Veuillez remplir correctement l'e-mail et le mot de passe.", "warning");
      this.loginForm.markAllAsTouched(); // Affiche les messages d'erreur pour les champs invalides.
      console.warn("LoginComponent: Tentative de connexion avec un formulaire invalide.");
      return; // Sortie anticipée.
    }

    this.isLoading = true; // Active l'indicateur de chargement.
    // this.cdr.detectChanges(); // Si OnPush.

    // Récupère les identifiants du formulaire.
    // L'assertion de type est utilisée car getRawValue() retourne { [key: string]: any; }.
    const credentials = this.loginForm.getRawValue() as { email: string; password: any };

    // Annule un abonnement précédent s'il existait (pour éviter les appels multiples).
    this.loginSubscription?.unsubscribe();

    console.log("LoginComponent: Tentative de connexion avec les identifiants:", {email: credentials.email, password: '***'});
    // Appel au service d'authentification.
    this.loginSubscription = this.authService.login(credentials).subscribe({
      next: () => { // Le succès est géré lorsque l'Observable se complète sans erreur.
        this.isLoading = false;
        const userRole = this.authService.getRole(); // Récupère le rôle stocké par AuthService.


        // Logique de redirection basée sur le rôle.
        if (!userRole) {
          console.error("LoginComponent: Rôle utilisateur indéterminé après connexion. Redirection vers l'accueil.");
          this.notification.show("Erreur de rôle après connexion. Veuillez contacter le support.", "error");
          this.router.navigateByUrl('/'); // Redirection de secours.
          return;
        }

        if (userRole === 'ROLE_ADMIN' || userRole === 'ROLE_RESERVATION') {
          this.router.navigateByUrl("/app/dashboard");
        } else if (userRole === 'ROLE_MEMBRE') {
          this.router.navigateByUrl("/app/event"); // Assurez-vous que cette route est configurée.
        } else {
          console.warn("LoginComponent: Rôle utilisateur non géré pour la redirection:", userRole, ". Redirection vers l'accueil.");
          this.router.navigateByUrl("/"); // Redirection par défaut pour les rôles inconnus.
        }
        // this.cdr.detectChanges(); // Si OnPush, bien que la navigation puisse rendre cela moins critique.
      },
      error: (error: Error) => { // L'erreur est typée comme Error car AuthService.handleError la transforme.
        this.isLoading = false;
        console.error('LoginComponent: Erreur de connexion reçue:', error);

        // Affiche le message d'erreur préparé par AuthService.handleError.
        // On pourrait ajouter des messages plus spécifiques basés sur le contenu de `error.message` si nécessaire.
        let displayMessage = error.message || "Une erreur est survenue lors de la connexion.";
        if (error.message.includes('401') || error.message.toLowerCase().includes('identifiants invalides')) {
          displayMessage = "L'adresse e-mail ou le mot de passe fourni est incorrect.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          displayMessage = "Erreur de réseau. Vérifiez votre connexion ou réessayez plus tard.";
        }
        this.notification.show(displayMessage, "error");
        // this.cdr.detectChanges(); // Si OnPush.
      }
    });
  }

  // --- MÉTHODES DE SIMULATION DE CONNEXION (pour le développement/test) ---
  /**
   * @private
   * @method simulateLoginWithCredentials
   * @description Méthode utilitaire pour simuler une connexion en remplissant le formulaire
   * avec des identifiants prédéfinis et en déclenchant la soumission.
   * @param {string} email - L'email à utiliser pour la simulation.
   * @param {string} password - Le mot de passe à utiliser pour la simulation.
   * @param {string} roleName - Le nom du rôle pour l'affichage dans les logs.
   * @returns {void}
   */
  private simulateLoginWithCredentials(email: string, password: string, roleName: string): void {
    console.warn(`LoginComponent: Simulation de connexion en tant que ${roleName} via le formulaire.`);
    this.loginForm.patchValue({ email, password }); // Remplit le formulaire.
    this.loginForm.markAllAsTouched(); // Marque comme touché pour la validation (bien que les données soient valides).
    this.onConnexion(); // Appelle la méthode de connexion principale.
  }

  /**
   * @method simulateLoginAsMember
   * @description Simule une connexion avec les identifiants d'un utilisateur Membre.
   * @returns {void}
   */
  simulateLoginAsMember(): void {
    this.simulateLoginWithCredentials(this.MEMBER_EMAIL, this.COMMON_PASSWORD, 'MEMBRE');
  }

  /**
   * @method simulateLoginAsAdmin
   * @description Simule une connexion avec les identifiants d'un utilisateur Administrateur.
   * @returns {void}
   */
  simulateLoginAsAdmin(): void {
    this.simulateLoginWithCredentials(this.ADMIN_EMAIL, this.COMMON_PASSWORD, 'ADMIN');
  }

  /**
   * @method simulateLoginAsResa
   * @description Simule une connexion avec les identifiants d'un utilisateur Gestionnaire de Réservation.
   * @returns {void}
   */
  simulateLoginAsResa(): void {
    this.simulateLoginWithCredentials(this.RESA_EMAIL, this.COMMON_PASSWORD, 'GESTIONNAIRE RESERVATION');
  }

  // --- MÉTHODE UTILITAIRE POUR L'UI (VISIBILITÉ DU MOT DE PASSE) ---
  /**
   * @method togglePasswordVisibility
   * @description Bascule la visibilité du champ mot de passe entre 'password' (masqué) et 'text' (visible).
   * @returns {void}
   */
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    console.log("LoginComponent: Visibilité du mot de passe basculée à:", this.passwordFieldType);
  }

  // --- NETTOYAGE LORS DE LA DESTRUCTION DU COMPOSANT ---
  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de `loginSubscription` pour éviter les fuites de mémoire si une connexion
   * était en cours au moment où le composant est détruit.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("LoginComponent: Destruction, désinscription de loginSubscription.");
    this.loginSubscription?.unsubscribe();
  }
}

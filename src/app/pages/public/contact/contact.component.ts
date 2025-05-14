// ----- IMPORTATIONS -----
import {
  Component,
  inject,         // Fonction moderne pour l'injection de dépendances.
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Pour les formulaires réactifs.
import { NgIf, CommonModule } from '@angular/common'; // NgIf pour l'affichage conditionnel, CommonModule pour la base.

// Composants de Navigation/Layout
import { NavbarComponent } from '../../../component/navigation/navbar/navbar.component'; // Barre de navigation.
import { FooterComponent } from '../../../component/navigation/footer/footer.component'; // Pied de page.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular'; // Pour les icônes Lucide.


/**
 * @Component ContactComponent
 * @description
 * Page "Contact" de l'application. Affiche les informations de contact du développeur/de l'application
 * et fournit un formulaire permettant aux utilisateurs d'envoyer un message.
 * Le formulaire est construit avec les formulaires réactifs d'Angular et inclut la validation.
 * La soumission du formulaire est actuellement simulée mais est prête à être connectée à un service backend.
 *
 * @example
 * <app-contact></app-contact> <!-- Typiquement utilisé comme composant de route, ex: '/contact' -->
 */
@Component({
  selector: 'app-contact',         // Sélecteur CSS (nom de la balise) du composant.
  standalone: true,               // Indique que c'est un composant autonome.
  imports: [                      // Dépendances nécessaires pour le template.
    NavbarComponent,              // Affiche la barre de navigation.
    FooterComponent,              // Affiche le pied de page.
    LucideAngularModule,          // Pour les icônes Lucide.
    ReactiveFormsModule,          // Nécessaire pour `[formGroup]` et `formControlName`.
    NgIf,                         // Pour l'affichage conditionnel des messages (ou utiliser @if de CommonModule).
    CommonModule                  // Inclus pour NgIf et potentiellement d'autres pipes/directives.
  ],
  templateUrl: './contact.component.html', // Chemin vers le fichier HTML du composant.
  styleUrl: './contact.component.scss'    // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisager pour optimiser si la page devient plus complexe.
})
export class ContactComponent implements OnInit { // Implémente OnInit.

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   */
  private fb = inject(FormBuilder);

  // --- PROPRIÉTÉS DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {FormGroup} contactForm
   * @description Le formulaire réactif Angular utilisé pour la saisie du message de contact.
   * Le `!` (definite assignment assertion) indique qu'il sera initialisé dans `ngOnInit`.
   */
  contactForm!: FormGroup;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si l'envoi du message de contact est en cours.
   * Utilisé pour afficher un indicateur de chargement et désactiver le bouton de soumission.
   * @default false
   */
  isLoading = false;
  /**
   * @property {string | null} errorMessage
   * @description Stocke un message d'erreur à afficher si l'envoi du message échoue.
   * @default null
   */
  errorMessage: string | null = null;
  /**
   * @property {string | null} successMessage
   * @description Stocke un message de succès à afficher après l'envoi réussi du message.
   * @default null
   */
  successMessage: string | null = null;

  // --- Informations de contact (statiques ou à charger dynamiquement) ---
  /**
   * @property {string} appName
   * @description Le nom de l'application, affiché dans la section contact.
   * @default 'Club Plus'
   */
  appName: string = 'Club Plus';
  /**
   * @property {string} mail
   * @description L'adresse e-mail de contact.
   * @default 'momper.axel.99@gmail.com'
   */
  mail: string = 'momper.axel.99@gmail.com';
  /**
   * @property {string} telephone
   * @description Le numéro de téléphone de contact.
   * @default '07.82.94.82.79'
   */
  telephone: string = '07.82.94.82.79';
  /**
   * @property {string} linkedin
   * @description Le lien vers le profil LinkedIn.
   * @default 'www.linkedin.com/in/axel-momper'
   */
  linkedin: string = 'www.linkedin.com/in/axel-momper';
  /**
   * @property {string} github
   * @description Le lien vers le profil GitHub.
   * @default 'https://github.com/Karmadibsa'
   */
  github: string = 'https://github.com/Karmadibsa';
  /**
   * @property {string} developerName
   * @description Le nom du développeur.
   * @default 'Axel MOMPER'
   */
  developerName: string = 'Axel MOMPER';
  /**
   * @property {string} projectContext
   * @description Le contexte du projet.
   * @default 'Projet CDA-JAVA 2024-2025'
   */
  projectContext: string = 'Projet CDA-JAVA 2024-2025';

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Initialise le formulaire de contact.
   * @see {@link initForm}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("ContactComponent: Initialisation.");
    this.initForm();
  }

  /**
   * @method ngAfterViewInit
   * @description Crochet de cycle de vie Angular. Appelé après que la vue du composant
   * (et de ses enfants) a été initialisée.
   * Actuellement vide, mais peut être utilisé pour des manipulations du DOM après rendu
   * (par exemple, initialiser des librairies JS tierces).
   * @returns {void}
   */
  // ngAfterViewInit(): void {
  //   // Ce crochet était présent mais vide. Supprimé si non utilisé.
  // }

  // ngOnDestroy(): void {
  //   this.contactSubscription?.unsubscribe();
  // }

  // --- INITIALISATION DU FORMULAIRE ---
  /**
   * @private
   * @method initForm
   * @description Initialise la structure du `contactForm` avec ses `FormControl`
   * et les validateurs requis pour chaque champ (nom, email, sujet, message).
   * @returns {void}
   */
  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required], // Champ nom, requis.
      email: ['', [Validators.required, Validators.email]], // Champ email, requis et doit être un email valide.
      subject: ['', Validators.required], // Champ sujet, requis.
      message: ['', [Validators.required, Validators.minLength(10)]] // Champ message, requis avec une longueur minimale.
    });
    console.log("ContactComponent: Formulaire de contact initialisé.");
  }

  // --- GETTERS POUR UN ACCÈS FACILE AUX CONTRÔLES DE FORMULAIRE DANS LE TEMPLATE ---
  // Ces getters permettent d'utiliser une syntaxe plus concise dans le template HTML
  // pour accéder aux contrôles du formulaire et à leurs états de validation.
  // Exemple: `*ngIf="name?.invalid && (name?.dirty || name?.touched)"`
  /**
   * @method name
   * @description Getter pour accéder au `FormControl` 'name'.
   * @returns {AbstractControl | null} Le contrôle de formulaire 'name'.
   */
  get name() { return this.contactForm.get('name'); }
  /**
   * @method email
   * @description Getter pour accéder au `FormControl` 'email'.
   * @returns {AbstractControl | null} Le contrôle de formulaire 'email'.
   */
  get email() { return this.contactForm.get('email'); }
  /**
   * @method subject
   * @description Getter pour accéder au `FormControl` 'subject'.
   * @returns {AbstractControl | null} Le contrôle de formulaire 'subject'.
   */
  get subject() { return this.contactForm.get('subject'); }
  /**
   * @method message
   * @description Getter pour accéder au `FormControl` 'message'.
   * @returns {AbstractControl | null} Le contrôle de formulaire 'message'.
   */
  get message() { return this.contactForm.get('message'); }

  // --- SOUMISSION DU FORMULAIRE ---
  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire de contact.
   * Réinitialise les messages d'erreur/succès.
   * Vérifie la validité du formulaire. Si invalide, marque tous les champs comme "touchés"
   * pour afficher les messages d'erreur de validation.
   * Si valide, met à jour l'état `isLoading` et simule un appel API pour envoyer les données.
   * Après l'appel (simulé), affiche un message de succès ou d'erreur et réinitialise le formulaire.
   * **NOTE:** La logique d'appel API réelle est commentée et doit être implémentée avec un `ContactService`.
   * @returns {void}
   */
  onSubmit(): void {
    // Réinitialise les messages précédents.
    this.errorMessage = null;
    this.successMessage = null;

    // Vérifie si le formulaire est valide.
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched(); // Marque tous les champs pour afficher les erreurs.
      console.warn("ContactComponent: Tentative de soumission d'un formulaire invalide.");
      return; // Sortie anticipée si le formulaire n'est pas valide.
    }

    this.isLoading = true; // Active l'indicateur de chargement.
    // this.cdr.detectChanges(); // Si OnPush.

    const formData = this.contactForm.value; // Récupère les valeurs du formulaire.
    console.log('ContactComponent: Formulaire de contact soumis (données prêtes pour envoi):', formData);

    // --- PLACEHOLDER POUR SIMULER UN APPEL API ---
    // À supprimer lorsque la logique d'appel API réelle est implémentée.
    setTimeout(() => {
      this.isLoading = false; // Désactive l'indicateur de chargement.
      const success = Math.random() > 0.2; // Simule un succès (80% de chance).

      if (success) {
        this.successMessage = 'Votre message a bien été envoyé. Nous vous répondrons rapidement. (Simulation)';
        this.contactForm.reset(); // Réinitialise le formulaire.
        // Réinitialise l'état "touché" et "modifié" des contrôles pour masquer
        // les messages d'erreur de validation après la réinitialisation.
        Object.keys(this.contactForm.controls).forEach(key => {
          this.contactForm.get(key)?.markAsUntouched();
          this.contactForm.get(key)?.markAsPristine();
        });
        console.log("ContactComponent: Simulation d'envoi de message réussie.");
      } else {
        this.errorMessage = 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer plus tard. (Simulation)';
        console.warn("ContactComponent: Simulation d'envoi de message échouée.");
      }
      // this.cdr.detectChanges(); // Si OnPush.
    }, 1500); // Simule une attente de 1.5 secondes.
    // --- FIN DU PLACEHOLDER ---
  }
}

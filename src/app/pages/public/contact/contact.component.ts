// ----- IMPORTATIONS -----
import {
  Component,
  inject,         // Fonction moderne pour l'injection de dépendances.
  OnInit,
  OnDestroy       // Ajouté pour la désinscription
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Pour les formulaires réactifs.
import { NgIf, CommonModule } from '@angular/common'; // NgIf pour l'affichage conditionnel, CommonModule pour la base.
import { HttpClientModule } from '@angular/common/http'; // **AJOUT IMPORTANT**

// Service

// Composants de Navigation/Layout
import { NavbarComponent } from '../../../component/navigation/navbar/navbar.component'; // Barre de navigation.
import { FooterComponent } from '../../../component/navigation/footer/footer.component'; // Pied de page.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular'; // Pour les icônes Lucide.
import { Subscription } from 'rxjs';
import {ContactFormData, ContactService} from '../../../service/contact.service'; // **AJOUT pour la désinscription**


/**
 * @Component ContactComponent
 * @description
 * Page "Contact" de l'application. Affiche les informations de contact du développeur/de l'application
 * et fournit un formulaire permettant aux utilisateurs d'envoyer un message.
 * Le formulaire est construit avec les formulaires réactifs d'Angular et inclut la validation.
 * La soumission du formulaire est connectée au ContactService pour envoyer les données au backend.
 *
 * @example
 * <app-contact></app-contact> <!-- Typiquement utilisé comme composant de route, ex: '/contact' -->
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    LucideAngularModule,
    ReactiveFormsModule,
    NgIf,
    CommonModule,
    HttpClientModule // **AJOUT IMPORTANT : Nécessaire pour HttpClient dans le service si pas globalement fourni**
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy { // **AJOUT : Implémente OnDestroy**

  private fb = inject(FormBuilder);
  private contactService = inject(ContactService); // **AJOUT : Injection du ContactService**

  contactForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  appName: string = 'Club Plus';
  mail: string = 'momper.axel.99@gmail.com';
  telephone: string = '07.82.94.82.79';
  linkedin: string = 'www.linkedin.com/in/axel-momper';
  github: string = 'https://github.com/Karmadibsa';
  developerName: string = 'Axel MOMPER';
  projectContext: string = 'Projet CDA-JAVA 2024-2025';

  private contactSubscription: Subscription | undefined; // **AJOUT pour la gestion de la souscription**

  ngOnInit(): void {
    console.log("ContactComponent: Initialisation.");
    this.initForm();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
    console.log("ContactComponent: Formulaire de contact initialisé.");
  }

  get name() { return this.contactForm.get('name'); }
  get email() { return this.contactForm.get('email'); }
  get subject() { return this.contactForm.get('subject'); }
  get message() { return this.contactForm.get('message'); }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      console.warn("ContactComponent: Tentative de soumission d'un formulaire invalide.");
      return;
    }

    this.isLoading = true;
    const formData: ContactFormData = this.contactForm.value;
    console.log('ContactComponent: Formulaire soumis, envoi des données via service:', formData);

    // **MODIFICATION : Appel au service au lieu de la simulation**
    this.contactSubscription = this.contactService.sendContactMessage(formData)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // La réponse du backend est une chaîne de caractères si ResponseEntity<String>
          const messageFromBackend = typeof response === 'string' ? response : (response as any).message;
          this.successMessage = messageFromBackend || 'Votre message a bien été envoyé. Nous vous répondrons rapidement.';
          this.contactForm.reset();
          Object.keys(this.contactForm.controls).forEach(key => {
            this.contactForm.get(key)?.markAsUntouched();
            this.contactForm.get(key)?.markAsPristine();
          });
          console.log("ContactComponent: Envoi de message réussi via service.", response);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.message || 'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer plus tard.';
          console.error("ContactComponent: Erreur lors de l'envoi du message via service:", err);
        }
      });
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé juste avant que le composant ne soit détruit.
   * Se désabonne de la souscription au service de contact pour éviter les fuites de mémoire.
   * @returns {void}
   */
  ngOnDestroy(): void {
    if (this.contactSubscription) {
      this.contactSubscription.unsubscribe();
      console.log("ContactComponent: Désinscription de contactSubscription.");
    }
  }
}

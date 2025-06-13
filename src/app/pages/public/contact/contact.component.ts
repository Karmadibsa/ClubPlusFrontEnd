import {
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from '../../../component/navigation/navbar/navbar.component';
import { FooterComponent } from '../../../component/navigation/footer/footer.component';

import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { ContactService} from '../../../service/contact.service';
import {ContactFormData} from '../../../model/contact';


/**
 * @Component ContactComponent
 * @description Page "Contact" de l'application.
 * Affiche les informations de contact et fournit un formulaire pour envoyer un message.
 * Utilise les formulaires réactifs d'Angular pour la validation et la soumission au backend.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    LucideAngularModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

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

  private contactSubscription: Subscription | undefined;

  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation du composant. Initialise le formulaire de contact.
   */
  ngOnInit(): void {
    console.log("ContactComponent: Initialisation.");
    this.initForm();
  }

  /**
   * @private
   * @method initForm
   * @description Initialise la structure du formulaire réactif avec ses contrôles et validateurs.
   */
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

  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire de contact.
   * Valide le formulaire et envoie les données via le ContactService.
   */
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

    this.contactSubscription = this.contactService.sendContactMessage(formData)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
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
   * @description Appelé avant la destruction du composant. Désabonne `contactSubscription` pour éviter les fuites de mémoire.
   */
  ngOnDestroy(): void {
    if (this.contactSubscription) {
      this.contactSubscription.unsubscribe();
    }
  }
}

import {Component, inject} from '@angular/core';
import {NavbarComponent} from '../../../component/navigation/navbar/navbar.component';
import {FooterComponent} from '../../../component/navigation/footer/footer.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LucideAngularModule} from 'lucide-angular';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [
    NavbarComponent,
    FooterComponent,
    LucideAngularModule,
    ReactiveFormsModule,
    NgIf
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  // Injectez votre service de contact si nécessaire
  // private contactService = inject(ContactService);

  contactForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Informations générales (peuvent être récupérées dynamiquement si besoin)
  appName: string = 'Club Plus';
  mail: string = 'momper.axel.99@gmail.com';
  telephone: string = '07.82.94.82.79';
  linkedin: string = 'www.linkedin.com/in/axel-momper';
  github: string = 'https://github.com/Karmadibsa';
  developerName: string = 'Axel MOMPER'; // [1]
  projectContext: string = 'Projet CDA-JAVA 2024-2025'; // [1]

  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {

  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  // Getters pour accès facile dans le template
  get name() { return this.contactForm.get('name'); }
  get email() { return this.contactForm.get('email'); }
  get subject() { return this.contactForm.get('subject'); }
  get message() { return this.contactForm.get('message'); }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.contactForm.value;
    console.log('Formulaire de contact soumis (Placeholder):', formData);

    // *** Logique d'appel API pour envoyer le message (à implémenter) ***
    // Remplacez ce bloc par votre appel au service
    // this.contactService.sendMessage(formData).subscribe({
    //   next: () => {
    //     this.isLoading = false;
    //     this.successMessage = 'Votre message a bien été envoyé. Nous vous répondrons dès que possible.';
    //     this.contactForm.reset();
    //   },
    //   error: (err) => {
    //     this.isLoading = false;
    //     this.errorMessage = err.error?.message || 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.';
    //     console.error('Erreur envoi message:', err);
    //   }
    // });

    // --- Placeholder pour simuler un appel API ---
    setTimeout(() => {
      this.isLoading = false;
      const success = Math.random() > 0.2; // 80% de chance de succès
      if (success) {
        this.successMessage = 'Votre message a bien été envoyé. (Simulation)';
        this.contactForm.reset();
        // Réinitialiser l'état touché pour masquer les erreurs après reset
        Object.keys(this.contactForm.controls).forEach(key => {
          this.contactForm.get(key)?.markAsUntouched();
        });
      } else {
        this.errorMessage = 'Une erreur est survenue lors de l\'envoi. (Simulation)';
      }
    }, 1500);
    // --- Fin Placeholder ---
  }
}

import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
// Import HttpClient, HttpErrorResponse, HttpClientModule
import {HttpClient, HttpErrorResponse, HttpClientModule} from '@angular/common/http';
import {catchError} from 'rxjs/operators'; // Pour la gestion d'erreurs RxJS
import {throwError} from 'rxjs'; // Pour relancer les erreurs RxJS

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    LucideAngularModule,
    ReactiveFormsModule,
    HttpClientModule // Assurez-vous que HttpClientModule est importé
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  // --- Injections ---
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient); // Injection de HttpClient

  // --- Propriétés ---
  loginForm!: FormGroup;
  errorMessage: string | null = null;
  passwordFieldType: string = 'password';
  // Définir l'URL de l'API directement ici
  private apiUrl = 'http://localhost:8080/api/connexion'; // <--- URL complète de l'API

  // --- Initialisation du formulaire ---
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['jean.dupont@gmail.com', [Validators.required, Validators.email]],
      password: ['password', Validators.required],
      remember: [false]
    });
  }

  // --- Méthode de soumission ---
  onSubmit(): void {
    this.errorMessage = null;
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      console.log("Formulaire invalide");
      return;
    }

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    console.log("Tentative de connexion avec:", credentials);
    console.log("Vers l'URL:", this.apiUrl); // Log de l'URL utilisée

    // Appel API POST vers l'URL complète définie dans this.apiUrl
    this.http.post(this.apiUrl, credentials, { responseType: 'text' }) // Utilisation de this.apiUrl
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error("Erreur de connexion détaillée:", error); // Log complet de l'erreur HTTP
          if (error.status === 0) {
            // Cela peut indiquer un problème de CORS ou que le backend n'est pas joignable
            this.errorMessage = "Impossible de joindre le serveur d'authentification. Vérifiez qu'il est démarré et que les CORS sont configurés si nécessaire.";
          } else if (error.status === 401) {
            this.errorMessage = "Email ou mot de passe incorrect.";
          } else if (error.status === 404) {
            // 404 signifie que l'URL spécifique n'est pas trouvée sur le serveur backend
            this.errorMessage = "L'endpoint d'API spécifié ('/api/connexion') n'a pas été trouvé sur le serveur backend. Vérifiez l'URL.";
          }
          else {
            // Autres erreurs HTTP
            this.errorMessage = `Une erreur serveur est survenue (Code: ${error.status}). Veuillez réessayer.`;
          }
          return throwError(() => error); // Renvoyer l'erreur
        })
      )
      .subscribe(token => {
        console.log("Connexion réussie, token reçu:", token);
        localStorage.setItem('jwtToken', token);
        this.router.navigate(['/event']); // Adaptez si nécessaire
      });
  }

  // --- Méthode pour basculer l'affichage du mot de passe ---
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
}

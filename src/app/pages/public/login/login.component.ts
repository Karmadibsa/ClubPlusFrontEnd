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
import {AuthService} from '../../../service/auth.service'; // Pour relancer les erreurs RxJS

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
      email: ['jean.dupont@gmail.com', [Validators.required, Validators.email]],
      password: ['password', Validators.required]
    });


  // --- Méthode de soumission ---
  onConnexion(): void {
if(this.loginForm.valid){
  this.http.post(
    "http://localhost:8080/api/connexion",
    this.loginForm.value,
    {responseType: "text"})
    .subscribe({
      next : jwt => {
        this.router.navigateByUrl("/dashboard")
        this.auth.decodeJwt(jwt)
      },
      error : erreur => {
        if(erreur.status === 401){
          this.notification.show("L'e-mail et/ou le mot de passe n'est pas correct", "error")
        }
      }
    })
}
  }

  // --- Méthode pour basculer l'affichage du mot de passe ---
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
}

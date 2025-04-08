// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Simuler un utilisateur connecté (pour l'instant)
  private currentUser = {
    id: 1,  // Supposons que l'ID 1 est un admin
    role: 'admin'
  };

  // Vérifier si l'utilisateur peut modifier les rôles
  canChangeRoles(): boolean {
    return this.currentUser.role === 'admin';
  }
}

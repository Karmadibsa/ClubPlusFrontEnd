import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class MembreService {
  private http = inject(HttpClient);
  // Utilise l'URL de base de l'API définie dans les fichiers d'environnement
  private apiUrl = `${environment.apiUrl}/membres`;

  /**
   * Récupère les 5 derniers membres inscrits pour le club géré par l'utilisateur connecté.
   * Appelle GET /api/membres/derniers-inscrits-mon-club
   * @returns Un Observable contenant un tableau de Membre.
   */
  getLatestMembers(): Observable<Membre[]> {
    const url = `${this.apiUrl}/derniers-inscrits-mon-club`;
    console.log('Appel API Membres:', url); // Pour le débogage
    // Le backend détermine le club via l'utilisateur authentifié (pas besoin de passer d'ID ici)
    return this.http.get<Membre[]>(url);
    // Note: La gestion des erreurs (catchError) est faite dans le composant pour cet exemple,
    // mais pourrait aussi être centralisée ici.
  }

  // Vérifier que newRole est bien un string 'MEMBRE' ou 'RESERVATION'
  // changeMemberRole(membreId: number, clubId: number, newRole: Role | string): Observable<Membre> {
  //   const url = `${this.apiUrl}/${membreId}/role`;
  //   let params = new HttpParams()
  //     .set('clubId', clubId.toString())
  //     // La valeur de 'newRole' (venant de l'enum ou string) est directement utilisée
  //     .set('newRole', newRole);
  //
  //   console.log(`Appel API pour changer rôle: ${url}`, params.toString());
  //   // Le backend reçoit 'MEMBRE' ou 'RESERVATION'
  //   return this.http.put<Membre>(url, {}, { params });
  // }
}

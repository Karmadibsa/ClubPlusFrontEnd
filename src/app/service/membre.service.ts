import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environments';
import {RoleType} from '../model/role';
import {catchError} from 'rxjs/operators';
import {Membre} from '../model/membre';

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

  /**
   * Met à jour le rôle d'un membre spécifique au sein d'un club.
   * Effectue un appel PUT vers /api/membres/{membreId}/role avec clubId et newRole en paramètres query.
   *
   * @param membreId L'identifiant numérique du membre dont le rôle doit être modifié.
   * @param clubId L'identifiant numérique du club dans lequel le rôle est modifié (contexte).
   * @param newRole Le nouveau rôle à assigner au membre (type RoleType: 'MEMBRE' ou 'RESERVATION').
   * @returns Un Observable contenant l'objet Membre mis à jour si l'API le retourne, sinon Observable<void> ou Observable<any>.
   */
  changeMemberRole(membreId: number, clubId: number, newRole: RoleType): Observable<Membre> { // Ajuster le type de retour si l'API ne retourne pas le membre complet
    // Construction de l'URL spécifique pour cette action
    const url = `${this.apiUrl}/${membreId}/role`;

    // Création des paramètres de la requête (query parameters)
    let params = new HttpParams();
    // Ajout du paramètre clubId. toString() est une bonne pratique pour s'assurer que c'est une chaîne.
    params = params.append('clubId', clubId.toString());
    // Ajout du paramètre newRole. RoleType étant déjà 'MEMBRE' | 'RESERVATION', c'est directement utilisable.
    params = params.append('newRole', newRole);

    // Affichage dans la console pour le débogage (peut être retiré en production)
    console.log(`MembreService: Appel PUT vers ${url} avec params:`, params.toString());

    // Exécution de la requête PUT.
    // Le deuxième argument (corps de la requête) est 'null' car les données sont passées via HttpParams.
    // On spécifie le type de retour attendu <Membre>. Si l'API ne retourne rien (204 No Content),
    // utilisez Observable<void> ou Observable<HttpResponse<any>> pour plus de contrôle.
    return this.http.put<Membre>(url, null, { params: params }).pipe(
    );
  }
}

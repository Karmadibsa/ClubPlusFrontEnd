/**
 * Importations des modules et des types nécessaires.
 */
// Injectable: Décorateur pour marquer la classe comme un service injectable.
import { Injectable } from '@angular/core';
// environment: Fichier de configuration pour les variables d'environnement (ex: URL de l'API).
import { environment } from '../../../environments/environments'; // Assurez-vous que le chemin est correct.
// HttpClient: Service Angular pour effectuer des requêtes HTTP.
import { HttpClient } from '@angular/common/http';
// Observable: Type de RxJS représentant un flux de données asynchrones.
import { Observable } from 'rxjs';
// HomepageStats: Modèle de données (interface) pour typer les statistiques de la page d'accueil.
import { HomepageStats } from '../../model/HomepageStats'; // Assurez-vous que le chemin est correct.

/**
 * @Injectable({ providedIn: 'root' })
 * Ce décorateur marque la classe 'PublicDataService' comme un service.
 * 'providedIn: 'root'' signifie qu'Angular créera une instance unique (singleton)
 * de ce service, la rendant disponible dans toute l'application sans avoir besoin
 * de l'ajouter manuellement à la liste 'providers' d'un module.
 */
@Injectable({
  providedIn: 'root'
})
export class PublicDataService {
  /**
   * URL de base pour les appels à l'API pour les données publiques de ce service.
   * Elle est construite en utilisant la variable `apiUrl` définie dans le fichier
   * d'environnement, suivie du segment '/auth'.
   * NOTE: Le segment '/auth' suggère que ces endpoints pourraient être regroupés
   * sous un chemin lié à l'authentification ou à des données non protégées.
   * Il faut vérifier que `${environment.apiUrl}/auth/stats` correspond bien à l'endpoint
   * réel de votre API pour les statistiques de la page d'accueil.
   */
  private apiUrl = environment.apiUrl + '/auth'; // Exemple: "https://api.example.com/api/auth"

  /**
   * Constructeur du service.
   * @param http Une instance injectée de `HttpClient`. Angular s'occupe de fournir
   *             cette instance. `private http` la rend disponible comme une propriété
   *             privée de la classe, utilisable par les méthodes du service.
   *             C'est la manière "classique" d'injecter des dépendances en Angular,
   *             alternative à la fonction `inject()` utilisée dans les services précédents.
   */
  constructor(private http: HttpClient) { }

  /**
   * Récupère les statistiques agrégées destinées à être affichées sur la page d'accueil.
   * Cette méthode effectue une requête GET vers l'endpoint `${this.apiUrl}/stats`
   * (par exemple, "https://api.example.com/api/auth/stats").
   *
   * @returns Un `Observable` qui, une fois souscrit, émettra un objet `HomepageStats`
   *          contenant les statistiques (ex: nombre de clubs, d'événements, de membres).
   */
  getHomepageStats(): Observable<HomepageStats> {
    // this.http.get<HomepageStats>(...)
    // - `this.http.get`: Effectue une requête HTTP GET.
    // - `<HomepageStats>`: Indique à HttpClient que la réponse attendue du serveur
    //                     doit correspondre à la structure de l'interface `HomepageStats`.
    // - `${this.apiUrl}/stats`: L'URL complète de l'endpoint API.
    //
    // Note: Ce service, dans sa forme actuelle, ne contient pas de gestion d'erreur
    //       explicite (pas de `.pipe(catchError(...))`). Si une erreur HTTP se produit,
    //       elle sera propagée à l'abonné (le composant qui appelle cette méthode).
    //       Le composant devra alors implémenter sa propre logique de `catchError`
    //       ou d'interception d'erreur s'il souhaite la gérer.
    //       Pour des raisons de cohérence, il pourrait être préférable d'ajouter ici
    //       une méthode `handleError` similaire à celle des autres services, ou de
    //       s'appuyer sur un intercepteur HTTP global pour la gestion des erreurs.
    return this.http.get<HomepageStats>(`${this.apiUrl}/stats`);
  }
}

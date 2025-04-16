// src/app/services/auth.service.ts
import {inject, Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Vérifier si l'utilisateur peut modifier les rôles
  canChangeRoles(): boolean {
    // return this.currentUser.role === 'admin';
  return true;
  }

  connecte = false;
  role: string | null = null;

  constructor() {
    const jwt = localStorage.getItem("jwt")
if(jwt != null){
    this.decodeJwt(jwt)
}
  }

  /**
   * Traite le JSON Web Token (JWT) reçu pour établir une session utilisateur.
   * Cette fonction stocke le token, décode sa charge utile (payload) pour extraire
   * les informations utilisateur (notamment le rôle), et met à jour l'état
   * de connexion de l'application.
   *
   * @param jwt La chaîne de caractères JWT reçue après une authentification réussie.
   */
  decodeJwt(jwt: string) {

    // 1. Stocker le JWT reçu dans le localStorage du navigateur.
    // Cela permet au token de persister lors des rechargements de page ou entre les sessions.
    localStorage.setItem("jwt", jwt);

    // 2. Diviser la chaîne JWT en ses trois composants (En-tête, Charge utile, Signature)
    // en utilisant le point (.) comme séparateur.
    const splitJwt = jwt.split(".");

    // 3. Récupérer la deuxième partie du JWT (index 1), qui correspond à la Charge utile (Payload).
    // La charge utile contient généralement les revendications (claims) sur l'utilisateur.
    const jwtBody = splitJwt[1];

    // 4. Décoder la chaîne de la Charge utile (Payload) qui est encodée en Base64Url.
    // La fonction atob() décode le Base64 standard. Des ajustements peuvent être nécessaires
    // si le serveur utilise strictement Base64Url (remplacement de '-' par '+' et '_' par '/').
    // Le résultat est une chaîne de caractères au format JSON.
    const jsonBody = atob(jwtBody);

    // 5. Analyser (parser) la chaîne JSON issue du décodage de la Charge utile.
    // Ceci transforme la chaîne en un objet JavaScript manipulable.
    const body = JSON.parse(jsonBody);

    // 6. Afficher la chaîne JSON décodée dans la console du navigateur.
    // Utile pour le débogage afin d'inspecter le contenu du token.
    // Afficher jsonBody est direct car c'est le résultat du décodage.
    console.log(jsonBody);

    // 7. Extraire la propriété 'role' de l'objet 'body' (la charge utile analysée).
    // Assigner cette valeur à la propriété 'role' de l'instance courante (this.role).
    // Permet d'utiliser le rôle de l'utilisateur dans d'autres parties de l'application.
    this.role = body.role;

    // 8. Mettre à jour la propriété booléenne 'connecte' de l'instance courante à 'true'.
    // Indique que le processus de connexion est terminé et que l'utilisateur est authentifié
    // du point de vue de l'état de l'application.
    this.connecte = true;
  }



  deconnexion(){
    localStorage.removeItem("jwt")
    this.connecte = false;
    this.role = null;
  }
}

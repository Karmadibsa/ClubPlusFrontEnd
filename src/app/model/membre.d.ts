/**
 * Importation du type RoleType.
 * L'interface Membre utilise RoleType pour typer la propriété 'role'.
 * Il est essentiel que RoleType soit correctement défini (par exemple, comme une union
 * de chaînes littérales ou un enum TypeScript : 'MEMBRE' | 'ADMIN' | 'RESERVATION', etc.)
 * et importé, reflétant les rôles utilisateurs décrits dans le projet [1].
 */
import { RoleType } from '../model/role'; // Assurez-vous que le chemin est correct et que RoleType est défini.

/**
 * @interface Membre
 * @description Représente un membre (utilisateur) de l'application "Club Plus".
 * Cette interface est utilisée pour afficher les informations d'un membre, que ce soit
 * dans des listes, des profils, ou d'autres contextes où les détails du membre sont requis [1].
 */
export interface Membre {
  /**
   * @property {number} id
   * @description Identifiant unique du membre, généré par le backend.
   */
  id: number;

  /**
   * @property {string} nom
   * @description Nom de famille du membre.
   */
  nom: string;

  /**
   * @property {string} prenom
   * @description Prénom du membre.
   */
  prenom: string;

  /**
   * @property {string} date_naissance
   * @description Date de naissance du membre.
   * Stockée sous forme de chaîne de caractères. Il est fortement recommandé d'utiliser
   * le format ISO 8601 "AAAA-MM-JJ" pour la cohérence et la facilité de manipulation.
   */
  date_naissance: string;

  /**
   * @property {string} date_inscription
   * @description Date à laquelle le membre s'est inscrit sur la plateforme.
   * Stockée sous forme de chaîne de caractères. Format ISO 8601
   * (ex: "AAAA-MM-JJTHH:mm:ssZ" ou "AAAA-MM-JJ") recommandé.
   */
  date_inscription: string;

  /**
   * @property {string} telephone
   * @description Numéro de téléphone du membre.
   * Il peut être pertinent d'ajouter des validations de format.
   */
  telephone: string;

  /**
   * @property {string} email
   * @description Adresse e-mail du membre.
   * Utilisée pour la connexion, les notifications, etc. Doit être unique et valide.
   */
  email: string;

  /**
   * @property {RoleType} role
   * @description Rôle attribué au membre au sein de l'application (ex: MEMBRE, ADMIN, RESERVATION).
   * Le type `RoleType` doit définir les rôles possibles [1]. La modification des rôles est
   * typiquement une fonction administrative [1].
   */
  role: RoleType;

  /**
   * @property {string} [codeAmi]
   * @description Code unique optionnel permettant à d'autres membres d'envoyer une demande d'ami.
   * Fait partie de la fonctionnalité sociale de l'application "Club Plus" [1].
   * Ce champ est optionnel (indiqué par `?`).
   */
  codeAmi?: string;
}


/**
 * @interface MembrePayload
 * @description Définit la structure des données requises pour créer un nouveau membre
 * ou potentiellement pour mettre à jour certaines informations d'un membre existant.
 * Ce payload est envoyé au backend lors de l'inscription d'un utilisateur ou
 * de la modification de son profil par un administrateur (partiellement) [1].
 * Ne contient pas l'ID (généré à la création) ni le rôle (géré séparément).
 */
export interface MembrePayload {
  /**
   * @property {string} nom
   * @description Nom de famille du membre.
   */
  nom: string;

  /**
   * @property {string} prenom
   * @description Prénom du membre.
   */
  prenom: string;

  /**
   * @property {string} date_naissance
   * @description Date de naissance du membre (format ISO "AAAA-MM-JJ").
   */
  date_naissance: string;

  /**
   * @property {string} telephone
   * @description Numéro de téléphone du membre.
   */
  telephone: string;

  /**
   * @property {string} email
   * @description Adresse e-mail du membre (doit être unique).
   */
  email: string;

  /**
   * @property {string} [password]
   * @description Mot de passe pour le nouveau compte membre, ou pour une mise à jour de mot de passe.
   * Ce champ est optionnel (`?`) car il n'est pas toujours requis (ex: modification de profil
   * par un admin qui ne change pas le mot de passe, ou si le mot de passe est défini via un autre flux).
   * Le backend se chargera de hacher ce mot de passe avant de le stocker [1].
   */
  password?: string;
}

/**
 * @interface Club
 * @description Représente les informations détaillées d'un club sportif enregistré dans l'application.
 * Cette interface est typiquement utilisée pour afficher les données d'un club,
 * que ce soit dans une liste, une page de détail, ou dans des sections administratives.
 */
export interface Club {
  /**
   * @property {number} id
   * @description Identifiant unique du club, généré par le backend lors de sa création.
   */
  id: number;

  /**
   * @property {string} nom
   * @description Nom officiel du club sportif.
   */
  nom: string;

  /**
   * @property {string} date_creation
   * @description Date de création officielle du club.
   * Il est recommandé de stocker les dates au format ISO 8601 (ex: "AAAA-MM-JJ").
   */
  date_creation: string;

  /**
   * @property {string} date_inscription
   * @description Date à laquelle le club a été enregistré dans l'application "Club Plus".
   */
  date_inscription: string;

  /**
   * @property {string} numero_voie
   * @description Numéro dans la voie (ex: "10bis", "25").
   */
  numero_voie: string;

  /**
   * @property {string} rue
   * @description Nom de la rue, avenue, boulevard, etc. de l'adresse du club.
   */
  rue: string;

  /**
   * @property {string} codepostal
   * @description Code postal de la ville où se situe le club.
   */
  codepostal: string;

  /**
   * @property {string} ville
   * @description Ville où se situe le club.
   */
  ville: string;

  /**
   * @property {string} telephone
   * @description Numéro de téléphone principal du club.
   * Il peut être pertinent de valider/formater ce numéro.
   */
  telephone: string;

  /**
   * @property {string} email
   * @description Adresse e-mail de contact principale du club.
   * Doit être une adresse e-mail valide.
   */
  email: string;

  /**
   * @property {string} [codeClub]
   * @description Code unique optionnel attribué au club après son inscription.
   * Ce code peut être utilisé par les membres pour s'associer à leur club [1].
   * Optionnel (indiqué par `?`) car il pourrait ne pas être immédiatement disponible ou applicable.
   */
  codeClub?: string;

  /**
   * @property {boolean} actif
   * @description Indique si le club est actuellement actif dans le système.
   * Un club inactif pourrait ne plus pouvoir créer d'événements ou accepter de nouveaux membres.
   */
  actif: boolean;

  /**
   * @property {string | null} [desactivationDate]
   * @description Date à laquelle le club a été désactivé, si applicable.
   * Optionnel (indiqué par `?`) et peut être `null` si le club est actif ou n'a jamais été désactivé.
   */
  desactivationDate?: string | null;
}

/**
 * @interface ClubAdminPayload
 * @description Définit la structure des données pour les informations personnelles
 * de l'administrateur initial lors de l'enregistrement d'un nouveau club.
 * Ces informations sont utilisées pour créer le premier compte utilisateur administrateur
 * associé au club.
 * Cette interface est conçue pour être imbriquée dans `ClubRegistrationPayload`.
 */
interface ClubAdminPayload {
  /**
   * @property {string} nom
   * @description Nom de famille de l'administrateur du club.
   */
  nom: string;

  /**
   * @property {string} prenom
   * @description Prénom de l'administrateur du club.
   */
  prenom: string;

  /**
   * @property {string} date_naissance
   * @description Date de naissance de l'administrateur.
   */
  date_naissance: string;

  /**
   * @property {string} numero_voie
   * @description Numéro dans la voie de l'adresse personnelle de l'administrateur.
   */
  numero_voie: string;

  /**
   * @property {string} rue
   * @description Nom de la rue de l'adresse personnelle de l'administrateur.
   */
  rue: string;

  /**
   * @property {string} codepostal
   * @description Code postal de l'adresse personnelle de l'administrateur.
   */
  codepostal: string;

  /**
   * @property {string} ville
   * @description Ville de l'adresse personnelle de l'administrateur.
   */
  ville: string;

  /**
   * @property {string} telephone
   * @description Numéro de téléphone personnel de l'administrateur.
   */
  telephone: string;

  /**
   * @property {string} email
   * @description Adresse e-mail personnelle de l'administrateur.
   * Utilisée pour la connexion et les communications. Doit être unique.
   */
  email: string;

  /**
   * @property {string} [password]
   * @description Mot de passe choisi par l'administrateur pour son compte.
   * Ce champ est optionnel (`?`) ici car, selon le flux d'inscription,
   * Il sera haché avant d'être stocké en base de données.
   */
  password?: string;
}

/**
 * @interface ClubRegistrationPayload
 * @description Définit la structure des données requises pour enregistrer un nouveau club
 * dans l'application "Club Plus".
 * Ce payload combine les informations du club lui-même et les informations
 * de son premier administrateur.
 * Il est envoyé au backend pour créer à la fois l'entité Club et l'utilisateur Admin associé.
 */
export interface ClubRegistrationPayload {
  /**
   * @property {string} nom
   * @description Nom du nouveau club à enregistrer.
   */
  nom: string;

  /**
   * @property {string} date_creation
   * @description Date de création officielle du club.
   */
  date_creation: string;

  /**
   * @property {string} numero_voie
   * @description Numéro dans la voie de l'adresse du club.
   */
  numero_voie: string;

  /**
   * @property {string} rue
   * @description Nom de la rue de l'adresse du club.
   */
  rue: string;

  /**
   * @property {string} codepostal
   * @description Code postal de l'adresse du club.
   */
  codepostal: string;

  /**
   * @property {string} ville
   * @description Ville de l'adresse du club.
   */
  ville: string;

  /**
   * @property {string} telephone
   * @description Numéro de téléphone principal du club.
   */
  telephone: string;

  /**
   * @property {string} email
   * @description Adresse e-mail de contact principale du club.
   * Cette adresse e-mail est spécifique au club, et distincte de celle de l'administrateur.
   */
  email: string;

  /**
   * @property {ClubAdminPayload} admin
   * @description Objet contenant les informations du premier administrateur du club.
   * Ces informations seront utilisées pour créer un compte utilisateur avec le rôle d'administrateur
   * pour ce club.
   */
  admin: ClubAdminPayload;
}

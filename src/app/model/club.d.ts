/**
 * @interface Club
 * @description Représente les informations détaillées d'un club sportif.
 * Utilisée pour l'affichage (listes, pages de détail, sections administratives).
 */
export interface Club {
  /** Identifiant unique du club, généré par le backend. */
  id: number;

  /** Nom officiel du club sportif. */
  nom: string;

  /** Date de création officielle du club (format ISO 8601 recommandé). */
  date_creation: string;

  /** Date d'enregistrement du club dans l'application. */
  date_inscription: string;

  /** Numéro de voie de l'adresse (ex: "10bis"). */
  numero_voie: string;

  /** Nom de la rue de l'adresse du club. */
  rue: string;

  /** Code postal de l'adresse du club. */
  codepostal: string;

  /** Ville de l'adresse du club. */
  ville: string;

  /** Numéro de téléphone principal du club. */
  telephone: string;

  /** Adresse e-mail de contact principale du club. */
  email: string;

  /** Code unique optionnel attribué au club (pour association des membres). Optionnel. */
  codeClub?: string;

  /** Indique si le club est actif dans le système. */
  actif: boolean;

  /** Date de désactivation du club (si applicable). Optionnel et peut être `null`. */
  desactivationDate?: string | null;
}

/**
 * @interface ClubAdminPayload
 * @description Définit la structure des données de l'administrateur initial lors de l'enregistrement d'un club.
 * Utilisée pour créer le premier compte admin. Imbriquée dans `ClubRegistrationPayload`.
 */
interface ClubAdminPayload {
  /** Nom de famille de l'administrateur. */
  nom: string;

  /** Prénom de l'administrateur. */
  prenom: string;

  /** Date de naissance de l'administrateur. */
  date_naissance: string;

  /** Numéro de téléphone personnel de l'administrateur. */
  telephone: string;

  /** Adresse e-mail personnelle de l'administrateur (pour connexion, unique). */
  email: string;

  /** Mot de passe de l'administrateur. Optionnel (sera haché par le backend). */
  password?: string;
}

/**
 * @interface ClubRegistrationPayload
 * @description Définit la structure des données pour enregistrer un nouveau club.
 * Combine les informations du club et de son administrateur. Envoyé au backend pour créer le Club et l'utilisateur Admin.
 */
export interface ClubRegistrationPayload {
  /** Nom du nouveau club. */
  nom: string;

  /** Date de création officielle du club. */
  date_creation: string;

  /** Numéro de voie de l'adresse du club. */
  numero_voie: string;

  /** Nom de la rue de l'adresse du club. */
  rue: string;

  /** Code postal de l'adresse du club. */
  codepostal: string;

  /** Ville de l'adresse du club. */
  ville: string;

  /** Numéro de téléphone principal du club. */
  telephone: string;

  /** Adresse e-mail de contact principale du club (distincte de celle de l'admin). */
  email: string;

  /** Informations du premier administrateur du club (pour création de compte admin). */
  admin: ClubAdminPayload;
}

import { RoleType } from '../model/role';

/**
 * @interface Membre
 * @description Représente un membre (utilisateur) de l'application "Club Plus".
 * Utilisée pour afficher les informations d'un membre (listes, profils).
 */
export interface Membre {
  /** Identifiant unique du membre. */
  id: number;

  /** Nom de famille du membre. */
  nom: string;

  /** Prénom du membre. */
  prenom: string;

  /** Date de naissance du membre (format ISO 8601 "AAAA-MM-JJ" recommandé). */
  date_naissance: string;

  /** Date d'inscription du membre sur la plateforme (format ISO 8601 recommandé). */
  date_inscription: string;

  /** Numéro de téléphone du membre. */
  telephone: string;

  /** Adresse e-mail du membre (unique et valide, utilisée pour la connexion). */
  email: string;

  /** Rôle attribué au membre (ex: 'MEMBRE', 'ADMIN'). */
  role: RoleType;

  /** Code unique optionnel pour les demandes d'ami. */
  codeAmi?: string;
}


/**
 * @interface MembrePayload
 * @description Définit la structure des données pour créer ou mettre à jour un membre.
 * Envoyé au backend lors de l'inscription ou de la modification de profil.
 */
export interface MembrePayload {
  /** Nom de famille du membre. */
  nom: string;

  /** Prénom du membre. */
  prenom: string;

  /** Date de naissance du membre (format ISO "AAAA-MM-JJ"). */
  date_naissance: string;

  /** Numéro de téléphone du membre. */
  telephone: string;

  /** Adresse e-mail du membre (doit être unique). */
  email: string;

  /** Mot de passe du compte membre (optionnel, haché par le backend). */
  password?: string;
}

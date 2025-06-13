/**
 * @type RoleType
 * @description Définit un type alias pour les rôles utilisateurs possibles dans l'application "Club Plus".
 * Garantit la sécurité de type et la clarté pour l'attribution et la vérification des rôles.
 * Fondamental pour le contrôle d'accès basé sur les rôles (RBAC).
 */
export type RoleType =
/** Rôle standard pour un utilisateur authentifié. */
  | 'MEMBRE'

  /** Rôle pour la gestion des événements et réservations d'un club. */
  | 'RESERVATION'

  /** Rôle avec les privilèges les plus élevés pour la gestion d'un club. */
  | 'ADMIN'

  /** Représente un utilisateur non authentifié ou un visiteur public. */
  | 'ANONYME';

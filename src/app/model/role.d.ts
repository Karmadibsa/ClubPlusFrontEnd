/**
 * @type RoleType
 * @description Définit un type alias pour les rôles utilisateurs possibles au sein de l'application "Club Plus".
 * L'utilisation d'une union de types littéraux (chaînes de caractères spécifiques) garantit
 * la sécurité de type et la clarté lors de l'attribution ou de la vérification des rôles
 * des utilisateurs.
 *
 * Ces rôles déterminent les fonctionnalités accessibles par un utilisateur et sont
 * fondamentaux pour le contrôle d'accès basé sur les rôles (RBAC) implémenté
 * dans l'application [1].
 */
export type RoleType =
/**
 * @value 'MEMBRE'
 * @description Rôle standard pour un utilisateur authentifié.
 * Les membres peuvent généralement consulter les événements des clubs auxquels ils adhèrent,
 * effectuer des réservations (limitées, par exemple, à deux places par événement),
 * gérer leur profil, et interagir avec les fonctionnalités sociales comme la gestion des amis [1].
 */
  | 'MEMBRE'

  /**
   * @value 'RESERVATION'
   * @description Rôle attribué à un utilisateur responsable de la gestion des événements et
   * des réservations pour un club spécifique (souvent appelé "Gestionnaire Réservation").
   * Ce rôle permet de créer, modifier et annuler des événements, de consulter les réservations
   * pour son club, et d'accéder aux statistiques du club.
   * Il ne peut généralement pas modifier les informations du club lui-même ni les rôles d'autres utilisateurs [1].
   */
  | 'RESERVATION'

  /**
   * @value 'ADMIN'
   * @description Rôle avec les privilèges les plus élevés pour la gestion d'un club.
   * Un administrateur hérite des capacités du rôle 'RESERVATION' (gestion des événements et réservations)
   * et peut en plus modifier les informations de son club, gérer les adhésions des membres à son club,
   * et gérer les rôles des utilisateurs au sein de son club (promouvoir/rétrograder) [1].
   */
  | 'ADMIN'

  /**
   * @value 'ANONYME'
   * @description Représente un utilisateur non authentifié ou un visiteur public.
   * Les utilisateurs avec ce statut (ou l'absence de rôle authentifié) ont typiquement
   * accès uniquement à la section publique de l'application (présentation, informations de contact, etc.)
   * et doivent se connecter ou s'inscrire pour accéder aux fonctionnalités réservées aux membres [1].
   * Ce rôle est souvent implicite (pas de session utilisateur active) plutôt qu'explicitement stocké.
   */
  | 'ANONYME';

/**
 * Importation du modèle Evenement.
 * L'interface Notation est directement liée à un événement spécifique.
 * Il est essentiel que l'interface Evenement soit correctement définie et importée
 * pour typer la propriété 'event'.
 */
import { Evenement } from './evenement'; // Assurez-vous que ce chemin est correct et qu'Evenement est défini.

/**
 * @interface Notation
 * @description Représente une évaluation complète d'un événement, telle qu'elle pourrait être
 * stockée en base de données et récupérée via l'API.
 * Cette interface correspond probablement à une entité Java `Notation` dans votre backend [2].
 * Elle inclut non seulement les notes pour divers critères mais aussi des métadonnées
 * comme l'identifiant de la notation, l'événement concerné, et la date de notation.
 */
export interface Notation {
  /**
   * @property {number} id
   * @description Identifiant unique de cette notation spécifique, généré par le backend.
   */
  id: number;

  /**
   * @property {Evenement} event
   * @description L'événement qui a été noté.
   * L'objet `Evenement` contiendra les informations de l'événement concerné.
   * Selon la définition de l'interface `Evenement` et l'implémentation de l'API,
   * il peut s'agir d'un objet `Evenement` complet ou d'une représentation partielle
   * (par exemple, contenant uniquement l'ID et le nom de l'événement).
   */
  event: Evenement;

  /**
   * @property {number} ambiance
   * @description Note attribuée pour le critère "ambiance" de l'événement.
   * La plage de notation (ex: 1 à 5, 0 à 10) devrait être définie et validée.
   */
  ambiance: number;

  /**
   * @property {number} proprete
   * @description Note attribuée pour le critère "propreté" des lieux de l'événement.
   */
  proprete: number;

  /**
   * @property {number} organisation
   * @description Note attribuée pour le critère "organisation" générale de l'événement.
   */
  organisation: number;

  /**
   * @property {number} fairPlay
   * @description Note attribuée pour le critère "fair-play" observé durant l'événement.
   * Ce critère est particulièrement pertinent pour les événements sportifs.
   */
  fairPlay: number;

  /**
   * @property {number} niveauJoueurs
   * @description Note attribuée pour le critère "niveau des joueurs/participants" à l'événement.
   */
  niveauJoueurs: number;

  /**
   * @property {string} dateNotation
   * @description Date et heure à laquelle la notation a été soumise ou enregistrée.
   * Il est fortement recommandé d'utiliser le format ISO 8601 (ex: "AAAA-MM-JJTHH:mm:ssZ").
   */
  dateNotation: string;

  /**
   * @property {number} noteMoyenne
   * @description La note moyenne calculée à partir des différents critères de notation.
   * Ce calcul peut être effectué soit par le backend lors de l'enregistrement/récupération,
   * soit potentiellement par le frontend si nécessaire (bien que le backend soit généralement préférable
   * pour la cohérence).
   */
  noteMoyenne: number;
}

/**
 * @interface EventRatingPayload
 * @description Définit la structure des données envoyées par un utilisateur lorsqu'il soumet
 * une notation pour un événement.
 * Ce "payload" contient uniquement les notes pour les critères évaluables par l'utilisateur.
 * L'identifiant de l'événement auquel cette notation s'applique sera généralement transmis
 * séparément (par exemple, dans l'URL de l'API : `/api/events/{eventId}/ratings`).
 * L'utilisation du mot-clé `export` la rend importable et utilisable dans d'autres fichiers TypeScript.
 */
export interface EventRatingPayload {
  /**
   * @property {number} ambiance
   * @description Note pour l'ambiance (valeur soumise par l'utilisateur).
   */
  ambiance: number;

  /**
   * @property {number} proprete
   * @description Note pour la propreté (valeur soumise par l'utilisateur).
   */
  proprete: number;

  /**
   * @property {number} organisation
   * @description Note pour l'organisation (valeur soumise par l'utilisateur).
   */
  organisation: number;

  /**
   * @property {number} fairPlay
   * @description Note pour le fair-play (valeur soumise par l'utilisateur).
   */
  fairPlay: number;

  /**
   * @property {number} niveauJoueurs
   * @description Note pour le niveau des joueurs (valeur soumise par l'utilisateur).
   */
  niveauJoueurs: number;
}

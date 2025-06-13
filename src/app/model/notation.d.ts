import { Evenement } from './evenement';

/**
 * @interface Notation
 * @description Représente une évaluation complète d'un événement, stockée et récupérée via l'API.
 * Inclut les notes par critères et métadonnées.
 */
export interface Notation {
  /** Identifiant unique de cette notation. */
  id: number;

  /** L'événement qui a été noté. */
  event: Evenement;

  /** Note pour le critère "ambiance". */
  ambiance: number;

  /** Note pour le critère "propreté". */
  proprete: number;

  /** Note pour le critère "organisation". */
  organisation: number;

  /** Note pour le critère "fair-play" (pertinent pour les événements sportifs). */
  fairPlay: number;

  /** Note pour le critère "niveau des joueurs/participants". */
  niveauJoueurs: number;

  /** Date et heure de soumission de la notation (format ISO 8601 recommandé). */
  dateNotation: string;

  /** Note moyenne calculée à partir des critères. */
  noteMoyenne: number;
}

/**
 * @interface EventRatingPayload
 * @description Définit la structure des données envoyées par un utilisateur pour noter un événement.
 * Contient uniquement les notes pour les critères évaluables.
 */
export interface EventRatingPayload {
  /** Note pour l'ambiance (valeur soumise par l'utilisateur). */
  ambiance: number;

  /** Note pour la propreté (valeur soumise par l'utilisateur). */
  proprete: number;

  /** Note pour l'organisation (valeur soumise par l'utilisateur). */
  organisation: number;

  /** Note pour le fair-play (valeur soumise par l'utilisateur). */
  fairPlay: number;

  /** Note pour le niveau des joueurs (valeur soumise par l'utilisateur). */
  niveauJoueurs: number;
}

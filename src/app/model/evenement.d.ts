import { Categorie, CategorieCreatePayload, CategorieUpdatePayload } from './categorie';
import { Club } from './club';

/**
 * @interface Evenement
 * @description Représente un événement tel que récupéré de l'API et affiché.
 * Structure les informations essentielles, les catégories de places, et le club organisateur.
 */
export interface Evenement {
  /** Identifiant unique de l'événement. */
  id: number;

  /** Nom de l'événement (ex: "Tournoi de Printemps"). */
  nom: string;

  /** Date et heure de début de l'événement (format ISO 8601 recommandé). */
  startTime: string;

  /** Date et heure de fin de l'événement (format ISO 8601 recommandé). */
  endTime: string;

  /** Description détaillée de l'événement. */
  description: string;

  /** Lieu où se déroule l'événement. Optionnel. */
  location?: string;

  /** Indique si l'événement est actif et visible/ouvert aux réservations. */
  actif: boolean;

  /** Nombre total de places disponibles (calculé par le backend). Optionnel. */
  placeTotal?: number;

  /** Nombre total de places actuellement réservées (calculé par le backend). Optionnel. */
  placeReserve?: number;

  /** Liste des noms (ou identifiants) des amis de l'utilisateur participant à l'événement. Optionnel. */
  amiParticipants?: string[];

  /** Liste des catégories de places associées à cet événement. */
  categories: Categorie[];

  /** Le club qui organise l'événement. */
  organisateur: Club;
}

/**
 * @interface CreateEventPayload
 * @description Définit la structure des données requises pour créer un nouvel événement.
 * Envoyé au backend. Inclut les infos de base et les catégories à créer pour cet événement.
 */
export interface CreateEventPayload {
  /** Nom du nouvel événement. */
  nom: string;

  /** Date et heure de début de l'événement (format ISO 8601). */
  startTime: string;

  /** Date et heure de fin de l'événement (format ISO 8601). */
  endTime: string;

  /** Description détaillée du nouvel événement. */
  description: string;

  /** Lieu optionnel de l'événement. */
  location?: string;

  /** Liste des nouvelles catégories à créer et associer à cet événement. */
  categories: CategorieCreatePayload[];
}

/**
 * @interface UpdateEventPayload
 * @description Définit la structure des données pour la mise à jour complète d'un événement existant.
 * Envoyé au backend. Permet de modifier les infos de base et gérer la liste complète des catégories.
 */
export interface UpdateEventPayload {
  /** Nouveau nom de l'événement. */
  nom: string;

  /** Nouvelle date et heure de début (format ISO 8601). */
  startTime: string;

  /** Nouvelle date et heure de fin (format ISO 8601). */
  endTime: string;

  /** Nouvelle description détaillée. */
  description: string;

  /** Nouveau lieu (ou absence de lieu). */
  location?: string;

  /** Liste FINALE des catégories pour cet événement après mise à jour. */
  categories: CategorieUpdatePayload[];
}

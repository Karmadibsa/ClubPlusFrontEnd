import { Categorie, CategorieCreatePayload, CategorieUpdatePayload } from './categorie'; // Assurez-vous que ce chemin est correct et que les interfaces de Categorie sont bien exportées.
import { Club } from './club'; // Assurez-vous que ce chemin est correct et que Club est défini.

/**
 * @interface Evenement
 * @description Représente un événement tel qu'il est récupéré de l'API et affiché dans l'application.
 * Cette interface structure les informations essentielles d'un événement, y compris les détails
 * de base, son état, les catégories de places associées, et le club organisateur.
 * Elle est conçue pour l'affichage et la lecture des données d'événement, en excluant potentiellement
 * des listes très volumineuses ou des relations complexes non directement pertinentes pour
 * une vue d'ensemble ou un formulaire principal.
 */
export interface Evenement {
  /**
   * @property {number} id
   * @description Identifiant unique de l'événement, généré par le backend.
   */
  id: number;

  /**
   * @property {string} nom
   * @description Nom de l'événement (ex: "Tournoi de Printemps", "Match Gala").
   * Correspond à la propriété `nom_event` potentiellement utilisée dans d'autres contextes ou versions.
   */
  nom: string;

  /**
   * @property {string} startTime
   * @description Date et heure de début de l'événement.
   * Doit être une chaîne de caractères au format ISO 8601 (ex: "2025-07-10T09:00:00Z" ou "2025-07-10T09:00:00").
   * L'utilisation de l'heure UTC (avec 'Z') est recommandée pour éviter les ambiguïtés de fuseau horaire.
   */
  startTime: string;

  /**
   *
   * @property {string} endTime
   * @description Date et heure de fin de l'événement.
   * Doit également être une chaîne de caractères au format ISO 8601.
   */
  endTime: string;

  /**
   * @property {string} description
   * @description Description détaillée de l'événement.
   */
  description: string;

  /**
   * @property {string} [location]
   * @description Lieu où se déroule l'événement (ex: "Stade Municipal", "Gymnase A").
   * Ce champ est optionnel (indiqué par `?`).
   */
  location?: string;

  /**
   * @property {boolean} actif
   * @description Indique si l'événement est actuellement actif et visible/ouvert aux réservations.
   * Un événement inactif pourrait être une ébauche, un événement passé ou annulé.
   */
  actif: boolean;

  /**
   * @property {number} [placeTotal]
   * @description Nombre total de places disponibles pour cet événement, toutes catégories confondues.
   * Ce champ est optionnel et est généralement calculé par le backend.
   */
  placeTotal?: number;

  /**
   * @property {number} [placeReserve]
   * @description Nombre total de places actuellement réservées pour cet événement.
   * Ce champ est optionnel et est également calculé par le backend.
   */
  placeReserve?: number;

  /**
   * @property {string[]} [amiParticipants]
   * @description Liste des noms (ou identifiants) des amis de l'utilisateur connecté qui participent
   * ou ont réservé pour cet événement.
   * Relatif à la fonctionnalité sociale de l'application "Club Plus" [1]. Ce champ est optionnel.
   */
  amiParticipants?: string[];

  /**
   * @property {Categorie[]} categories
   * @description Liste des catégories de places associées à cet événement.
   * Chaque objet `Categorie` contiendra les détails de la catégorie (nom, capacité, places dispo, etc.) [1].
   */
  categories: Categorie[];

  /**
   * @property {Club} organisateur
   * @description Le club qui organise l'événement.
   * L'objet `Club` contiendra les informations du club organisateur [1].
   * (Note: le commentaire initial mentionnait 'Organizer', mais le type est `Club`, ce qui est cohérent).
   */
  organisateur: Club;
}

/**
 * @interface CreateEventPayload
 * @description Définit la structure des données requises pour créer un nouvel événement.
 * Ce payload est envoyé au backend (par exemple, via une requête POST sur `/api/events`) [1].
 * Il inclut les informations de base de l'événement et une liste des catégories
 * à créer spécifiquement pour cet événement.
 */
export interface CreateEventPayload {
  /**
   * @property {string} nom
   * @description Nom du nouvel événement.
   */
  nom: string;

  /**
   * @property {string} start
   * @description Date et heure de début de l'événement (format ISO 8601).
   */
  startTime: string;

  /**
   * @property {string} end
   * @description Date et heure de fin de l'événement (format ISO 8601).
   */
  endTime: string;

  /**
   * @property {string} description
   * @description Description détaillée du nouvel événement.
   */
  description: string;

  /**
   * @property {string} [location]
   * @description Lieu optionnel de l'événement.
   */
  location?: string;

  /**
   * @property {CategorieCreatePayload[]} categories
   * @description Liste des nouvelles catégories à créer et associer à cet événement.
   * Chaque objet dans ce tableau suivra la structure `CategorieCreatePayload` (sans ID).
   */
  categories: CategorieCreatePayload[];
}

/**
 * @interface UpdateEventPayload
 * @description Définit la structure des données pour la mise à jour complète d'un événement existant.
 * Ce payload est envoyé au backend (par exemple, via une requête PUT sur `/api/events/{id}/full`) [1].
 * Il permet de modifier les informations de base de l'événement et de gérer la liste
 * complète de ses catégories (modification des existantes, ajout de nouvelles, suppression de celles non listées).
 */
export interface UpdateEventPayload {
  /**
   * @property {string} nom
   * @description Nouveau nom de l'événement (ou nom actuel s'il n'est pas modifié).
   */
  nom: string;

  /**
   * @property {string} start
   * @description Nouvelle date et heure de début (format ISO 8601).
   */
  startTime: string;

  /**
   * @property {string} end
   * @description Nouvelle date et heure de fin (format ISO 8601).
   */
  endTime: string;

  /**
   * @property {string} description
   * @description Nouvelle description détaillée.
   */
  description: string;

  /**
   * @property {string} [location]
   * @description Nouveau lieu (ou absence de lieu si `undefined` ou non fourni et que le champ est optionnel).
   */
  location?: string;

  /**
   * @property {CategorieUpdatePayload[]} categories
   * @description Liste FINALE des catégories pour cet événement après mise à jour.
   * - Les catégories existantes à modifier doivent inclure leur `id`.
   * - Les nouvelles catégories à créer doivent avoir un `id` à `null`.
   * - Les catégories existantes qui ne sont PAS incluses dans cette liste sont généralement
   *   supposées être supprimées par le backend (si la logique de mise à jour complète le gère ainsi).
   * Chaque objet suit la structure `CategorieUpdatePayload`.
   */
  categories: CategorieUpdatePayload[];
}

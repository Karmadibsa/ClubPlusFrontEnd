import {Categorie} from './categorie'; // Assurez-vous que ce chemin est correct
import {Club} from './club'; // Assurez-vous que ce chemin est correct


/**
 * Représente un Événement tel que reçu de l'API ou affiché.
 * Contient les informations essentielles et la liste des catégories associées.
 * Exclut les listes volumineuses ou les relations complexes non pertinentes pour l'affichage/formulaire principal.
 */
export interface Evenement {
  id: number;
  nom: string; // Correspond à nom_event
  start: string; // Format ISO String (ex: "2025-07-10T09:00:00")
  end: string;   // Format ISO String
  description: string;
  location?: string; // Optionnel
  actif: boolean; // État de l'événement
  // Liste des catégories associées (structure simplifiée)
  // Champs calculés potentiellement retournés par l'API
  placeTotal?: number;
  placeReserve?: number;
  amiParticipants?: string[];
  categories: Categorie[];
  // Présents dans les deux versions selon vos JSON et backend
  organisateur: Club; // Utilise l'interface Organizer
}

/**
 * Payload complet pour la création d'un événement via POST /api/events.
 */
export interface CreateEventPayload {
  nom: string;
  start: string; // Format ISO String (ex: "2025-07-10T09:00:00")
  end: string;
  description: string;
  location?: string;
  categories: CategorieCreatePayload[]; // Liste des catégories à créer
}

/**
 * Payload complet pour la mise à jour d'un événement via PUT /api/events/{id}/full.
 */
export interface UpdateEventPayload {
  nom: string;
  start: string; // Format ISO String
  end: string;
  description: string;
  location?: string;
  categories: CategorieUpdatePayload[]; // Liste FINALE des catégories (avec ID pour celles existantes)
}

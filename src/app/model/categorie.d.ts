/**
 * Représente une Catégorie telle que reçue de l'API ou affichée.
 * Ne contient PAS de référence circulaire à l'événement complet ni la liste des réservations.
 */
export interface Categorie {
  id: number; // L'ID est fourni par le backend pour les catégories existantes
  nom: string;
  capacite: number;
  // Champs calculés potentiellement retournés par l'API (dépend de @JsonView)
  placeReserve?: number;
  placeDisponible?: number;
}


/**
 * Payload pour la création d'une catégorie (utilisé DANS CreateEventPayload).
 * Pas d'ID car elle est nouvelle.
 */
export interface CategorieCreatePayload {
  nom: string;
  capacite: number;
}

/**
 * Payload pour une catégorie lors de la mise à jour complète d'un événement.
 * L'ID est crucial pour la réconciliation backend (null = création).
 */
export interface CategorieUpdatePayload {
  id: number | null; // Null pour indiquer une nouvelle catégorie à créer
  nom: string;
  capacite: number;
}

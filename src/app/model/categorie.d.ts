/**
 * @interface Categorie
 * @description Représente une catégorie d'emplacement pour un événement, telle que retournée par l'API.
 * Utilisée pour l'affichage des détails. Conçue pour une structure simple, sans références circulaires.
 * Les champs optionnels sont calculés par le backend.
 */
export interface Categorie {
  /** Identifiant unique de la catégorie. */
  id: number;

  /** Nom de la catégorie (ex: "Tribune Nord"). */
  nom: string;

  /** Capacité totale de la catégorie pour un événement. */
  capacite: number;

  /** Nombre de places réservées dans cette catégorie. Optionnel, car peut être non fourni par l'API. */
  placeReserve?: number;

  /** Nombre de places disponibles (`capacite - placeReserve`). Optionnel. */
  placeDisponible?: number;
}


/**
 * @interface CategorieCreatePayload
 * @description Définit la structure des données pour créer une nouvelle catégorie.
 * Utilisée dans un payload plus large, par exemple lors de la création d'un événement.
 * L'identifiant est généré par le backend.
 */
export interface CategorieCreatePayload {
  /** Nom de la nouvelle catégorie. */
  nom: string;

  /** Capacité de la nouvelle catégorie. */
  capacite: number;
}

/**
 * @interface CategorieUpdatePayload
 * @description Définit la structure des données pour mettre à jour une catégorie d'une entité parente.
 * Cruciale pour les mises à jour où des catégories existantes sont modifiées ou de nouvelles ajoutées.
 */
export interface CategorieUpdatePayload {
  /** Identifiant de la catégorie. `number` pour une mise à jour existante, `null` pour une nouvelle catégorie.
   * Le backend utilise cet `id` pour la réconciliation.
   */
  id: number | null;

  /** Nouveau nom de la catégorie. */
  nom: string;

  /** Nouvelle capacité de la catégorie. */
  capacite: number;
}

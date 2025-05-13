/**
 * @interface Categorie
 * @description Représente une catégorie d'emplacement pour un événement, telle que définie
 * et potentiellement retournée par l'API.
 * Cette interface est typiquement utilisée pour afficher les détails d'une catégorie.
 * Elle est conçue pour être une structure de données simple, évitant les références
 * circulaires (par exemple, un lien direct vers l'événement parent complet ou la liste
 * des réservations associées), ce qui simplifie la sérialisation et la gestion des données.
 * Les champs optionnels comme `placeReserve` et `placeDisponible` peuvent être calculés
 * et retournés par le backend.
 */
export interface Categorie {
  /**
   * @property {number} id
   * @description Identifiant unique de la catégorie.
   * Généralement assigné et fourni par le système backend lors de la création
   * ou de la récupération d'une catégorie existante.
   */
  id: number;

  /**
   * @property {string} nom
   * @description Nom descriptif de la catégorie (ex: "Tribune Nord", "VIP", "Pelouse").
   */
  nom: string;

  /**
   * @property {number} capacite
   * @description Nombre total de places disponibles dans cette catégorie pour un événement donné.
   */
  capacite: number;

  /**
   * @property {number} [placeReserve]
   * @description Nombre de places actuellement réservées dans cette catégorie.
   * Ce champ est optionnel (indiqué par `?`) car il peut ne pas toujours être fourni,
   * notamment si l'information n'est pas requise ou calculée pour un contexte d'affichage donné.
   */
  placeReserve?: number;

  /**
   * @property {number} [placeDisponible]
   * @description Nombre de places encore disponibles à la réservation dans cette catégorie.
   * Calculé typiquement comme `capacite - placeReserve`.
   * Ce champ est également optionnel.
   */
  placeDisponible?: number;
}


/**
 * @interface CategorieCreatePayload
 * @description Définit la structure des données requises pour créer une nouvelle catégorie.
 * Cette interface est typiquement utilisée comme partie d'un payload plus large,
 * par exemple, lors de la création d'un événement qui inclut la définition de ses catégories (`CreateEventPayload`) [1].
 * Elle ne contient pas d'identifiant (`id`) car celui-ci sera généré par le backend
 * lors de la création effective de la ressource.
 */
export interface CategorieCreatePayload {
  /**
   * @property {string} nom
   * @description Nom de la nouvelle catégorie à créer.
   */
  nom: string;

  /**
   * @property {number} capacite
   * @description Capacité totale de la nouvelle catégorie.
   */
  capacite: number;
}

/**
 * @interface CategorieUpdatePayload
 * @description Définit la structure des données pour une catégorie lors de la mise à jour
 * d'une entité parente (par exemple, un événement).
 * Cette interface est cruciale pour les opérations de mise à jour "complètes" ou "partielles"
 * où des catégories existantes peuvent être modifiées, ou de nouvelles catégories ajoutées
 * au sein de la même transaction.
 */
export interface CategorieUpdatePayload {
  /**
   * @property {number | null} id
   * @description Identifiant de la catégorie.
   * - Si `id` est un `number` (existant), il indique une catégorie existante à mettre à jour.
   * - Si `id` est `null`, il signale au backend qu'une nouvelle catégorie doit être créée
   *   dans le contexte de la mise à jour de l'entité parente. Ce pattern est courant
   *   pour gérer des sous-entités imbriquées lors d'une mise à jour.
   * Le backend utilise cet `id` pour la réconciliation des données.
   */
  id: number | null;

  /**
   * @property {string} nom
   * @description Nouveau nom de la catégorie (si modifié) ou nom de la nouvelle catégorie.
   */
  nom: string;

  /**
   * @property {number} capacite
   * @description Nouvelle capacité de la catégorie (si modifiée) ou capacité de la nouvelle catégorie.
   */
  capacite: number;
}

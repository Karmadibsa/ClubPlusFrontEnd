/**
 * @interface DashboardSummaryDTO
 * @description Data Transfer Object (DTO) représentant un résumé des statistiques clés pour le tableau de bord d'un club.
 * Retournée par l'API pour afficher une vue d'ensemble de l'activité du club.
 */
interface DashboardSummaryDTO {
  /** Nombre total d'événements organisés par le club. */
  totalEvents: number;

  /** Nombre d'événements à venir dans les 30 prochains jours. */
  upcomingEventsCount30d: number;

  /** Taux d'occupation moyen des événements du club, en pourcentage (ex: 75.5%). */
  averageEventOccupancyRate: number;

  /** Tableau des inscriptions mensuelles (membres, événements) pour un graphique d'évolution. */
  monthlyRegistrations: MonthlyRegistrationPoint[];

  /** Notes moyennes des événements, potentiellement catégorisées (ex: organisation, ambiance). */
  averageEventRatings: AverageRatings;

  /** Nombre total de membres enregistrés dans le club. */
  totalMembers: number;

  /** Nombre total de membres considérés comme actifs. */
  totalActiveMembers: number;

  /** Nombre total de participations enregistrées à l'ensemble des événements du club. */
  totalParticipations: number;
}

/**
 * @interface MonthlyRegistrationPoint
 * @description Structure de données pour un point unique d'un graphique affichant les inscriptions mensuelles.
 */
interface MonthlyRegistrationPoint {
  /** Le nombre d'occurrences pour le mois concerné (ex: nombre d'inscriptions). */
  count: number;

  /** Chaîne représentant le mois et l'année pour ce point de donnée (ex: "Jan 2024"). */
  monthYear: string;
}

/**
 * @interface AverageRatings
 * @description Structure flexible pour stocker les notes moyennes par catégorie.
 * Utilise une signature d'index pour un nombre variable de catégories (ex: "organisation", "ambiance").
 */
interface AverageRatings {
  /** Note moyenne pour une catégorie spécifique. `number` si calculée, `null` si non disponible, `undefined` si absente. */
  [category: string]: number | null | undefined;
}

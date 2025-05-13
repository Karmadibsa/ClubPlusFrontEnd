/**
 * @interface DashboardSummaryDTO
 * @description Data Transfer Object (DTO) représentant un résumé des statistiques clés
 * pour le tableau de bord d'un club.
 * Cette structure est typiquement retournée par une API (par exemple, `/stats/clubs/{clubId}/dashboard-summary`)
 * et est utilisée pour afficher une vue d'ensemble de l'activité et des performances du club [3].
 * "DTO" signifie "Data Transfer Object", un simple objet utilisé pour transférer des données
 * entre les couches d'une application, en particulier entre le serveur et le client.
 */
interface DashboardSummaryDTO {
  /**
   * @property {number} totalEvents
   * @description Nombre total d'événements organisés ou gérés par le club.
   */
  totalEvents: number;

  /**
   * @property {number} upcomingEventsCount30d
   * @description Nombre d'événements à venir dans les 30 prochains jours.
   * Utile pour une vue rapide des activités imminentes.
   */
  upcomingEventsCount30d: number;

  /**
   * @property {number} averageEventOccupancyRate
   * @description Taux d'occupation moyen des événements du club, exprimé en pourcentage.
   * Par exemple, une valeur de `75.5` représenterait 75.5%.
   * Ce KPI (Key Performance Indicator) est important pour mesurer l'engagement et la popularité des événements.
   */
  averageEventOccupancyRate: number;

  /**
   * @property {MonthlyRegistrationPoint[]} monthlyRegistrations
   * @description Tableau de points de données représentant le nombre d'inscriptions (de membres, à des événements, etc.)
   * par mois sur une période donnée. Utilisé pour générer un graphique d'évolution.
   */
  monthlyRegistrations: MonthlyRegistrationPoint[];

  /**
   * @property {AverageRatings} averageEventRatings
   * @description Objet contenant les notes moyennes des événements, potentiellement
   * catégorisées (par exemple, organisation, ambiance) [3].
   */
  averageEventRatings: AverageRatings;

  /**
   * @property {number} totalMembers
   * @description Nombre total de membres enregistrés dans le club.
   * Ce champ a été identifié comme pertinent pour le tableau de bord.
   */
  totalMembers: number;

  /**
   * @property {number} totalActiveMembers
   * @description Nombre total de membres considérés comme actifs au sein du club
   */
  totalActiveMembers: number;

  /**
   * @property {number} totalParticipations
   * @description Nombre total de participations enregistrées à l'ensemble des événements du club.
   */
  totalParticipations: number;
}

/**
 * @interface MonthlyRegistrationPoint
 * @description Structure de données pour un point unique dans un graphique ou une liste
 * affichant les inscriptions (ou autres métriques) sur une base mensuelle.
 */
interface MonthlyRegistrationPoint {
  /**
   * @property {number} count
   * @description Le nombre d'occurrences pour le mois concerné (ex: nombre d'inscriptions de nouveaux membres).
   */
  count: number;

  /**
   * @property {string} monthYear
   * @description Une chaîne de caractères représentant le mois et l'année pour ce point de donnée.
   * Utilisée comme libellé sur l'axe du graphique (ex: "Jan 2024", "Fév 2024").
   * Il est important que ce format soit cohérent pour le tri et l'affichage.
   */
  monthYear: string;
}

/**
 * @interface AverageRatings
 * @description Structure flexible pour stocker les notes moyennes, où chaque note
 * est associée à une catégorie spécifique.
 * Utilise une signature d'index TypeScript pour permettre un nombre variable de catégories de notation.
 * Par exemple, un événement pourrait être noté sur "l'organisation", "l'ambiance", etc....
 */
interface AverageRatings {
  /**
   * @property {[category: string]: number | null | undefined}
   * @description Signature d'index permettant d'avoir des propriétés dynamiques.
   * - `category` (la clé, de type `string`): Représente le nom de la catégorie de notation.
   * - `value` (la valeur, de type `number | null | undefined`): Représente la note moyenne pour cette catégorie.
   *   - `number`: Une note valide a été calculée.
   *   - `null`: Indique explicitement qu'aucune note n'est disponible ou applicable pour cette catégorie.
   *   - `undefined`: La catégorie pourrait ne pas être présente si aucune donnée n'existe pour elle.
   */
  [category: string]: number | null | undefined;
}

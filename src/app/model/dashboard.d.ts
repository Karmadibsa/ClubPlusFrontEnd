// Idéalement, ces interfaces devraient être dans des fichiers séparés (ex: src/app/models/dto.model.ts)

// Structure attendue de l'API /stats/clubs/{clubId}/dashboard-summary
interface DashboardSummaryDTO {
  totalEvents: number;
  upcomingEventsCount30d: number;
  averageEventOccupancyRate: number; // Ex: 75.5 pour 75.5%
  monthlyRegistrations: MonthlyRegistrationPoint[];
  averageEventRatings: AverageRatings;
  totalMembers: number; // Ajouté car présent dans votre code initial
  totalActiveMembers: number;
  totalParticipations: number;
}

// Structure pour un point du graphique d'inscriptions
interface MonthlyRegistrationPoint {
  count: number;    // Nombre d'inscriptions
  monthYear: string; // Label du mois (ex: "Jan 2024")
}

// Structure pour les notes moyennes
interface AverageRatings {
  // La clé est la catégorie de note (ex: 'organisation'), la valeur est la note moyenne
  [category: string]: number | null | undefined;
  // Ex: { organisation: 4.2, ambiance: 4.8, moyenneGenerale: 4.5 }
}

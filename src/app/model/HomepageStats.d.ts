/**
 * @interface HomepageStats
 * @description Définit la structure des données pour les statistiques globales de la page d'accueil.
 * Utilisée pour typer les données d'API montrant l'ampleur et l'activité de la plateforme.
 */
export interface HomepageStats {
  /** Nombre total de clubs enregistrés et actifs sur la plateforme. */
  clubCount: number;

  /** Nombre total d'événements gérés ou listés sur la plateforme. */
  eventCount: number;

  /** Nombre total de membres inscrits sur la plateforme. */
  memberCount: number;
}

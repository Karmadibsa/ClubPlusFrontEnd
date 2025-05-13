/**
 * @interface HomepageStats
 * @description Définit la structure des données pour afficher des statistiques globales
 * sur la page d'accueil de l'application "Club Plus".
 * Ces statistiques donnent un aperçu rapide de l'ampleur et de l'activité
 * de la plateforme.
 * Cette interface est typiquement utilisée pour typer les données reçues d'un endpoint d'API
 * qui agrège ces chiffres (par exemple, `/api/stats/homepage` ou `/api/platform-overview`).
 */
export interface HomepageStats {
  /**
   * @property {number} clubCount
   * @description Nombre total de clubs enregistrés et actifs sur la plateforme.
   * Permet de montrer la croissance de la communauté des clubs.
   */
  clubCount: number;

  /**
   * @property {number} eventCount
   * @description Nombre total d'événements (passés, présents, ou futurs) gérés
   * ou listés sur la plateforme.
   * Reflète l'activité événementielle globale.
   */
  eventCount: number;

  /**
   * @property {number} memberCount
   * @description Nombre total de membres (utilisateurs) inscrits sur la plateforme,
   * tous clubs confondus.
   * Indique la taille de la base d'utilisateurs.
   */
  memberCount: number;
}

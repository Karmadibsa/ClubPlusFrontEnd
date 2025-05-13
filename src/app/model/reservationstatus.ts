/**
 * @enum ReservationStatus
 * @description Définit un ensemble de constantes nommées pour représenter les différents états
 * possibles d'une réservation au sein de l'application "Club Plus".
 * L'utilisation d'une énumération TypeScript améliore la lisibilité du code,
 * la maintenabilité et la sécurité de type en évitant les erreurs potentielles
 * liées à l'utilisation de chaînes de caractères littérales ("magic strings") pour les statuts [1].
 *
 * Cette énumération TypeScript est conçue pour correspondre (approximativement, comme noté)
 * à une énumération similaire qui pourrait exister dans le backend Java, assurant ainsi
 * une cohérence dans la sémantique des statuts entre le frontend et le backend.
 */
export enum ReservationStatus {
  /**
   * @value CONFIRME
   * @description La réservation a été confirmée et la place est réservée pour le membre.
   * Le membre est attendu à l'événement.
   */
  CONFIRME = 'CONFIRME',

  /**
   * @value UTILISE
   * @description La réservation a été utilisée; le membre s'est présenté à l'événement
   * et son QR code (ou autre moyen de suivi) a été validé/scanné [1].
   * Ce statut est important pour le suivi des présences effectives.
   */
  UTILISE = 'UTILISE',

  /**
   * @value ANNULE
   * @description La réservation a été annulée, soit par le membre, soit par un administrateur.
   * La place correspondante est de nouveau disponible (selon les règles de gestion).
   */
  ANNULE = 'ANNULE'
}

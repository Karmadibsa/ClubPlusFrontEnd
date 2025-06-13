/**
 * @enum ReservationStatus
 * @description Définit les états possibles d'une réservation.
 * Améliore la lisibilité et la sécurité de type.
 * Conçue pour correspondre à l'énumération du backend.
 */
export enum ReservationStatus {
  /** La réservation est confirmée et la place est réservée. */
  CONFIRME = 'CONFIRME',

  /** La réservation a été utilisée (membre présent à l'événement). */
  UTILISE = 'UTILISE',

  /** La réservation a été annulée (place potentiellement disponible de nouveau). */
  ANNULE = 'ANNULE'
}

import { Membre } from './membre';
import { Evenement } from './evenement';
import { Categorie } from './categorie';
import { ReservationStatus } from './reservationstatus';

/**
 * @interface Reservation
 * @description Représente une réservation effectuée par un membre pour une catégorie spécifique d'un événement.
 * Utilisée pour afficher les détails, suivre le statut et potentiellement générer un QR code.
 */
export interface Reservation {
  /** Identifiant unique de la réservation. */
  id: number;

  /** Identifiant unique universel (UUID) de la réservation, potentiellement pour QR code. */
  reservationUuid: string;

  /** Le membre ayant effectué la réservation (informations partielles). */
  membre: Partial<Membre>;

  /** L'événement concerné par la réservation (informations partielles). */
  event: Partial<Evenement>;

  /** La catégorie de place réservée (informations partielles). */
  categorie: Partial<Categorie>;

  /** Date et heure de la réservation (format ISO 8601 recommandé). */
  dateReservation: string;

  /** Statut actuel de la réservation (ex: 'CONFIRMEE', 'ANNULEE'). */
  status: ReservationStatus;

  /** Données brutes pour le QR code (optionnel, généré à la volée). */
  qrcodeData?: string;
}

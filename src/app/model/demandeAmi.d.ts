import {Membre} from './membre';

/**
 * @interface DemandeAmi
 * @description Représente une demande d'amitié entre deux membres.
 * Utilisée pour suivre l'état d'une demande d'ajout en ami.
 */
export interface DemandeAmi {
  /** Identifiant unique de la demande. */
  id: number;

  /** Le membre qui a initié la demande. */
  envoyeur: Membre;

  /** Le membre qui a reçu la demande. */
  recepteur: Membre;

  /** Statut actuel de la demande ('ATTENTE', 'ACCEPTEE', 'REFUSEE'). */
  statut: 'ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

  /** Date et heure de l'envoi de la demande (format ISO 8601 recommandé). */
  dateDemande: string;
}

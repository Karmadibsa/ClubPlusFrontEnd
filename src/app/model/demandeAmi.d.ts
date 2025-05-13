/**
 * Importation du modèle Membre.
 * L'interface DemandeAmi dépend de l'interface Membre pour typer
 * les propriétés 'envoyeur' et 'recepteur'. Il est crucial que l'interface
 * Membre soit bien définie et importée correctement.
 */
import { Membre } from '../model/membre'; // Assurez-vous que le chemin est correct et que Membre est défini.

/**
 * @interface DemandeAmi
 * @description Représente une demande d'amitié entre deux membres de l'application.
 * Cette structure de données est utilisée pour suivre l'état d'une demande d'ajout
 * en ami, de son envoi à son acceptation ou refus.
 * Elle est essentielle pour les fonctionnalités sociales de l'application "Club Plus" [1].
 */
export interface DemandeAmi {
  /**
   * @property {number} id
   * @description Identifiant unique de la demande d'amitié, généré par le backend.
   */
  id: number;

  /**
   * @property {Membre} envoyeur
   * @description Le membre qui a initié la demande d'amitié.
   * L'objet `Membre` contiendra les informations du membre envoyeur
   * (potentiellement un sous-ensemble des informations complètes du membre pour des raisons
   * de performance ou de confidentialité, selon la définition de l'interface `Membre`).
   */
  envoyeur: Membre;

  /**
   * @property {Membre} recepteur
   * @description Le membre qui a reçu la demande d'amitié.
   * Similaire à `envoyeur`, l'objet `Membre` contiendra les informations du membre destinataire.
   */
  recepteur: Membre;

  /**
   * @property {'ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | string} statut
   * @description Statut actuel de la demande d'amitié.
   * Il peut prendre l'une des valeurs prédéfinies :
   * - 'ATTENTE': La demande a été envoyée et attend une réponse du récepteur.
   * - 'ACCEPTEE': La demande a été acceptée par le récepteur.
   * - 'REFUSEE': La demande a été refusée par le récepteur.
   */
  statut: 'ATTENTE' | 'ACCEPTEE' | 'REFUSEE' ;

  /**
   * @property {string} dateDemande
   * @description Date et heure à laquelle la demande d'amitié a été envoyée.
   * Il est fortement recommandé d'utiliser le format ISO 8601 (ex: "AAAA-MM-JJTHH:mm:ssZ")
   * pour une gestion cohérente et une facilité de parsing des dates.
   */
  dateDemande: string;
}

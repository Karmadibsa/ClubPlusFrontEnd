/**
 * Importations des modèles/types nécessaires.
 * - Membre: Pour typer les informations de l'utilisateur ayant fait la réservation.
 * - Evenement: Pour typer les informations de l'événement concerné.
 * - Categorie: Pour typer les informations de la catégorie de place réservée.
 * - ReservationStatus: Pour typer le statut de la réservation (ex: CONFIRMED, CANCELLED, PENDING).
 * Il est crucial que ces interfaces/types soient bien définis et importés.
 */
import { Membre } from './membre';           // Assurez-vous que ce chemin est correct et que Membre est défini.
import { Evenement } from './evenement';       // Assurez-vous que ce chemin est correct et qu'Evenement est défini.
import { Categorie } from './categorie';       // Assurez-vous que ce chemin est correct et que Categorie est défini.
import { ReservationStatus } from './reservationstatus'; // Assurez-vous que ce chemin est correct et que ReservationStatus est un type/enum défini.

/**
 * @interface Reservation
 * @description Représente une réservation effectuée par un membre pour une catégorie
 * spécifique d'un événement.
 * Cette interface est utilisée pour afficher les détails d'une réservation, suivre son statut,
 * et potentiellement pour générer des informations nécessaires au contrôle d'accès (QR code).
 */
export interface Reservation {
  /**
   * @property {number} id
   * @description Identifiant numérique unique de la réservation, généré par le backend.
   */
  id: number;

  /**
   * @property {string} reservationUuid
   * @description Identifiant unique universel (UUID) de la réservation.
   * Peut être utilisé pour des références publiques ou des URL non séquentielles,
   * offrant une meilleure sécurité contre l'énumération simple d'IDs.
   * Pourrait aussi être la donnée encodée dans le QR code.
   */
  reservationUuid: string;

  /**
   * @property {Partial<Membre>} membre
   * @description Le membre qui a effectué la réservation.
   * L'utilisation de `Partial<Membre>` est une bonne pratique si seul un sous-ensemble
   * des informations du membre est nécessaire dans le contexte de la réservation
   * (ex: `id`, `nom`, `prenom`), évitant de charger des données inutiles.
   * Cela signifie que toutes les propriétés de l'interface `Membre` deviennent optionnelles ici.
   */
  membre: Partial<Membre>;

  /**
   * @property {Partial<Evenement>} event
   * @description L'événement pour lequel la réservation a été faite.
   * `Partial<Evenement>` indique que seules certaines informations de l'événement
   * (ex: `id`, `nom`, `start`) peuvent être présentes, optimisant les données transmises.
   */
  event: Partial<Evenement>;

  /**
   * @property {Partial<Categorie>} categorie
   * @description La catégorie de place spécifique réservée pour l'événement.
   * `Partial<Categorie>` suggère que seuls les détails pertinents de la catégorie
   * (ex: `id`, `nom`) pourraient être inclus.
   */
  categorie: Partial<Categorie>;

  /**
   * @property {string} dateReservation
   * @description Date et heure à laquelle la réservation a été effectuée.
   * Il est fortement recommandé que cette chaîne soit au format ISO 8601
   * (ex: "AAAA-MM-JJTHH:mm:ssZ"), ce qui est courant pour la sérialisation
   * des objets `LocalDateTime` du backend Java.
   */
  dateReservation: string;

  /**
   * @property {ReservationStatus} status
   * @description Statut actuel de la réservation.
   * Le type `ReservationStatus` devrait être une énumération (enum) ou une union
   * de types littéraux (ex: 'CONFIRMEE' | 'ANNULEE' | 'EN_ATTENTE') définissant
   * les états possibles d'une réservation.
   */
  status: ReservationStatus; // Par exemple: 'CONFIRMEE', 'ANNULEE', 'UTILISEE'

  /**
   * @property {string} [qrcodeData]
   * @description Données brutes ou chaîne de caractères destinées à être encodées dans un QR code,
   * ou représentant le QR code lui-même (par exemple, une URL ou un identifiant unique).
   * Ce champ est optionnel (indiqué par `?`). La mention `@Transient` dans le commentaire original
   * suggère qu'il s'agit d'un champ non persisté en base de données côté serveur, mais
   * généré à la volée lorsque la réservation est récupérée ou créée.
   * Ce QR code est utilisé pour le suivi des présences à l'entrée de l'événement [1].
   */
  qrcodeData?: string;
}

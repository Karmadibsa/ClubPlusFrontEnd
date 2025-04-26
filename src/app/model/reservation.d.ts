// src/app/model/reservation.ts (ou un nom similaire)
import { Membre } from './membre'; // Assurez-vous que ce chemin est correct
import { Evenement } from './evenement';   // Assurez-vous que ce chemin est correct
import { Categorie } from './categorie'; // Assurez-vous que ce chemin est correct
import { ReservationStatus } from './reservationstatus'; // Assurez-vous que ce chemin est correct

export interface Reservation {
  qrcodeurl: string;
  id: number;
  reservationUuid: string;
  membre: Partial<Membre>; // Utilisez Partial si vous n'avez pas tous les détails du membre
  event: Partial<Evenement>;   // Utilisez Partial si vous n'avez pas tous les détails de l'event
  categorie: Partial<Categorie>; // Utilisez Partial si vous n'avez pas tous les détails de la catégorie
  dateReservation: string; // LocalDateTime est souvent sérialisé en String ISO 8601
  status: ReservationStatus;
  qrcodeData?: string; // Optionnel car @Transient et généré côté serveur
}

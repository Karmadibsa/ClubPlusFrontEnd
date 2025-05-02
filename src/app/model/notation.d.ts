import {Evenement} from './evenement'; // Assurez-vous que ce chemin est correct

/**
 * Interface TypeScript correspondant à l'entité Java `Notation`.
 * Utilisée pour typer les objets de notation dans le frontend.
 */
export interface Notation {
  id: number;
  event: Evenement;
  ambiance: number;
  proprete: number;
  organisation: number;
  fairPlay: number;
  niveauJoueurs: number;
  dateNotation: string;
  noteMoyenne: number;
}

export interface EventRatingPayload { // <--- 'export' la rendait utilisable
  ambiance: number;
  proprete: number;
  organisation: number;
  fairPlay: number;
  niveauJoueurs: number;
}

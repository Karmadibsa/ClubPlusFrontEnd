import {Membre} from '../model/membre';

// Interface pour représenter une DemandeAmi
export interface DemandeAmi {
  id: number;
  envoyeur: Membre;
  recepteur: Membre;
  statut: 'ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | string;
  dateDemande: string;
}

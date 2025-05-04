import {RoleType} from '../model/role';

export interface Membre {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string; // Garder string si l'API renvoie une chaîne ISO "YYYY-MM-DD"
  date_inscription: string; // Idem
  numero_voie: string;
  rue: string;
  codepostal: string;
  ville: string;
  telephone: string;
  email: string;
  role: RoleType;
  codeAmi?: string;
}


export interface MembrePayload {
  nom: string;
  prenom: string;
  date_naissance: string;
  numero_voie: string;
  rue: string;
  codepostal: string;
  ville: string;
  telephone: string;
  email: string;
  password?: string;
}

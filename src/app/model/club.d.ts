export interface Club {
  id: number;
  nom: string;
  date_creation: string;
  date_inscription: string;
  numero_voie: string;
  rue: string;
  codepostal: string;
  ville: string;
  telephone: string;
  email: string;
  codeClub?: string;
  actif: boolean;
  desactivationDate?: string | null;
}

interface ClubAdminPayload {
  nom: string;
  prenom: string;
  date_naissance: string;
  numero_voie: string;
  rue: string;
  codepostal: string;
  ville: string;
  telephone: string;
  email: string;
  password?: string; // Le mot de passe de l'admin
}

export interface ClubRegistrationPayload {
  nom: string;
  date_creation: string;
  numero_voie: string;
  rue: string;
  codepostal: string;
  ville: string;
  telephone: string;
  email: string; // Email du club
  admin: ClubAdminPayload; // L'objet admin imbriqué
}

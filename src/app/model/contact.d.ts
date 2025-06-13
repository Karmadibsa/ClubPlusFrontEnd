/**
 * Interface pour les données du formulaire de contact.
 */
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Interface pour la réponse attendue du backend.
 */
export interface ContactResponse {
  message: string;
}

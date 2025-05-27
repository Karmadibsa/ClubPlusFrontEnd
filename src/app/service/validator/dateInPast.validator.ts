import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validateur personnalisé pour vérifier si la date est dans le passé.
 * La date d'aujourd'hui n'est pas considérée comme étant dans le passé.
 */
export function dateInPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      // Si le champ est vide, ne pas lever cette erreur spécifique (la validation 'required' s'en chargera)
      return null;
    }

    const inputDate = new Date(control.value);
    // Pour une comparaison juste avec un input type="date", on met l'heure à minuit pour "aujourd'hui"
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Important pour s'assurer qu'une date d'aujourd'hui n'est pas considérée comme passée

    if (inputDate >= today) {
      // Si la date saisie est aujourd'hui ou dans le futur
      return { 'dateNotInPast': true }; // Retourne un objet d'erreur
    }

    return null; // La date est valide (dans le passé)
  };
}

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * @function dateInPastValidator
 * @description Validateur personnalisé: vérifie si une date est strictement dans le passé.
 * Aujourd'hui n'est pas considéré comme étant dans le passé.
 * @returns Un objet `ValidationErrors` avec `dateNotInPast: true` si la date est aujourd'hui ou dans le futur, sinon `null`.
 */
export function dateInPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialise l'heure pour une comparaison stricte au jour.

    if (inputDate >= today) {
      return { 'dateNotInPast': true };
    }

    return null;
  };
}

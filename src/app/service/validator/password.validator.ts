import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * @class PasswordValidators
 * @description Une classe utilitaire regroupant des validateurs personnalisés statiques
 * spécifiques aux champs de mot de passe dans les formulaires réactifs Angular.
 */
export class PasswordValidators {

  /**
   * @static
   * @method passwordComplexity
   * @description Crée une fonction de validation qui vérifie si un mot de passe
   * respecte des critères de complexité (longueur, majuscules, minuscules, chiffres, caractères spéciaux).
   * @returns La fonction de validation à utiliser sur un `FormControl`.
   */
  static passwordComplexity(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;

      if (!value) {
        return null; // Aucune erreur de complexité si la valeur est vide (la validation 'required' s'en charge).
      }

      const errors: ValidationErrors = {};

      if (value.length < 8) {
        errors['minlength'] = true;
      }

      if (value.length > 100) {
        errors['maxlength'] = true;
      }

      if (!/[A-Z]/.test(value)) {
        errors['requiresUppercase'] = true;
      }

      if (!/[a-z]/.test(value)) {
        errors['requiresLowercase'] = true;
      }

      if (!/[0-9]/.test(value)) {
        errors['requiresDigit'] = true;
      }

      if (!/[!@#&()\-{}\[\]:;',?/*~$^+=<>]/.test(value)) {
        errors['requiresSpecialChar'] = true;
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  /**
   * @static
   * @method passwordMatch
   * @description Crée une fonction de validation pour un `FormGroup` qui vérifie si les valeurs
   * de deux champs de mot de passe sont identiques.
   * @param passwordKey Le nom du `FormControl` du mot de passe principal.
   * @param confirmPasswordKey Le nom du `FormControl` du mot de passe de confirmation.
   * @returns La fonction de validation à utiliser sur un `FormGroup`.
   */
  static passwordMatch(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const passwordControl = group.get(passwordKey);
      const confirmPasswordControl = group.get(confirmPasswordKey);

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      const password = passwordControl.value;
      const confirmPassword = confirmPasswordControl.value;

      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordMismatch: true };
      }

      return null;
    };
  }
}

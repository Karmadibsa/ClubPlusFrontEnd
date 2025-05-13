import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export class PasswordValidators {

  static passwordComplexity(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value) {
        return null; // Pas d’erreur si vide, laisser required gérer ça
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

  // Validator pour vérifier que password et confirmPassword correspondent
  static passwordMatch(passwordKey: string, confirmPasswordKey: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get(passwordKey)?.value;
      const confirmPassword = group.get(confirmPasswordKey)?.value;
      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }
}

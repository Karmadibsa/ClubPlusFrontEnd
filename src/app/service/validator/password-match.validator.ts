// src/app/validators/password-match.validator.ts

import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

/**
 * Validateur personnalisé pour FormGroup qui vérifie si les champs
 * 'password' et 'confirmPassword' ont la même valeur.
 *
 * @returns L'objet { passwordMismatch: true } si les mots de passe diffèrent, sinon null.
 */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  // Le contrôle passé ici est le FormGroup auquel le validateur est appliqué.
  const formGroup = control as FormGroup; // Cast pour un accès plus facile aux contrôles internes
  const passwordControl = formGroup.controls['password'];
  const confirmPasswordControl = formGroup.controls['confirmPassword'];

  // Si les contrôles n'existent pas encore (peu probable mais sûr)
  if (!passwordControl || !confirmPasswordControl) {
    return null;
  }

  // Optionnel : ne pas déclencher l'erreur si confirmPassword a déjà d'autres erreurs (ex: required)
  // Cela évite d'afficher "ne correspond pas" quand le champ est juste vide.
  // if (confirmPasswordControl.errors && !confirmPasswordControl.errors['passwordMismatch']) {
  //   return null;
  // }

  // La condition principale : les valeurs doivent correspondre
  if (passwordControl.value !== confirmPasswordControl.value) {
    // Définir l'erreur sur le contrôle confirmPassword permet d'afficher
    // le message d'erreur spécifiquement sous ce champ dans le template.
    confirmPasswordControl.setErrors({ ...confirmPasswordControl.errors, passwordMismatch: true });
    // Retourner l'erreur au niveau du groupe est nécessaire pour que formGroup.invalid soit true
    return { passwordMismatch: true };
  } else {
    // Si les mots de passe correspondent, retirer l'erreur 'passwordMismatch'
    // S'assurer de ne pas supprimer d'autres erreurs potentielles sur confirmPassword.
    const currentErrors = confirmPasswordControl.errors;
    if (currentErrors && currentErrors['passwordMismatch']) {
      delete currentErrors['passwordMismatch']; // Supprimer uniquement l'erreur de mismatch
      // Mettre à jour les erreurs: null s'il n'y a plus d'erreur, sinon garder les autres.
      confirmPasswordControl.setErrors(Object.keys(currentErrors).length === 0 ? null : currentErrors);
    }
    // Pas d'erreur de correspondance trouvée
    return null;
  }
};

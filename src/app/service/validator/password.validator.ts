import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * @class PasswordValidators
 * @description Une classe utilitaire regroupant des validateurs personnalisés statiques
 *              spécifiques aux champs de mot de passe dans les formulaires réactifs Angular.
 */
export class PasswordValidators {

  /**
   * @static
   * @method passwordComplexity
   * @description Crée une fonction de validation (`ValidatorFn`) qui vérifie si un mot de passe
   *              respecte des critères de complexité spécifiques.
   *              Les critères incluent : longueur minimale/maximale, présence de majuscules,
   *              minuscules, chiffres, et caractères spéciaux.
   *
   * @returns {ValidatorFn} La fonction de validation à utiliser sur un FormControl.
   */
  static passwordComplexity(): ValidatorFn {
    // La méthode retourne une fonction qui correspond à la signature d'une ValidatorFn.
    // Cette fonction sera appelée par Angular chaque fois que la valeur du contrôle de formulaire change.
    return (control: AbstractControl): ValidationErrors | null => {
      // `control` est le FormControl auquel ce validateur est attaché.
      const value = control.value as string; // Récupère la valeur actuelle du contrôle (le mot de passe saisi).

      // 1. Si le champ est vide, on ne retourne pas d'erreur de complexité ici.
      //    La validation 'required' (si elle est appliquée) s'occupera de signaler que le champ est obligatoire.
      //    Cela évite d'afficher des erreurs de complexité sur un champ vide.
      if (!value) {
        return null; // Aucune erreur de complexité si la valeur est vide.
      }

      // 2. Initialisation d'un objet pour stocker les erreurs de validation potentielles.
      const errors: ValidationErrors = {};

      // 3. Vérification des critères de complexité :

      // 3a. Longueur minimale
      if (value.length < 8) {
        errors['minlength'] = true; // Ajoute une erreur 'minlength' si le mot de passe est trop court.
        // Note: Angular a un validateur Validators.minLength intégré, mais l'inclure ici
        // permet de regrouper toutes les logiques de mot de passe. Le nom de l'erreur
        // est le même pour la cohérence.
      }

      // 3b. Longueur maximale
      if (value.length > 100) {
        errors['maxlength'] = true; // Ajoute une erreur 'maxlength' si le mot de passe est trop long.
      }

      // 3c. Présence d'au moins une lettre majuscule
      //     `/[A-Z]/.test(value)` utilise une expression régulière pour tester la présence.
      if (!/[A-Z]/.test(value)) {
        errors['requiresUppercase'] = true; // Ajoute une erreur 'requiresUppercase'.
      }

      // 3d. Présence d'au moins une lettre minuscule
      if (!/[a-z]/.test(value)) {
        errors['requiresLowercase'] = true; // Ajoute une erreur 'requiresLowercase'.
      }

      // 3e. Présence d'au moins un chiffre
      if (!/[0-9]/.test(value)) {
        errors['requiresDigit'] = true; // Ajoute une erreur 'requiresDigit'.
      }

      // 3f. Présence d'au moins un caractère spécial
      //     L'expression régulière `/[!@#&()\-{}\[\]:;',?/*~$^+=<>]/` définit la liste des caractères spéciaux acceptés/requis.
      //     Assurez-vous que cette liste correspond à vos exigences de sécurité [2].
      if (!/[!@#&()\-{}\[\]:;',?/*~$^+=<>]/.test(value)) {
        errors['requiresSpecialChar'] = true; // Ajoute une erreur 'requiresSpecialChar'.
      }

      // 4. Retour du résultat de la validation.
      //    - Si l'objet `errors` contient au moins une clé (c'est-à-dire qu'au moins une erreur a été trouvée),
      //      on retourne cet objet `errors`. Angular interprétera cela comme une validation échouée.
      //    - Sinon (si l'objet `errors` est vide, signifiant que tous les critères sont respectés),
      //      on retourne `null`. Angular interprétera cela comme une validation réussie.
      return Object.keys(errors).length ? errors : null;
    };
  } // Fin de passwordComplexity

  /**
   * @static
   * @method passwordMatch
   * @description Crée une fonction de validation (`ValidatorFn`) qui s'applique à un `FormGroup`
   *              (et non à un `FormControl` individuel).
   *              Elle vérifie si les valeurs de deux champs de mot de passe (le mot de passe
   *              principal et sa confirmation) sont identiques.
   *
   * @param passwordKey Le nom (clé) du `FormControl` contenant le mot de passe principal dans le `FormGroup`.
   * @param confirmPasswordKey Le nom (clé) du `FormControl` contenant le mot de passe de confirmation.
   *
   * @returns {ValidatorFn} La fonction de validation à utiliser sur un FormGroup.
   */
  static passwordMatch(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    // Retourne une fonction de validation qui sera appliquée au FormGroup.
    return (group: AbstractControl): ValidationErrors | null => {
      // `group` est le FormGroup auquel ce validateur est attaché.

      // 1. Récupération des valeurs des deux contrôles de mot de passe à partir du FormGroup.
      //    `group.get(passwordKey)` récupère le FormControl associé à la clé `passwordKey`.
      //    L'opérateur de chaînage optionnel `?.` est utilisé au cas où les contrôles n'existeraient pas (peu probable si bien configuré).
      const passwordControl = group.get(passwordKey);
      const confirmPasswordControl = group.get(confirmPasswordKey);

      // S'assurer que les contrôles existent avant d'accéder à leur valeur.
      if (!passwordControl || !confirmPasswordControl) {
        // Si les contrôles ne sont pas trouvés (ce qui serait une erreur de configuration du formulaire),
        // il est plus sûr de ne pas retourner d'erreur de validation ici, car ce n'est pas une erreur de l'utilisateur.
        // On pourrait aussi logger une erreur pour le développeur.
        return null;
      }

      const password = passwordControl.value;
      const confirmPassword = confirmPasswordControl.value;

      // 2. Comparaison des valeurs.
      //    On vérifie si les deux champs ont une valeur ET si ces valeurs sont différentes.
      //    Si les champs sont vides, on ne considère pas cela comme une erreur de "non-correspondance".
      //    Les validateurs 'required' sur les champs individuels géreraient les cas où ils sont vides.
      if (password && confirmPassword && password !== confirmPassword) {
        // 2a. Si les mots de passe sont différents.
        //     Retourne un objet d'erreur avec la clé 'passwordMismatch'.
        //     Cette erreur sera attachée au *FormGroup* entier.
        //     On peut aussi attacher l'erreur spécifiquement au champ de confirmation :
        //     confirmPasswordControl.setErrors({ passwordMismatch: true });
        //     return null; // Si l'erreur est attachée au contrôle individuel.
        //     Mais la pratique courante pour les validateurs de groupe est de retourner l'erreur pour le groupe.
        return { passwordMismatch: true };
      }

      // 3. Si les mots de passe correspondent (ou si l'un des champs est vide, ce qui n'est pas une "non-correspondance").
      //    Retourne `null`, indiquant que cette validation spécifique (correspondance) est réussie.
      //    Il est important de s'assurer aussi que si une erreur de non-correspondance avait été
      //    précédemment définie sur le champ de confirmation (si on utilise setErrors sur le contrôle),
      //    elle soit effacée si les mots de passe correspondent à nouveau.
      //    Ex: if (confirmPasswordControl.hasError('passwordMismatch')) { delete confirmPasswordControl.errors['passwordMismatch']; confirmPasswordControl.updateValueAndValidity(); }
      //    Cependant, en retournant l'erreur pour le groupe, cette gestion est plus simple.
      return null;
    };
  } // Fin de passwordMatch
} // Fin de la classe PasswordValidators

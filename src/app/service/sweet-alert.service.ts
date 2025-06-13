import {Injectable} from '@angular/core';
import Swal, {SweetAlertIcon, SweetAlertOptions, SweetAlertPosition, SweetAlertResult} from 'sweetalert2';

/**
 * @Injectable({ providedIn: 'root' })
 * Service 'SweetAlertService' qui encapsule les fonctionnalités de SweetAlert2.
 * Permet d'afficher des pop-ups, des notifications toast et des confirmations.
 */
@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {
  constructor() { }

  /**
   * @method showPopUp
   * @description Affiche une alerte simple (succès, erreur, etc.) sans confirmation.
   * @param message Le texte principal.
   * @param type Le type d'icône ('success', 'error', 'warning', 'info', 'question').
   * @param title Le titre (optionnel).
   * @returns Une promesse qui se résout lorsque l'alerte est fermée.
   */
  showPopUp(message: string, type: SweetAlertIcon = 'info', title?: string): Promise<SweetAlertResult> {
    if (!title) {
      switch (type) {
        case 'success': title = 'Succès !'; break;
        case 'error': title = 'Erreur'; break;
        case 'warning': title = 'Attention'; break;
        case 'info': title = 'Information'; break;
        case 'question': title = 'Question'; break;
        default: title = '';
      }
    }

    const options: SweetAlertOptions = {
      title: title,
      text: message,
      icon: type,
      confirmButtonColor: type === 'error' ? 'var(--danger-dark)' : 'var(--main-blue)',
    };
    return Swal.fire(options);
  }

  /**
   * @method show
   * @description Affiche une notification légère de type "Toast" qui disparaît automatiquement.
   * @param message Le texte principal (peut contenir du HTML simple).
   * @param type Type d'icône ('success', 'info', 'warning', 'error', 'question'). Défaut: 'success'.
   * @param title Titre optionnel.
   * @param duration Durée en millisecondes avant fermeture (défaut: 4000ms).
   * @param position Position à l'écran (défaut: 'top').
   * @returns Une promesse qui se résout lorsque le toast est fermé.
   */
  show(
    message: string,
    type: SweetAlertIcon = 'success',
    title?: string,
    duration: number = 4000,
    position: SweetAlertPosition = 'top'
  ): Promise<SweetAlertResult> {

    const options: SweetAlertOptions = {
      toast: true,
      position: position,
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      icon: type,
      title: title,
      html: message,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    };

    return Swal.fire(options);
  }


  /**
   * @method confirmAction
   * @description Affiche une boîte de dialogue de confirmation et exécute une action
   * uniquement si l'utilisateur clique sur "Confirmer".
   * @param title Le titre de la confirmation.
   * @param text Le message principal.
   * @param onConfirmAction La fonction à exécuter si l'utilisateur confirme.
   * @param confirmButtonText Texte du bouton de confirmation (optionnel).
   * @param cancelButtonText Texte du bouton d'annulation (optionnel).
   */
  confirmAction(
    title: string,
    text: string,
    onConfirmAction: () => void,
    confirmButtonText: string = 'Oui, confirmer',
    cancelButtonText: string = 'Annuler'
  ): void {
    const options: SweetAlertOptions = {
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--main-blue)',
      cancelButtonColor: 'var(--danger-dark)',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
    };

    Swal.fire(options).then((result) => {
      if (result.isConfirmed) {
        onConfirmAction();
      }
    });
  }
}

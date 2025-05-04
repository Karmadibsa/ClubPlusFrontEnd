import { Injectable } from '@angular/core';
import Swal, {SweetAlertIcon, SweetAlertOptions, SweetAlertPosition, SweetAlertResult} from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {
  constructor() { }

  /**
   * Affiche une alerte simple (succès, erreur, etc.) sans attendre de confirmation.
   * Très similaire à votre NotificationService.
   * @param message Le texte principal à afficher.
   * @param type Le type d'icône ('success', 'error', 'warning', 'info', 'question').
   * @param title Le titre (optionnel).
   */
  showPopUp(message: string, type: SweetAlertIcon = 'info', title?: string): Promise<SweetAlertResult> {
    // Détermine le titre par défaut si non fourni, basé sur le type
    if (!title) {
      switch (type) {
        case 'success': title = 'Succès !'; break;
        case 'error': title = 'Erreur'; break;
        case 'warning': title = 'Attention'; break;
        case 'info': title = 'Information'; break;
        case 'question': title = 'Question'; break;
        default: title = ''; // Pas de titre par défaut pour les autres cas
      }
    }

    const options: SweetAlertOptions = {
      title: title,
      text: message,
      icon: type,
      // Ajuster les couleurs des boutons si nécessaire
      confirmButtonColor: type === 'error' ? 'var(--danger-dark)' : 'var(--main-blue)',
    };
    return Swal.fire(options);
  }

  /**
   * Affiche une notification légère de type "Toast" qui disparaît automatiquement.
   * Idéal pour des confirmations rapides (ex: "Copié !").
   * @param message Le texte principal à afficher (peut contenir du HTML simple).
   * @param type Type d'icône ('success', 'info', 'warning', 'error', 'question'). Défaut: 'success'.
   * @param title Titre optionnel (souvent omis pour les toasts).
   * @param duration Durée en millisecondes avant fermeture (défaut: 3000ms).
   * @param position Position à l'écran (défaut: 'top-end' -> en haut à droite).
   * @returns Une promesse qui se résout lorsque le toast est fermé.
   */
  show(
    message: string,
    type: SweetAlertIcon = 'success', // 'success' comme défaut pour actions comme "copié"
    title?: string,
    duration: number = 4000, // 3 secondes par défaut
    position: SweetAlertPosition = 'top' // En haut à droite par défaut [2]
  ): Promise<SweetAlertResult> {

    const options: SweetAlertOptions = {
      // Options spécifiques au Toast [2]
      toast: true, // <= Active le mode Toast
      position: position,
      showConfirmButton: false, // Pas de bouton de confirmation
      timer: duration, // Durée d'affichage
      timerProgressBar: true, // Affiche la barre de progression du timer

      // Contenu
      icon: type,
      title: title, // Titre optionnel
      // Utiliser 'html' permet un peu de formatage si besoin, sinon 'text'
      html: message, // Message principal

      // Amélioration UX : Pause du timer au survol [2]
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }

      // Options de style (optionnel, peut être géré via CSS global)
      // background: '#fff',
      // color: '#333'
    };

    return Swal.fire(options);
  }


  /**
   * Remplace confirm() : Affiche une confirmation et exécute une action
   * UNIQUEMENT si l'utilisateur clique sur "Confirmer".
   * @param title Le titre de la confirmation.
   * @param text Le message principal.
   * @param onConfirmAction La fonction à exécuter si l'utilisateur confirme.
   * @param confirmButtonText Texte pour le bouton de confirmation (optionnel).
   * @param cancelButtonText Texte pour le bouton d'annulation (optionnel).
   */
  confirmAction(
    title: string,
    text: string,
    onConfirmAction: () => void, // La fonction à exécuter si confirmé
    confirmButtonText: string = 'Oui, confirmer',
    cancelButtonText: string = 'Annuler'
  ): void { // Note: ne retourne rien directement, gère via callback

    const options: SweetAlertOptions = {
      title: title,
      text: text,
      icon: 'warning', // Icône standard pour confirmation
      showCancelButton: true,
      confirmButtonColor: 'var(--main-blue)', // On peut ajuster si l'action est "dangereuse"
      cancelButtonColor: 'var(--danger-dark)',    // Inverser ? Rouge pour Annuler ? Ou garder standard
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      // returnFocus: false, // Décommenter si problèmes de focus après fermeture
    };

    Swal.fire(options).then((result) => {
      // Si l'utilisateur a cliqué sur "Confirmer"
      if (result.isConfirmed) {
        // Exécute l'action fournie en callback
        onConfirmAction();
      }
      // Si l'utilisateur annule, on ne fait rien ici.
    });

    // Le code après Swal.fire(...).then(...) continue immédiatement
  }
}

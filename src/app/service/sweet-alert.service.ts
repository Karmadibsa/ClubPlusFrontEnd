import { Injectable } from '@angular/core';
import Swal, {SweetAlertIcon, SweetAlertOptions, SweetAlertResult} from 'sweetalert2';

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
  show(message: string, type: SweetAlertIcon = 'info', title?: string): Promise<SweetAlertResult> {
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
      confirmButtonColor: type === 'error' ? '#d33' : '#3085d6',
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
      confirmButtonColor: '#3085d6', // On peut ajuster si l'action est "dangereuse"
      cancelButtonColor: '#d33',    // Inverser ? Rouge pour Annuler ? Ou garder standard
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

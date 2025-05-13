import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common'; // CommonModule (qui exporte DatePipe) sera importé.
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../service/crud/reservation.service';
import { LucideAngularModule } from 'lucide-angular';
import { Evenement } from '../../../model/evenement';
import { Categorie } from '../../../model/categorie';
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-reservation-modal', // Sélecteur CSS pour utiliser ce composant.
  standalone: true,                   // Supposons qu'il soit autonome.
  imports: [
    // CommonModule (qui exporte DatePipe, *ngIf, etc.) est généralement importé.
    // DatePipe est un pipe, il doit être disponible via les imports.
    DatePipe,                         // Ou `CommonModule`
    FormsModule,                      // Pour [(ngModel)] (ex: sur un <select> pour les catégories).
    LucideAngularModule               // Pour les icônes <lucide-icon>.
  ],
  templateUrl: './reservation-modal.component.html', // Template HTML de la modale de réservation.
  styleUrls: ['./reservation-modal.component.scss']  // Styles SCSS spécifiques.
})
export class ReservationModalComponent {
  // --- INPUTS & OUTPUTS ---

  /**
   * @Input() isVisible
   * @description Contrôle la visibilité de la modale depuis le composant parent (ex: EventCardComponent).
   */
  @Input() isVisible: boolean = false;

  /**
   * @Input() event
   * @description L'objet `Evenement` pour lequel l'utilisateur souhaite faire une réservation.
   *              Peut être `null` si non fourni, bien que la logique du composant s'attende à ce qu'il soit présent.
   *              Le nom a été corrigé en 'event' (singulier) ce qui est plus sémantique.
   */
  @Input() event: Evenement | null = null;

  /**
   * @Output() closeModal
   * @description Événement émis vers le parent lorsque la modale doit être fermée
   *              (par exemple, clic sur "Annuler", "Fermer", ou après une réservation réussie).
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * @Output() reserveSuccess
   * @description Événement émis vers le parent (ex: EventCardComponent) lorsqu'une réservation
   *              a été effectuée avec succès via l'API.
   *              La valeur émise est la réponse de l'API (typage `any` ici, à affiner).
   */
  @Output() reserveSuccess = new EventEmitter<any>(); // Idéalement, typez ceci avec la réponse attendue (ex: la Reservation créée).

  // --- SERVICES INJECTÉS ---
  private notification = inject(SweetAlertService);     // Pour afficher des notifications.
  private reservationService = inject(ReservationService); // Pour l'appel API de création.

  // --- PROPRIÉTÉS INTERNES ---

  /**
   * @property selectedCategory
   * @description Stocke l'objet `Categorie` que l'utilisateur a sélectionné dans la modale
   *              (par exemple, via une liste déroulante ou des boutons radio).
   *              Initialisée à `null`.
   */
  selectedCategory: Categorie | null = null;

  /**
   * @property isSubmitting
   * @description Booléen pour suivre l'état de la soumission de la réservation (appel API).
   *              Utile pour désactiver le bouton "Réserver" et afficher un indicateur de chargement.
   */
  isSubmitting = false;

  // Le commentaire "Pas de constructor nécessaire pour MatDialog" suggère qu'une approche précédente
  // utilisait peut-être MatDialog. Ce composant est maintenant conçu pour être inclus
  // directement dans le template d'un parent et contrôlé via @Input() isVisible.

  /**
   * @method onClose
   * @description Émet l'événement `closeModal` pour demander au composant parent de fermer cette modale.
   *              Appelée par un clic sur un bouton "Fermer" ou "Annuler" dans le template de la modale.
   */
  onClose(): void {
    this.closeModal.emit();
  }

  /**
   * @method onSubmit
   * @description Gère la soumission du formulaire/de la demande de réservation.
   *              Vérifie les conditions nécessaires (événement et catégorie sélectionnés),
   *              appelle le `ReservationService` pour créer la réservation, et gère
   *              les réponses de succès ou d'erreur.
   */
  onSubmit(): void {
    // 1. Vérifications initiales.
    //    Ne rien faire si une soumission est déjà en cours, si l'événement n'est pas défini,
    //    ou si aucune catégorie n'a été sélectionnée.
    if (this.isSubmitting || !this.event || !this.selectedCategory) {
      if (!this.selectedCategory && this.event) { // Ne notifier que si le problème est la catégorie manquante.
        this.notification.show("Veuillez sélectionner une catégorie pour la réservation.", 'warning');
      } else if (!this.event) {
        this.notification.show("Aucun événement n'est spécifié pour la réservation.", 'error');
      }
      return; // Sortie anticipée si les conditions ne sont pas remplies.
    }

    // 2. Marquer comme en cours de soumission (pour UI).
    this.isSubmitting = true;

    // 3. Récupération des IDs nécessaires pour l'appel API.
    const eventId = this.event.id;
    const categorieId = this.selectedCategory.id;

    console.log(`ReservationModal: Tentative de réservation pour eventId ${eventId}, categorieId ${categorieId}`);

    // 4. Appel au service de réservation.
    this.reservationService.createReservation(eventId, categorieId).subscribe({
      // 4a. Gestion du succès.
      next: (response) => {
        console.log('ReservationModal: Réservation réussie, réponse API:', response);
        this.notification.show('Réservation effectuée avec succès !', 'success');
        this.reserveSuccess.emit(response); // Notifie le parent du succès avec la réponse.
        this.onClose();                     // Ferme la modale après le succès.
      },
      // 4b. Gestion de l'erreur.
      error: (error) => {
        console.error('ReservationModal: Échec de la réservation', error);
        // Tente d'extraire un message d'erreur significatif depuis la réponse d'erreur de l'API.
        // La structure `error.error.message` est courante pour les erreurs JSON.
        const message = error?.error?.message || "Erreur lors de la réservation. Vérifiez si vous avez déjà une réservation pour cet événement, s'il reste des places disponibles dans cette catégorie, ou si vous respectez les limitations de réservation (ex: pas plus de 2 places par membre).";
        this.notification.show(message, 'error');
        // Important: Ne pas fermer la modale en cas d'erreur pour permettre à l'utilisateur
        // de corriger (si possible) ou de simplement prendre connaissance de l'erreur.
      },
      // 4c. Exécuté après `next` ou `error` (que la requête réussisse ou échoue).
      complete: () => {
        this.isSubmitting = false; // Réactive le bouton de soumission.
        // this.cdr.markForCheck(); // Si OnPush et que l'état de isSubmitting doit être reflété.
      }
    });
  }

  /**
   * @method stopPropagation
   * @description Empêche la propagation d'un événement (typiquement un clic) vers les éléments parents.
   *              Utilisé sur le contenu de la modale pour éviter qu'un clic à l'intérieur
   *              ne ferme la modale si le parent a une logique de "clic à l'extérieur pour fermer".
   * @param event L'objet événement DOM.
   */
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}

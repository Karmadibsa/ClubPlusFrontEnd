import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../service/crud/reservation.service';
import { LucideAngularModule } from 'lucide-angular';
import { Evenement } from '../../../model/evenement';
import { Categorie } from '../../../model/categorie';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { finalize } from 'rxjs';

/**
 * Modale permettant à un utilisateur de sélectionner une catégorie et de
 * réserver sa place pour un événement.
 *
 * @example
 * <app-reservation-modal
 * [isVisible]="isModalVisible"
 * [event]="selectedEvent"
 * (closeModal)="close()"
 * (reserveSuccess)="onReservationSuccess()">
 * </app-reservation-modal>
 */
@Component({
  selector: 'app-reservation-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './reservation-modal.component.html',
  styleUrls: ['./reservation-modal.component.scss']
})
export class ReservationModalComponent {

  /** Contrôle la visibilité de la modale. */
  @Input() isVisible: boolean = false;

  /** L'événement pour lequel la réservation est effectuée. */
  @Input() event: Evenement | null = null;

  /** Émis lorsque la fermeture de la modale est demandée. */
  @Output() closeModal = new EventEmitter<void>();

  /** Émis avec la réponse de l'API après une réservation réussie. */
  @Output() reserveSuccess = new EventEmitter<any>();

  /** La catégorie sélectionnée par l'utilisateur. */
  public selectedCategory: Categorie | null = null;
  /** Vrai si une réservation est en cours de soumission. */
  public isSubmitting = false;

  private readonly notification = inject(SweetAlertService);
  private readonly reservationService = inject(ReservationService);

  /**
   * Demande la fermeture de la modale.
   */
  public onClose(): void {
    this.closeModal.emit();
  }

  /**
   * Gère la soumission de la réservation.
   * Valide la sélection et appelle le service de réservation.
   */
  public onSubmit(): void {
    if (this.isSubmitting || !this.event || !this.selectedCategory) {
      if (!this.selectedCategory) {
        this.notification.show("Veuillez sélectionner une catégorie.", 'warning');
      }
      return;
    }

    this.isSubmitting = true;
    const eventId = this.event.id;
    const categorieId = this.selectedCategory.id;

    this.reservationService.createReservation(eventId, categorieId)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.notification.show('Réservation effectuée avec succès !', 'success');
          this.reserveSuccess.emit(response);
          this.onClose();
        },
        error: (error) => {
          const message = error?.error?.message || "Une erreur est survenue lors de la réservation.";
          this.notification.show(message, 'error');
        }
      });
  }

  /**
   * Empêche un clic à l'intérieur de la modale de la fermer.
   * @param event - L'événement de clic.
   */
  public stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}

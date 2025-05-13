import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ReservationService} from '../../../service/crud/reservation.service';
import {LucideAngularModule} from 'lucide-angular';
import {Evenement} from '../../../model/evenement';
import {Categorie} from '../../../model/categorie';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-reservation-modal',
  templateUrl: './reservation-modal.component.html',
  styleUrls: ['./reservation-modal.component.scss'],
  imports: [
    DatePipe,
    FormsModule,
    LucideAngularModule
  ]
})
export class ReservationModalComponent {
  // --- Inputs & Outputs ---
  @Input() isVisible: boolean = false;
  @Input() event: Evenement | null = null; // Renommé en 'event' (singulier) et typé
  @Output() closeModal = new EventEmitter<void>();
  @Output() reserveSuccess = new EventEmitter<any>(); // Pour notifier le parent (la carte)
  // ------------------------

  private notification = inject(SweetAlertService);
  private reservationService = inject(ReservationService);

  selectedCategory: Categorie | null = null; // Typage
  isSubmitting = false;

  // Pas de constructor nécessaire pour MatDialog

  onClose(): void {
    this.closeModal.emit();
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.event || !this.selectedCategory) {
      if (!this.selectedCategory) {
        this.notification.show("Veuillez sélectionner une catégorie.", 'warning');
      }
      return; // Sortir si invalide
    }

    this.isSubmitting = true;
    const eventId = this.event.id;
    const categorieId = this.selectedCategory.id;

    this.reservationService.createReservation(eventId, categorieId).subscribe({
      next: (response) => {
        this.notification.show('Réservation effectuée avec succès !', 'success');
        this.reserveSuccess.emit(response);
        this.onClose(); // Fermer après succès
      },
      error: (error) => {
        console.error('Échec de la réservation', error);
        const message = error?.error?.message || "Erreur lors de la réservation. Vérifiez si vous avez déjà une réservation ou s'il reste des places.";
        this.notification.show(message, 'error');
        // Ne pas fermer la modale en cas d'erreur pour permettre nouvelle tentative
      },
      complete: () => {
        this.isSubmitting = false; // Réactiver le bouton dans tous les cas
      }
    });
  }

  // Empêche la fermeture par clic dans la modale
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}

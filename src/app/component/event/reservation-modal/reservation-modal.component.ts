import {Component, inject, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DatePipe, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ReservationService} from '../../../service/reservation.service';
import {NotificationService} from '../../../service/notification.service';

@Component({
  selector: 'app-reservation-modal',
  templateUrl: './reservation-modal.component.html',
  styleUrls: ['./reservation-modal.component.scss'],
  imports: [
    DatePipe,
    FormsModule,
    NgForOf
  ]
})
export class ReservationModalComponent {
  private notification = inject(NotificationService)
  // Variable pour stocker l'événement
  events: any;
  // Variable pour la catégorie sélectionnée (si vous avez un formulaire avec sélection)
  selectedCategory: any;

  private reservationService= inject(ReservationService) // Injecter ReservationService

  constructor(
    // Référence au dialog pour pouvoir le fermer
    public dialogRef: MatDialogRef<ReservationModalComponent>,
    // Injection des données passées à la modal
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Stockez les données d'événement reçues
    this.events = data;
    console.log('Événement reçu dans la modal:', this.events);
  }

  // Méthode pour fermer la modal
  closeModal(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    // 1. Récupère les IDs comme un bon haltérophile soulève la barre
    const eventId = this.events.id; // ID de l'événement
    const categorieId = this.selectedCategory.id; // ID de la catégorie

    // 2. Appel au service (le coach qui t'accompagne)
    this.reservationService.createReservation(eventId, categorieId).subscribe({
      next: (response) => {
        // 3a. Succès : la pompe est gagnée 💪
        console.log('Réservation réussie !', response);
        this.dialogRef.close({
          success: true,
          newReservation: response // Renvoie les données au parent si besoin
        });
      },
      error: (error) => {
        // 3b. Échec : on analyse la posture pour corriger
        console.error('Échec de la réservation', error);
        this.notification.show("Erreur lors de la reservation", 'error')
        // Ici, tu peux ajouter un toast d'erreur ou un message utilisateur
      }
    });
}}

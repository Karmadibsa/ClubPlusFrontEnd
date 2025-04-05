import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DatePipe, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';

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
  // Variable pour stocker l'événement
  events: any;
  // Variable pour la catégorie sélectionnée (si vous avez un formulaire avec sélection)
  selectedCategory: any;

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

  // Méthode pour soumettre la réservation
  onSubmit(): void {
    console.log('Réservation soumise pour:', this.events.title);
    console.log('Catégorie sélectionnée:', this.selectedCategory);
    // Vous pouvez retourner des données au composant parent
    this.dialogRef.close({
      success: true,
      category: this.selectedCategory,
      event: this.events
    });
  }
}

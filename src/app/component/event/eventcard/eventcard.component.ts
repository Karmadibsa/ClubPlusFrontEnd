import {Component, inject, Input} from '@angular/core';
import {DatePipe} from "@angular/common";
import {MatCard, MatCardContent, MatCardHeader, MatCardModule} from "@angular/material/card";
import {LucideAngularModule} from 'lucide-angular';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {ReservationModalComponent} from '../reservation-modal/reservation-modal.component';
import {Evenement} from '../../../model/evenement';

@Component({
  selector: 'app-event-card',
  imports: [
    DatePipe,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardModule,
    LucideAngularModule,

  ],
  templateUrl: './eventcard.component.html',
  styleUrls: ['./eventcard.component.scss']

})
export class EventCardComponent {
  @Input() event: any; // L'événement est passé en entrée au composant EventCard
  http = inject(HttpClient)

  constructor(private dialog: MatDialog) {
  }

  openReservationModal(): void {
    // Ouvrir la modal en passant l'événement comme données
    const dialogRef = this.dialog.open(ReservationModalComponent, {
      width: '600px',  // Largeur de la modal
      data: this.event // Passer UN événement, pas un tableau
    });

    // Récupérer les données lorsque la modal est fermée
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        console.log('Réservation confirmée pour la catégorie:', result.category);
        console.log('Réservation confirmée pour evenement:', result.event);
        this.http.post("http://localhost:8080/api/reservations/" + result.event.id + "/" + result.category.id, null)
          .subscribe()

      }
    });
  }
}


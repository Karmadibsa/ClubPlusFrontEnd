import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SafeUrl} from '@angular/platform-browser';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe} from '@angular/common';

@Component({
  selector: '[app-reservation-row]',
  standalone: true,
  templateUrl: './reservation-row.component.html',
  imports: [
    LucideAngularModule,
    DatePipe
  ],
  styleUrls: ['./reservation-row.component.scss']
})
export class ReservationRowComponent {
  @Input() reservation : any;

  @Output() openQrModal = new EventEmitter<any>();
  @Output() generatePDF = new EventEmitter<any>();
  @Output() deleteReservation = new EventEmitter<any>(); // Événement pour informer le parent

  onOpenQrModal() {
    this.openQrModal.emit(this.reservation);
  }

  onGeneratePDF() {
    this.generatePDF.emit(this.reservation);
  }

  onDelete(): void {
      this.deleteReservation.emit(this.reservation);
  }


}

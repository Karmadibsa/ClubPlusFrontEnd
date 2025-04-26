import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {EditEventModalComponent} from '../edit-event/edit-event.component';

@Component({
  selector: '[app-event-row]',
  templateUrl: './event-row.component.html',
  imports: [
    DatePipe,
    LucideAngularModule,

    NgForOf,
    NgIf,
    EditEventModalComponent
  ],
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {
  @Input() evenement: any;
  @Output() supprimer = new EventEmitter<any>();
  @Output() modifier = new EventEmitter<any>();

  isModalVisible = false;

  ouvrirModal(): void {
    this.isModalVisible = true;
  }

  fermerModal(): void {
    this.isModalVisible = false;
  }

  sauvegarderEvenement(evenementModifie: any): void {
    this.modifier.emit(evenementModifie);
    this.fermerModal();
  }

  supprimerEvenement(): void {
    this.supprimer.emit(this.evenement);
  }
}

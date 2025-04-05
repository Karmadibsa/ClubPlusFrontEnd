import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DatePipe, NgForOf} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {EditEventComponent} from '../edit-event/edit-event.component';

@Component({
  selector: '[app-event-row]',
  templateUrl: './event-row.component.html',
  imports: [
    DatePipe,
    LucideAngularModule,
    EditEventComponent,
    NgForOf
  ],
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {
  @Input() event!: Event; // Typage avec l'interface Event
  @Output() edit = new EventEmitter<Event>(); // Émet un événement typé
  @Output() delete = new EventEmitter<Event>();

  isEditModalVisible = false; // Contrôle de visibilité de la modal

  openEditModal(): void {
    this.isEditModalVisible = true; // Affiche la modal
  }

  closeEditModal(): void {
    this.isEditModalVisible = false; // Ferme la modal
  }

  onSave(updatedEvent: any): void {
    console.log('Événement mis à jour :', updatedEvent);
    this.closeEditModal();
    // Ajoutez ici votre logique pour sauvegarder les modifications
  }

  onDelete(event: Event): void {
    this.delete.emit(event); // Émet un événement au parent pour suppression
    console.log('Suppression demandée pour :', event);
  }

}

export interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description: string;
  amis: string[];
  participants: number;
  location: string;
  categories: Category[];
}

export interface Category {
  name: string;
  places: number;
}

import {Component, EventEmitter, Output} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-create-event-button',
  imports: [
    LucideAngularModule
  ],
  templateUrl: './create-event-button.component.html',
  styleUrl: './create-event-button.component.scss'
})
export class CreateEventButtonComponent {
  // Événement émis lorsque le bouton est cliqué
  @Output() createClicked = new EventEmitter<void>();

  // Méthode appelée par le (click) dans le template
  onClick(): void {
    this.createClicked.emit(); // Émet l'événement vers le composant parent
  }
}

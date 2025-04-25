import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe, NgIf} from '@angular/common';

@Component({
  selector: '[app-membre-row]',
  templateUrl: './membre-row.component.html',
  imports: [
    LucideAngularModule,
    DatePipe
  ],
  styleUrls: ['./membre-row.component.scss']
})
export class MembreRowComponent {
  @Input() membre!: Membre;
  // Émet l'événement pour ouvrir la modale de détails/rôle
  @Output() openModal = new EventEmitter<Membre>();

  onOpenModalClick(): void {
    this.openModal.emit(this.membre);
  }
}

import {Component, EventEmitter, Input, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';

@Component({
  selector: 'app-itemnotation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './itemnotation.component.html',
  styleUrls: ['./itemnotation.component.scss']
})
export class ItemnotationComponent {
  // Utiliser 5 étoiles (indices 0 à 4)
  starIndexes = [0, 1, 2, 3, 4];
  // Initialiser la quantité à 0 (aucune étoile sélectionnée)
  quantity = signal(0);

  @Input() title: string = '';
  // Émet toujours un nombre (la note de 1 à 5)
  @Output() ratingChanged = new EventEmitter<number>();

  updateRating(index: number): void {
    // La note est l'index (0-4) + 1 = (1-5)
    const newRating = index +1 ;
    this.quantity.set(newRating);
    this.ratingChanged.emit(newRating); // Émission de la note numérique (1-5)
  }

  // Optionnel: Méthode pour réinitialiser l'état depuis l'extérieur si besoin
  reset(): void {
    this.quantity.set(0);
  }
}

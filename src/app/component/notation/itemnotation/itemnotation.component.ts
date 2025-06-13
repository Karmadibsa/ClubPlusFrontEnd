/**
 * Importations nécessaires.
 */
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-itemnotation',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './itemnotation.component.html',
  styleUrls: ['./itemnotation.component.scss']
})
export class ItemnotationComponent {
  // --- PROPRIÉTÉS INTERNES ---

  starIndexes = [0, 1, 2, 3, 4]; // Correspond à 5 étoiles.
  quantity = signal(0); // Initialise la note à 0 (aucune étoile sélectionnée).

  // --- INPUTS & OUTPUTS ---

  /**
   * @Input() title
   * @description Le titre ou le label du critère de notation à afficher à côté des étoiles.
   *              Exemple: "Qualité de l'accueil", "Ambiance", etc.
   *              Fourni par le composant parent.
   */
  @Input() title: string = ''; // Initialisé à une chaîne vide par défaut.

  /**
   * @Output() ratingChanged
   * @description Événement émis vers le composant parent chaque fois que l'utilisateur
   *              clique sur une étoile et que la note change.
   *              La valeur émise est un `number` représentant la nouvelle note (de 1 à 5).
   */
  @Output() ratingChanged = new EventEmitter<number>();

  // --- MÉTHODES ---

  /**
   * @method updateRating
   * @description Méthode appelée lorsqu'un utilisateur clique sur une étoile.
   *              Met à jour le signal `quantity` avec la nouvelle note et émet
   *              l'événement `ratingChanged` avec cette nouvelle note.
   * @param index L'index de l'étoile sur laquelle l'utilisateur a cliqué (de 0 à 4).
   */
  updateRating(index: number): void {

    const newRating = index + 1;

    this.quantity.set(newRating);

    this.ratingChanged.emit(newRating);
    console.log(`ItemnotationComponent ('${this.title}'): Nouvelle note sélectionnée - ${newRating}`);
  }

  /**
   * @method reset
   * @description Méthode optionnelle pour réinitialiser la sélection d'étoiles à 0 (aucune étoile).
   *              Peut être appelée depuis l'extérieur par le composant parent si nécessaire
   *              (par exemple, lors de la réinitialisation d'un formulaire de notation plus large).
   *              Pour l'appeler depuis l'extérieur, le parent aurait besoin d'une référence
   *              au `ItemnotationComponent` (par exemple, via `@ViewChild`).
   */
  reset(): void {
    this.quantity.set(0); // Remet la note à 0.
    console.log(`ItemnotationComponent ('${this.title}'): Notation réinitialisée.`);
  }
}

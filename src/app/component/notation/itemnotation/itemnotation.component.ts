/**
 * Importations nécessaires.
 */
// Component, EventEmitter, Input, Output, signal: Éléments de base d'Angular et la fonction `signal`.
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
// CommonModule: Pour les directives comme *ngIf/@if, *ngFor/@for, et les pipes.
import { CommonModule } from '@angular/common';
// LucideAngularModule: Pour les icônes d'étoiles.
import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-itemnotation',    // Sélecteur CSS pour utiliser ce composant.
  // Exemple: <app-itemnotation [title]="'Ambiance'" (ratingChanged)="onAmbianceRating($event)"></app-itemnotation>
  standalone: true,               // Indique que c'est un composant autonome.
  imports: [
    CommonModule,                 // Nécessaire pour @for (ou *ngFor) utilisé dans le template pour afficher les étoiles.
    LucideAngularModule           // Pour les icônes <lucide-icon name="star">.
  ],
  templateUrl: './itemnotation.component.html', // Template HTML pour afficher les étoiles cliquables.
  styleUrls: ['./itemnotation.component.scss']  // Styles SCSS pour les étoiles (ex: couleur pour sélectionnée/non sélectionnée).
})
export class ItemnotationComponent {
  // --- PROPRIÉTÉS INTERNES ---

  /**
   * @property starIndexes
   * @description Un tableau d'indices pour générer les 5 étoiles dans le template.
   *              Les valeurs sont [0, 1, 2, 3, 4].
   *              Utilisé avec @for (ou *ngFor) pour itérer et créer chaque étoile.
   */
  starIndexes = [0, 1, 2, 3, 4]; // Correspond à 5 étoiles.

  /**
   * @property quantity
   * @description Un **Signal Angular** qui stocke le nombre d'étoiles actuellement sélectionnées
   *              par l'utilisateur. La valeur du signal représente la note (de 1 à 5).
   *              Une valeur de 0 signifie qu'aucune étoile n'est sélectionnée.
   *              `signal(0)` initialise le signal avec la valeur 0.
   *              L'utilisation de `signal` permet une gestion d'état réactive et performante,
   *              bien intégrée avec le mécanisme de détection de changements d'Angular.
   */
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
    // La note est l'index de l'étoile (base 0) + 1 pour obtenir une note de 1 à 5.
    // Si l'utilisateur clique sur l'étoile à l'index 0, la note est 1.
    // Si l'utilisateur clique sur l'étoile à l'index 4, la note est 5.
    const newRating = index + 1;

    // Met à jour la valeur du signal `quantity` avec la nouvelle note.
    // `this.quantity.set(newRating)` est la manière de modifier la valeur d'un signal.
    // Tous les consommateurs de ce signal (par exemple, dans le template pour styler les étoiles)
    // seront notifiés du changement.
    this.quantity.set(newRating);

    // Émet l'événement `ratingChanged` avec la nouvelle note (1-5) vers le composant parent.
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
    // Note : Cette méthode `reset` ne déclenche pas `ratingChanged.emit()` ici.
    // Si une émission est souhaitée lors du reset, il faudrait ajouter :
    // this.ratingChanged.emit(0); // ou la valeur que vous considérez comme "reset".
    console.log(`ItemnotationComponent ('${this.title}'): Notation réinitialisée.`);
  }
}

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
/**
 * Affiche une carte statistique simple.
 * Ce composant est purement présentationnel : il reçoit des données via
 * ses entrées (@Input) et se contente de les afficher.
 */
export class StatCardComponent {
  /** Le titre à afficher dans la partie supérieure de la carte. */
  @Input() title: string = '';

  /** La valeur principale (chiffre ou texte) à afficher au centre de la carte. */
  @Input() value: string | number | null | undefined = '';

  /**
   * Le constructeur est vide car ce composant n'a pas de dépendances à injecter
   * ni d'initialisation complexe à réaliser.
   */
  constructor() { }

}

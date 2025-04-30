import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-stat-card',
  imports: [],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  /**
   * Le titre à afficher en haut de la carte statistique.
   * Ex: "Événements organisés"
   */
  @Input() title: string = ''; // Valeur par défaut pour éviter les erreurs

  /**
   * La valeur statistique à afficher.
   * Peut être un nombre ou une chaîne de caractères.
   * Ex: 15, '85%', 'N/A'
   */
  @Input() value: string | number | null | undefined = ''; // Accepte différents types, valeur par défaut

  constructor() { }
}

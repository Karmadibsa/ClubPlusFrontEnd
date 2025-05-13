import { Component, Input } from '@angular/core';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-stat-card', // Sélecteur CSS utilisé pour instancier ce composant dans un template HTML
  // d'un composant parent. Exemple: <app-stat-card></app-stat-card>


  templateUrl: './stat-card.component.html', // Chemin vers le fichier template HTML de ce composant.
  // Ce fichier définit la structure visuelle de la carte statistique.

  styleUrl: './stat-card.component.scss'    // Chemin vers le fichier de styles SCSS spécifique à ce composant.
  // 'styleUrl' (singulier) est utilisé si un seul fichier de style.
  // 'styleUrls' (pluriel avec un tableau) si plusieurs.
  // La présence de .scss indique l'utilisation de SASS.
})
export class StatCardComponent {
  /**
   * @Input() title: string
   * @description Le titre à afficher en haut de la carte statistique.
   *              Cette propriété est une entrée du composant, ce qui signifie que sa valeur
   *              sera fournie par le composant parent qui utilise `<app-stat-card>`.
   *              Exemple d'utilisation dans un parent :
   *              `<app-stat-card [title]="'Événements organisés'"></app-stat-card>`
   *              Une valeur par défaut `''` (chaîne vide) est assignée pour éviter les erreurs
   *              si le parent ne fournit pas cette entrée, bien que `Input()` soit généralement
   *              attendu pour être fourni.
   */
  @Input() title: string = '';

  /**
   * @Input() value: string | number | null | undefined
   * @description La valeur statistique principale à afficher sur la carte.
   *              Cette propriété est également une entrée fournie par le composant parent.
   *              Elle peut être de différents types (chaîne, nombre) pour s'adapter
   *              à diverses statistiques (ex: 15, '85%', 'N/A').
   *              Accepter `null` ou `undefined` permet de gérer les cas où la valeur
   *              n'est pas encore disponible ou n'est pas applicable.
   *              Une valeur par défaut `''` est assignée.
   *              Exemple d'utilisation dans un parent :
   *              `<app-stat-card [title]="'Taux de participation'" [value]="'75%'"></app-stat-card>`
   *              `<app-stat-card [title]="'Membres actifs'" [value]="nombreMembresActifs"></app-stat-card>` (où nombreMembresActifs est une variable du parent)
   */
  @Input() value: string | number | null | undefined = '';

  /**
   * Constructeur du composant.
   * Exécuté lors de la création d'une instance du composant.
   * Pour ce composant de présentation simple, le constructeur est vide car il n'a
   * pas besoin d'injecter de dépendances ou d'effectuer une initialisation complexe.
   */
  constructor() {
    // Aucune logique d'initialisation spécifique requise dans le constructeur pour ce composant.
    // Les propriétés @Input() seront initialisées par Angular via le data binding.
  }

  // Ce composant n'implémente pas de crochets de cycle de vie spécifiques comme ngOnInit
  // car sa logique est très simple et repose entièrement sur ses entrées.
  // Il ne gère pas d'état interne complexe ni n'effectue d'appels de service.
}

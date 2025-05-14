// ----- IMPORTATIONS -----
import {
  Component,
  inject,         // Fonction moderne pour l'injection de dépendances.
  OnInit,
  OnDestroy       // À ajouter si des abonnements sont gérés manuellement et nécessitent un nettoyage.
  // ChangeDetectorRef // À ajouter si ChangeDetectionStrategy.OnPush est utilisé.
} from '@angular/core';
import { FormsModule } from '@angular/forms';           // Pour [(ngModel)] sur le <select> et potentiellement d'autres.
import { DatePipe, CommonModule } from '@angular/common'; // DatePipe pour le formatage, CommonModule pour @if, @for.
// Subscription est nécessaire si vous gérez des abonnements manuellement.
// import { Subscription } from 'rxjs';

// Services
import { EventService } from '../../../service/crud/event.service'; // Service pour les opérations sur les événements et les notations.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications utilisateur.

// Modèles (Interfaces de données)
import { Evenement } from '../../../model/evenement';         // Interface décrivant un événement.
import { EventRatingPayload, Notation } from '../../../model/notation'; // Interfaces pour la charge utile de notation et la réponse.

// Composants Enfants/Associés
import { ItemnotationComponent } from '../../../component/notation/itemnotation/itemnotation.component'; // Composant pour la notation par étoiles.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * @Component NotationComponent
 * @description
 * Page permettant aux utilisateurs de noter les événements auxquels ils ont participé mais
 * qu'ils n'ont pas encore évalués. L'utilisateur sélectionne un événement dans une liste déroulante,
 * puis attribue des notes (de 1 à 5 étoiles) sur plusieurs critères prédéfinis.
 * Les notations soumises sont enregistrées via `EventService`.
 *
 * @example
 * <app-notation></app-notation> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-notation',
  standalone: true,               // Indique que c'est un composant autonome.
  imports: [                      // Dépendances nécessaires pour le template.
    FormsModule,                // Pour [(ngModel)] sur le <select> des événements.
    LucideAngularModule,        // Pour les icônes.
    DatePipe,                   // Pour le formatage des dates (disponible via CommonModule).
    CommonModule,               // Pour les directives @if, @for, etc.
    ItemnotationComponent       // Pour afficher le système de notation par étoiles pour chaque critère.
  ],
  templateUrl: './notation.component.html', // Chemin vers le fichier HTML du composant.
  styleUrl: './notation.component.scss'    // Chemin vers le fichier SCSS/CSS du composant.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisager pour optimisation.
})
export class NotationComponent implements OnInit { // Implémente OnInit. Ajouter OnDestroy si des abonnements manuels sont utilisés.

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service pour les opérations liées aux événements, y compris la soumission des notations.
   */
  private eventService = inject(EventService);
  /**
   * @private
   * @description Service pour afficher des notifications (pop-ups) à l'utilisateur.
   */
  private notification = inject(SweetAlertService);
  // private cdr = inject(ChangeDetectorRef); // À injecter si ChangeDetectionStrategy.OnPush est utilisé.

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Evenement[]} unratedEvents
   * @description Tableau stockant la liste des événements auxquels l'utilisateur a participé
   * mais qu'il n'a pas encore notés. Rempli via un appel API.
   * @default []
   */
  unratedEvents: Evenement[] = [];
  /**
   * @property {number | null} selectedEventId
   * @description L'ID de l'événement actuellement sélectionné par l'utilisateur dans la liste déroulante.
   * Lié via `[(ngModel)]`.
   * @default null
   */
  selectedEventId: number | null = null;
  /**
   * @property {Evenement | null} selectedEvent
   * @description L'objet `Evenement` complet correspondant à `selectedEventId`.
   * Utilisé pour afficher les détails de l'événement sélectionné.
   * @default null
   */
  selectedEvent: Evenement | null = null;

  /**
   * @property {EventRatingPayload} ratingModel
   * @description Objet stockant les notes (0-5) pour chaque critère de notation.
   * Les clés correspondent aux critères (ex: 'ambiance', 'proprete').
   * Initialisé avec des notes à 0.
   * @default {ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0}
   */
  ratingModel: EventRatingPayload = { ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0 };
  /**
   * @property {Array<{ key: keyof EventRatingPayload, label: string }>} ratingCriteria
   * @description Tableau définissant les critères de notation à afficher, avec leur clé
   * (correspondant aux propriétés de `ratingModel`) et leur libellé pour l'UI.
   * Utilisé pour générer dynamiquement les composants `app-itemnotation`.
   */
  ratingCriteria: Array<{ key: keyof EventRatingPayload, label: string }> = [
    { key: 'ambiance', label: 'Ambiance générale de l\'événement' },
    { key: 'proprete', label: 'Propreté des lieux et installations' },
    { key: 'organisation', label: 'Qualité de l\'organisation' },
    { key: 'fairPlay', label: 'Respect et fair-play des participants' },
    { key: 'niveauJoueurs', label: 'Niveau de jeu global des participants' }
  ];

  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si le chargement de la liste des événements à noter est en cours.
   * @default false
   */
  isLoading: boolean = false;
  /**
   * @property {boolean} isSubmitting
   * @description Booléen indiquant si la soumission d'une notation est en cours (appel API).
   * @default false
   */
  isSubmitting: boolean = false;

  // La propriété 'stars' n'est pas utilisée dans le code TS fourni, car
  // ItemnotationComponent gère sa propre logique d'affichage des étoiles.
  // stars: number[] = [1, 2, 3, 4, 5];

  // private unratedEventsSubscription: Subscription | null = null; // Pour gérer la désinscription si nécessaire.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Déclenche le chargement initial de la liste des événements non encore notés par l'utilisateur.
   * @see {@link loadUnratedEvents}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("NotationComponent: Initialisation.");
    this.loadUnratedEvents();
  }

  // ngOnDestroy(): void {
  //   this.unratedEventsSubscription?.unsubscribe();
  // }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadUnratedEvents
   * @description Charge la liste des événements auxquels l'utilisateur a participé et
   * qu'il n'a pas encore notés, via `EventService.getUnratedParticipatedEvents()`.
   * Réinitialise l'état de la sélection et du modèle de notation.
   * Gère l'état `isLoading`.
   * @returns {void}
   */
  loadUnratedEvents(): void {
    this.isLoading = true;
    // Réinitialise l'état avant de charger de nouvelles données.
    this.unratedEvents = [];
    this.selectedEventId = null;
    this.selectedEvent = null;
    this.resetRatingModel(); // Remet toutes les notes à 0.
    // this.cdr.detectChanges(); // Si OnPush.

    console.log("NotationComponent: Chargement des événements non notés.");
    // Si vous utilisiez this.unratedEventsSubscription:
    // this.unratedEventsSubscription?.unsubscribe();
    // this.unratedEventsSubscription = this.eventService.getUnratedParticipatedEvents().subscribe({ ... });
    this.eventService.getUnratedParticipatedEvents().subscribe({
      next: (events: Evenement[]) => {
        this.unratedEvents = events;
        console.log(`NotationComponent: ${events.length} événements non notés chargés.`);
        // isLoading sera géré par `complete` ou `error`.
        // this.cdr.detectChanges(); // Si OnPush.
      },
      error: (err: any) => { // Type `any` pour attraper différentes structures d'erreur.
        this.isLoading = false;
        this.notification.show("Erreur lors du chargement des événements à noter.", 'error');
        console.error("NotationComponent: Erreur chargement événements à noter:", err);
        // this.cdr.detectChanges(); // Si OnPush.
      },
      complete: () => {
        this.isLoading = false; // S'assurer que isLoading est false à la fin.
        // this.cdr.detectChanges(); // Si OnPush.
      }
    });
  }

  // --- GESTION DE LA SÉLECTION D'ÉVÉNEMENT ---
  /**
   * @method onEventSelected
   * @description Méthode appelée lorsque l'utilisateur sélectionne un événement dans la liste déroulante.
   * Met à jour `selectedEvent` avec l'objet événement complet correspondant à l'ID sélectionné.
   * Réinitialise le modèle de notation (`ratingModel`) pour le nouvel événement.
   * @returns {void}
   */
  onEventSelected(): void {
    if (this.selectedEventId) {
      // Le `+` convertit `this.selectedEventId` (qui peut être une chaîne venant du <select>) en nombre.
      this.selectedEvent = this.unratedEvents.find(event => event.id === +this.selectedEventId!) || null;
      this.resetRatingModel(); // Réinitialise les étoiles pour le nouvel événement.
      console.log("NotationComponent: Événement sélectionné:", this.selectedEvent ? this.selectedEvent.nom : "Aucun");
    } else {
      this.selectedEvent = null; // Désélectionne s'il n'y a pas d'ID.
    }
    // this.cdr.detectChanges(); // Si OnPush.
  }

  // --- GESTION DE LA NOTATION ---
  /**
   * @method setRating - **OBSOLETE si on utilise onRatingUpdate avec ItemnotationComponent**
   * @description Méthode pour définir la note d'un critère spécifique.
   *              Cette méthode serait utilisée si les étoiles étaient gérées manuellement
   *              dans ce composant au lieu d'utiliser `ItemnotationComponent`.
   * @param {keyof EventRatingPayload} criterion - La clé du critère à noter (ex: 'ambiance').
   * @param {number} value - La note attribuée (1-5).
   * @deprecated Utiliser `onRatingUpdate` qui est appelée par l'événement `(ratingChanged)` de `ItemnotationComponent`.
   * @returns {void}
   */
  // setRating(criterion: keyof EventRatingPayload, value: number): void {
  //   this.ratingModel[criterion] = value;
  // }

  /**
   * @method onRatingUpdate
   * @description Gère l'événement `(ratingChanged)` émis par un `ItemnotationComponent` enfant.
   * Met à jour la note pour le critère spécifié dans `ratingModel`.
   * @param {keyof EventRatingPayload} criterionKey - La clé du critère dont la note a changé (ex: 'ambiance').
   * @param {number} ratingValue - La nouvelle note (de 1 à 5) pour ce critère.
   * @returns {void}
   */
  onRatingUpdate(criterionKey: keyof EventRatingPayload, ratingValue: number): void {
    // Vérifie si la clé du critère est une propriété valide de `ratingModel`.
    if (Object.prototype.hasOwnProperty.call(this.ratingModel, criterionKey)) {
      console.log(`NotationComponent: Mise à jour pour critère "${criterionKey}", nouvelle note (1-5): ${ratingValue}`);
      this.ratingModel[criterionKey] = ratingValue; // Met à jour le modèle avec la note 1-5.
      // this.cdr.detectChanges(); // Si OnPush.
    } else {
      console.error(`NotationComponent: Clé de critère invalide reçue de ItemnotationComponent: ${String(criterionKey)}`);
    }
  }

  /**
   * @method isRatingComplete
   * @description Vérifie si tous les critères de notation ont reçu une note valide (entre 1 et 5).
   * Utilisé pour activer/désactiver le bouton de soumission.
   * @returns {boolean} `true` si toutes les notes sont complètes et valides, `false` sinon.
   */
  isRatingComplete(): boolean {
    // `every` vérifie si la condition est vraie pour tous les éléments du tableau.
    return this.ratingCriteria.every(crit =>
      this.ratingModel[crit.key] >= 1 && this.ratingModel[crit.key] <= 5
    );
  }

  /**
   * @method submitRating
   * @description Soumet la notation de l'événement sélectionné via `EventService.submitEventRating()`.
   * Vérifie d'abord si un événement est sélectionné et si tous les critères ont été notés.
   * Gère l'état `isSubmitting` et affiche des notifications de succès ou d'erreur.
   * Recharge la liste des événements à noter après une soumission réussie.
   * @returns {void}
   */
  submitRating(): void {
    if (!this.selectedEventId) {
      this.notification.show('Veuillez sélectionner un événement à noter.', 'warning');
      return;
    }
    if (!this.isRatingComplete()) {
      this.notification.show('Veuillez noter tous les critères (avec une note de 1 à 5 étoiles) avant de soumettre.', 'warning');
      return;
    }
    if (this.isSubmitting) return; // Empêche la double soumission.

    this.isSubmitting = true;
    // this.cdr.detectChanges(); // Si OnPush.

    console.log(`NotationComponent: Soumission de la notation pour l'événement ID ${this.selectedEventId}:`, this.ratingModel);
    // Si vous utilisiez un abonnement manuel :
    // const sub = this.eventService.submitEventRating(this.selectedEventId, this.ratingModel).subscribe({ ... });
    // this.subscriptions.push(sub);
    this.eventService.submitEventRating(this.selectedEventId, this.ratingModel).subscribe({
      next: (response: Notation) => { // L'API retourne l'objet Notation créé/mis à jour.
        this.isSubmitting = false;
        this.notification.show(`Votre notation pour l'événement "${this.selectedEvent?.nom || 'cet événement'}" a été enregistrée avec succès !`, 'success');
        console.log("NotationComponent: Notation enregistrée:", response);
        this.loadUnratedEvents(); // Recharge la liste pour retirer l'événement noté.
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        console.error("NotationComponent: Erreur lors de la soumission de la notation:", err);
        this.notification.show(`Erreur lors de l'enregistrement de la notation: ${err.error?.message || err.message || 'Erreur inconnue.'}`, 'error');
        // this.cdr.detectChanges(); // Si OnPush.
      }
    });
  }

  /**
   * @method resetRatingModel
   * @description Réinitialise toutes les notes dans `ratingModel` à 0.
   * Appelée lors de la sélection d'un nouvel événement ou après le chargement initial.
   * @returns {void}
   */
  resetRatingModel(): void {
    // Réinitialise chaque critère à 0.
    this.ratingModel = { ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0 };
    console.log("NotationComponent: Modèle de notation réinitialisé.");
  }
}

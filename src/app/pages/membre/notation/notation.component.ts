import {
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { Evenement } from '../../../model/evenement';
import { EventRatingPayload, Notation } from '../../../model/notation';

import { ItemnotationComponent } from '../../../component/notation/itemnotation/itemnotation.component';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component NotationComponent
 * @description Page de notation des événements auxquels l'utilisateur a participé.
 * Permet de sélectionner un événement et d'attribuer des notes sur plusieurs critères.
 */
@Component({
  selector: 'app-notation',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    DatePipe,
    CommonModule,
    ItemnotationComponent
  ],
  templateUrl: './notation.component.html',
  styleUrl: './notation.component.scss'
})
export class NotationComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private eventService = inject(EventService);
  private notification = inject(SweetAlertService);
  // private cdr = inject(ChangeDetectorRef); // À injecter si ChangeDetectionStrategy.OnPush est utilisé.

  // --- ÉTAT DU COMPOSANT ---
  /** Liste des événements non encore notés par l'utilisateur. */
  unratedEvents: Evenement[] = [];
  /** ID de l'événement actuellement sélectionné pour la notation. */
  selectedEventId: number | null = null;
  /** Objet événement complet correspondant à `selectedEventId`. */
  selectedEvent: Evenement | null = null;

  /** Modèle de données pour les notes des critères (0-5). */
  ratingModel: EventRatingPayload = { ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0 };
  /** Critères de notation à afficher avec leurs clés et libellés. */
  ratingCriteria: Array<{ key: keyof EventRatingPayload, label: string }> = [
    { key: 'ambiance', label: 'Ambiance générale de l\'événement' },
    { key: 'proprete', label: 'Propreté des lieux et installations' },
    { key: 'organisation', label: 'Qualité de l\'organisation' },
    { key: 'fairPlay', label: 'Respect et fair-play des participants' },
    { key: 'niveauJoueurs', label: 'Niveau de jeu global des participants' }
  ];

  /** Indique si le chargement des événements est en cours. */
  isLoading: boolean = false;
  /** Indique si la soumission d'une notation est en cours. */
  isSubmitting: boolean = false;

  private unratedEventsSubscription: Subscription | null = null; // Gère la désinscription si nécessaire.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Lance le chargement des événements non notés.
   */
  ngOnInit(): void {
    console.log("NotationComponent: Initialisation.");
    this.loadUnratedEvents();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction. Désabonne les Observables actifs.
   */
  ngOnDestroy(): void {
    // Cette méthode est utilisée pour désinscrire les Observables.
    // Assurez-vous que tous les abonnements importants sont ajoutés à `this.unratedEventsSubscription`
    // ou à un tableau de `Subscription` si vous avez plusieurs abonnements.
    this.unratedEventsSubscription?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadUnratedEvents
   * @description Charge la liste des événements non encore notés par l'utilisateur.
   * Réinitialise la sélection et le modèle de notation.
   */
  loadUnratedEvents(): void {
    this.isLoading = true;
    this.unratedEvents = [];
    this.selectedEventId = null;
    this.selectedEvent = null;
    this.resetRatingModel();

    console.log("NotationComponent: Chargement des événements non notés.");
    if (this.unratedEventsSubscription) {
      this.unratedEventsSubscription.unsubscribe(); // Annule l'ancien abonnement.
    }
    this.unratedEventsSubscription = this.eventService.getUnratedParticipatedEvents().subscribe({
      next: (events: Evenement[]) => {
        this.unratedEvents = events;
        console.log(`NotationComponent: ${events.length} événements non notés chargés.`);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.notification.show("Erreur lors du chargement des événements à noter.", 'error');
        console.error("NotationComponent: Erreur chargement événements à noter:", err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // --- GESTION DE LA SÉLECTION D'ÉVÉNEMENT ---
  /**
   * @method onEventSelected
   * @description Appelé lors de la sélection d'un événement. Met à jour l'événement sélectionné
   * et réinitialise le modèle de notation.
   */
  onEventSelected(): void {
    if (this.selectedEventId) {
      this.selectedEvent = this.unratedEvents.find(event => event.id === +this.selectedEventId!) || null;
      this.resetRatingModel();
      console.log("NotationComponent: Événement sélectionné:", this.selectedEvent ? this.selectedEvent.nom : "Aucun");
    } else {
      this.selectedEvent = null;
    }
  }

  // --- GESTION DE LA NOTATION ---
  /**
   * @method onRatingUpdate
   * @description Gère l'événement `ratingChanged` du composant `ItemnotationComponent`.
   * Met à jour la note pour le critère spécifié.
   * @param criterionKey La clé du critère.
   * @param ratingValue La nouvelle note (1 à 5).
   */
  onRatingUpdate(criterionKey: keyof EventRatingPayload, ratingValue: number): void {
    if (Object.prototype.hasOwnProperty.call(this.ratingModel, criterionKey)) {
      console.log(`NotationComponent: Mise à jour pour critère "${criterionKey}", nouvelle note (1-5): ${ratingValue}`);
      this.ratingModel[criterionKey] = ratingValue;
    } else {
      console.error(`NotationComponent: Clé de critère invalide reçue: ${String(criterionKey)}`);
    }
  }

  /**
   * @method isRatingComplete
   * @description Vérifie si tous les critères de notation ont une note valide (1-5).
   */
  isRatingComplete(): boolean {
    return this.ratingCriteria.every(crit =>
      this.ratingModel[crit.key] >= 1 && this.ratingModel[crit.key] <= 5
    );
  }

  /**
   * @method submitRating
   * @description Soumet la notation de l'événement sélectionné.
   * Valide la sélection et la complétion des notes.
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
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    console.log(`NotationComponent: Soumission de la notation pour l'événement ID ${this.selectedEventId}:`, this.ratingModel);
    this.eventService.submitEventRating(this.selectedEventId, this.ratingModel).subscribe({
      next: (response: Notation) => {
        this.isSubmitting = false;
        this.notification.show(`Votre notation pour l'événement "${this.selectedEvent?.nom || 'cet événement'}" a été enregistrée avec succès !`, 'success');
        console.log("NotationComponent: Notation enregistrée:", response);
        this.loadUnratedEvents(); // Recharge la liste pour retirer l'événement noté.
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        console.error("NotationComponent: Erreur lors de la soumission de la notation:", err);
        this.notification.show(`Erreur lors de l'enregistrement de la notation: ${err.error?.message || err.message || 'Erreur inconnue.'}`, 'error');
      }
    });
  }

  /**
   * @method resetRatingModel
   * @description Réinitialise toutes les notes dans `ratingModel` à 0.
   */
  resetRatingModel(): void {
    this.ratingModel = { ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0 };
    console.log("NotationComponent: Modèle de notation réinitialisé.");
  }
}

import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {EventService} from '../../../service/crud/event.service';
import {Evenement} from '../../../model/evenement';
import {EventRatingPayload, Notation} from '../../../model/notation';
import {LucideAngularModule} from 'lucide-angular';
import {DatePipe} from '@angular/common';
import {ItemnotationComponent} from '../../../component/notation/itemnotation/itemnotation.component';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-notation',
  imports: [
    FormsModule,
    LucideAngularModule,
    DatePipe,
    ItemnotationComponent
  ],
  templateUrl: './notation.component.html',
  styleUrl: './notation.component.scss'
})
export class NotationComponent {
  private eventService = inject(EventService);
  private notification = inject(SweetAlertService);

  unratedEvents: Evenement[] = [];
  selectedEventId: number | null = null;
  selectedEvent: Evenement | null = null;

  ratingModel: EventRatingPayload = {ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0};
  ratingCriteria: Array<{ key: keyof EventRatingPayload, label: string }> = [
    {key: 'ambiance', label: 'Ambiance'}, {key: 'proprete', label: 'Propreté'},
    {key: 'organisation', label: 'Organisation'}, {key: 'fairPlay', label: 'Fair-play'},
    {key: 'niveauJoueurs', label: 'Niveau des joueurs'}
  ];

  isLoading: boolean = false;
  isSubmitting: boolean = false;
  stars: number[] = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.loadUnratedEvents();
  }

  loadUnratedEvents(): void {
    this.isLoading = true;
    this.unratedEvents = [];
    this.selectedEventId = null;
    this.selectedEvent = null;
    this.resetRatingModel();

    this.eventService.getUnratedParticipatedEvents().subscribe({ // Appelle la méthode du service mise à jour
      next: (events) => {
        this.unratedEvents = events;
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.show("Erreur chargement des événements à noter.", 'error');
        console.error(err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onEventSelected(): void {
    if (this.selectedEventId) {
      this.selectedEvent = this.unratedEvents.find(event => event.id === +this.selectedEventId!) || null;
      this.resetRatingModel();
    } else {
      this.selectedEvent = null;
    }
  }

  setRating(criterion: keyof EventRatingPayload, value: number): void {
    this.ratingModel[criterion] = value;
  }

  isRatingComplete(): boolean {
    return this.ratingCriteria.every(crit => this.ratingModel[crit.key] >= 1 && this.ratingModel[crit.key] <= 5);
  }

  submitRating(): void {
    if (!this.selectedEventId || !this.isRatingComplete()) {
      this.notification.show('Sélectionnez un événement et notez tous les critères (1-5).', 'warning');
      return;
    }
    this.isSubmitting = true;
    this.eventService.submitEventRating(this.selectedEventId, this.ratingModel).subscribe({
      // Le type de 'response' est maintenant Notation si le service est mis à jour
      next: (response: Notation) => {
        this.isSubmitting = false;
        this.notification.show(`Notation pour "${this.selectedEvent?.nom}" enregistrée !`, 'success');
        this.loadUnratedEvents(); // Recharger
      },
      error: (err) => {
        this.isSubmitting = false;
        this.notification.show(`Erreur enregistrement notation. ${err.message || ''}`, 'error');
        console.error(err);
      }
    });
  }

  resetRatingModel(): void {
    this.ratingModel = {ambiance: 0, proprete: 0, organisation: 0, fairPlay: 0, niveauJoueurs: 0};
  }

  // Méthode pour gérer la mise à jour de n'importe quel critère (reçoit la note 1-5)
  onRatingUpdate(criterionKey: keyof EventRatingPayload, rating5: number): void {
    // Vérifier si la clé est valide (mesure de sécurité optionnelle)
    if (this.ratingModel.hasOwnProperty(criterionKey)) {
      console.log(`Critère: ${criterionKey}, Note reçue (1-5): ${rating5}`);
      // Mettre à jour directement le modèle avec la note 1-5 reçue
      this.ratingModel[criterionKey] = rating5;
    } else {
      console.error(`Clé de critère invalide reçue: ${criterionKey}`);
    }
  }
}

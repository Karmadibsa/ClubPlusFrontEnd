import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { ReservationService } from '../../../service/crud/reservation.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Reservation } from '../../../model/reservation';
import { ReservationStatus } from '../../../model/reservationstatus';
import { FormsModule } from '@angular/forms';

/**
 * Modale affichant la liste des participations pour un événement spécifique.
 *
 * Ce composant récupère les réservations via un service, permet de les filtrer
 * par statut (côté serveur) et par nom/prénom (côté client).
 *
 * @example
 * <app-participation-event-modal
 * [isVisible]="isModalOpen"
 * [eventId]="selectedEventId"
 * [eventTitle]="selectedEventTitle"
 * (closeModal)="closeModal()">
 * </app-participation-event-modal>
 */
@Component({
  selector: 'app-participation-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule
  ],
  templateUrl: './participation-event-modal.component.html',
  styleUrl: './participation-event-modal.component.scss'
})
export class ParticipationEventModalComponent implements OnInit, OnChanges {

  /** Contrôle la visibilité de la modale. */
  @Input() isVisible = false;

  /** L'ID de l'événement pour lequel afficher les réservations. */
  @Input() eventId: number | null = null;

  /** Le titre de l'événement affiché dans l'en-tête. */
  @Input() eventTitle: string = 'Réservations';

  /** Émis lorsque la fermeture de la modale est demandée. */
  @Output() closeModal = new EventEmitter<void>();

  /** Expose l'énumération `ReservationStatus` au template. */
  public readonly reservationStatus = ReservationStatus;

  /** La liste des réservations effectivement affichée dans le template. */
  public filteredReservations: Reservation[] = [];
  /** Le terme de recherche lié au champ de saisie. */
  public searchTerm: string = '';
  /** Indique si un chargement de données est en cours. */
  public isLoading = false;
  /** Stocke un message d'erreur en cas d'échec du chargement. */
  public error: string | null = null;
  /** Le filtre de statut actuellement appliqué. */
  public currentFilter: ReservationStatus | null = null;

  /** La liste complète des réservations pour le statut actuel, servant de source pour le filtre de recherche. */
  private allReservationsForStatus: Reservation[] = [];

  private readonly reservationService = inject(ReservationService);
  private readonly cdr = inject(ChangeDetectorRef);

  /**
   * Détecte les changements sur les `Input` pour charger ou recharger les données.
   */
  ngOnChanges(changes: SimpleChanges): void {
    const isNowVisible = changes['isVisible']?.currentValue === true && !changes['isVisible']?.previousValue;

    if (isNowVisible) {
      if (this.eventId !== null) {
        this.loadReservations();
      } else {
        this.error = "Aucun événement n'est spécifié pour afficher les participations.";
        this.allReservationsForStatus = [];
        this.filteredReservations = [];
      }
    }
  }

  ngOnInit(): void {
    // La logique de chargement est principalement gérée dans ngOnChanges
    // pour s'assurer qu'elle se déclenche lorsque la modale devient visible.
  }

  /**
   * Charge les réservations depuis le service en fonction de l'ID de l'événement
   * et du filtre de statut actuel.
   * @param status - Le statut à utiliser pour le filtre. Utilise `currentFilter` par défaut.
   */
  public loadReservations(status: ReservationStatus | null = this.currentFilter): void {
    if (this.eventId === null) {
      this.error = "ID de l'événement manquant.";
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.currentFilter = status;

    this.reservationService.getReservationsByEvent(this.eventId, status).pipe(
      tap(data => {
        this.allReservationsForStatus = data;
        this.applyClientSideFilters();
      }),
      catchError(err => {
        this.error = "Impossible de charger la liste des participations.";
        this.allReservationsForStatus = [];
        this.filteredReservations = [];
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe();
  }

  /**
   * Applique un filtre par statut en rechargeant les données.
   * @param status - Le statut à appliquer, ou `null` pour tous.
   */
  public applyFilter(status: ReservationStatus | null): void {
    this.searchTerm = '';
    this.loadReservations(status);
  }

  /**
   * Déclenchée lors de la saisie dans le champ de recherche.
   */
  public onSearchTermChange(): void {
    this.applyClientSideFilters();
  }

  /**
   * Filtre la liste des réservations en fonction du `searchTerm` côté client.
   */
  private applyClientSideFilters(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase();

    if (!searchTermLower) {
      this.filteredReservations = [...this.allReservationsForStatus];
    } else {
      this.filteredReservations = this.allReservationsForStatus.filter(resa =>
        (resa.membre?.nom?.toLowerCase().includes(searchTermLower) ||
          resa.membre?.prenom?.toLowerCase().includes(searchTermLower))
      );
    }
    this.cdr.markForCheck();
  }

  /**
   * Gère la demande de fermeture de la modale.
   */
  public onClose(): void {
    this.searchTerm = '';
    this.currentFilter = null;
    this.allReservationsForStatus = [];
    this.filteredReservations = [];
    this.error = null;
    this.isLoading = false;
    this.closeModal.emit();
  }

  /**
   * Empêche un clic à l'intérieur de la modale de la fermer.
   * @param event - L'événement de clic.
   */
  public stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Vérifie si un filtre de statut est actuellement actif pour le style des boutons.
   * @param status - Le statut à vérifier.
   */
  public isFilterActive(status: ReservationStatus | null): boolean {
    return this.currentFilter === status;
  }
}

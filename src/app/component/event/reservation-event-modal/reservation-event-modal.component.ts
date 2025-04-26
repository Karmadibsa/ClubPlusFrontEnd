import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ReservationService} from '../../../service/reservation.service';
import {catchError, finalize, tap} from 'rxjs/operators';
import {of} from 'rxjs';
import {DatePipe, LowerCasePipe} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {Reservation} from '../../../model/reservation';
import {ReservationStatus} from '../../../model/reservationstatus';

@Component({
  selector: 'app-reservation-event-modal',
  imports: [
    DatePipe,
    LowerCasePipe,
    LucideAngularModule
  ],
  templateUrl: './reservation-event-modal.component.html',
  styleUrl: './reservation-event-modal.component.scss'
})
export class ReservationEventModalComponent implements OnInit, OnChanges {
  @Input() eventId: number | null = null;
  @Input() eventTitle: string = 'Réservations';
  @Output() closeModal = new EventEmitter<void>();

  readonly reservationStatus = ReservationStatus; // Expose l'enum au template
  private reservationService = inject(ReservationService);
  private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

  reservations: Reservation[] = []; // Stocker directement les réservations
  isLoading = false;
  error: string | null = null;
  currentFilter: ReservationStatus | null = null; // Pour le filtre actuel

  ngOnChanges(changes: SimpleChanges): void {
    // Recharger si eventId change pendant que la modale est ouverte
    if (changes['eventId'] && !changes['eventId'].firstChange && this.eventId !== null) {
      this.loadReservations(); // Charge avec le filtre courant (ou sans filtre si null)
    }
  }

  ngOnInit(): void {
    // Chargement initial
    if (this.eventId !== null) {
      this.loadReservations(); // Charge toutes les réservations initialement
    }
  }

  loadReservations(status: ReservationStatus | null = this.currentFilter): void {
    if (this.eventId === null) return;

    this.isLoading = true;
    this.error = null;
    this.currentFilter = status; // Met à jour le filtre courant

    this.reservationService.getReservationsByEvent(this.eventId, status).pipe(
      tap(data => { // Utilise tap pour l'effet de bord (stockage)
        this.reservations = data;
        console.log(`Réservations chargées pour l'event ${this.eventId} avec filtre ${status}:`, data);
      }),
      catchError(err => {
        console.error("Erreur chargement réservations:", err);
        this.error = "Impossible de charger les réservations.";
        this.reservations = []; // Vide le tableau en cas d'erreur
        return of([]); // Continue le flux pour finalize
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck(); // Notifie Angular du changement (important avec OnPush)
      })
    ).subscribe(); // On doit s'abonner pour déclencher l'observable
  }

  // Méthode appelée par les boutons de filtre
  applyFilter(status: ReservationStatus | null): void {
    this.loadReservations(status);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  // Helper pour vérifier si un filtre est actif (pour le style des boutons)
  isFilterActive(status: ReservationStatus | null): boolean {
    return this.currentFilter === status;
  }
}


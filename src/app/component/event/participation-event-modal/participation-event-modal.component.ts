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
import {ReservationService} from '../../../service/model/reservation.service';
import {catchError, finalize, tap} from 'rxjs/operators';
import {of} from 'rxjs';
import {DatePipe, LowerCasePipe} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {Reservation} from '../../../model/reservation';
import {ReservationStatus} from '../../../model/reservationstatus';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-participation-event-modal',
    imports: [
        DatePipe,
        LowerCasePipe,
        LucideAngularModule,
        FormsModule
    ],
    templateUrl: './participation-event-modal.component.html',
    styleUrl: './participation-event-modal.component.scss'
})
export class ParticipationEventModalComponent implements OnInit, OnChanges {
    @Input() isVisible = false;
    @Input() eventId: number | null = null;
    @Input() eventTitle: string = 'Réservations';
    @Output() closeModal = new EventEmitter<void>();

    readonly reservationStatus = ReservationStatus; // Expose l'enum au template
    private reservationService = inject(ReservationService);
    private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

    private allReservationsForStatus: Reservation[] = []; // Stocke la liste complète pour le statut actuel
    filteredReservations: Reservation[] = []; // <<< Liste affichée après TOUS les filtres
    searchTerm: string = ''; // <<< Propriété pour le terme de recherche


    reservations: Reservation[] = []; // Stocker directement les réservations
    isLoading = false;
    error: string | null = null;
    currentFilter: ReservationStatus | null = null; // Pour le filtre actuel

    ngOnChanges(changes: SimpleChanges): void {
        // Si l'ID de l'événement change pendant que la modale est visible
        if (changes['eventId'] && this.isVisible && this.eventId !== null) {
            // Réinitialise le filtre et recharge TOUT pour le nouvel événement
            this.searchTerm = ''; // Réinitialise la recherche
            this.loadReservations(this.currentFilter); // Recharge avec le filtre de statut actuel
        }
        // Si la modale devient visible (et ne l'était pas avant), charger les données
        if (changes['isVisible'] && changes['isVisible'].currentValue === true && !changes['isVisible'].previousValue) {
            if (this.eventId !== null) {
                this.loadReservations(this.currentFilter); // Charge avec le filtre de statut actuel
            }
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
        this.currentFilter = status;

        this.reservationService.getReservationsByEvent(this.eventId, status).pipe(
            tap(data => {
                this.allReservationsForStatus = data; // Stocke la liste brute pour ce statut
                this.applyClientSideFilters(); // Applique le filtre de recherche sur cette liste brute
            }),
            catchError(err => {
                console.error("Erreur chargement réservations:", err);
                this.error = "Impossible de charger les réservations.";
                this.allReservationsForStatus = [];
                this.filteredReservations = []; // Vide aussi la liste filtrée
                return of([]);
            }),
            finalize(() => {
                this.isLoading = false;
                this.cdr.markForCheck(); // Notifie Angular du changement
            })
        ).subscribe();
    }

    // Applique le filtre sur les boutons de statut
    applyFilter(status: ReservationStatus | null): void {
        this.searchTerm = ''; // Réinitialise la recherche quand on change de statut
        this.loadReservations(status); // Recharge les données pour le nouveau statut
    }

    // Appelée quand le terme de recherche change
    onSearchTermChange(): void {
        this.applyClientSideFilters(); // Réapplique le filtre client sur la liste déjà chargée
    }

    // Filtre la liste `allReservationsForStatus` basée sur `searchTerm`
    applyClientSideFilters(): void {
        const searchTermLower = this.searchTerm.trim().toLowerCase();

        if (!searchTermLower) {
            // Si pas de terme de recherche, affiche toutes les résas pour le statut courant
            this.filteredReservations = [...this.allReservationsForStatus];
        } else {
            // Sinon, filtre la liste brute
            this.filteredReservations = this.allReservationsForStatus.filter(resa =>
                (resa.membre?.nom?.toLowerCase().includes(searchTermLower) ||
                    resa.membre?.prenom?.toLowerCase().includes(searchTermLower))
            );
        }
        this.cdr.markForCheck(); // Notifie Angular de la mise à jour de la liste filtrée
    }

    onClose(): void {
        // Optionnel: Réinitialiser l'état avant de fermer
        this.searchTerm = '';
        this.currentFilter = null;
        this.allReservationsForStatus = [];
        this.filteredReservations = [];
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


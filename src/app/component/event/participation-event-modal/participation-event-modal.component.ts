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
import { DatePipe, LowerCasePipe, CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Reservation } from '../../../model/reservation';
import { ReservationStatus } from '../../../model/reservationstatus';
import { FormsModule } from '@angular/forms';

/**
 * @Component décorateur qui configure le composant.
 */
@Component({
  selector: 'app-participation-event-modal', // Sélecteur pour utiliser ce composant.
  standalone: true,                          // Indique que c'est un composant autonome.
  imports: [
    CommonModule,                             // Pour *ngIf, *ngFor, et les pipes DatePipe, LowerCasePipe.
    LucideAngularModule,                      // Pour les icônes.
    FormsModule                               // Pour [(ngModel)] sur le champ de recherche.
    // DatePipe et LowerCasePipe n'ont pas besoin d'être listés ici explicitement
    // s'ils sont exportés par CommonModule, ce qui est le cas.
  ],
  templateUrl: './participation-event-modal.component.html', // Template HTML de la modale.
  styleUrl: './participation-event-modal.component.scss'    // Styles SCSS spécifiques.
  // changeDetection: ChangeDetectionStrategy.OnPush, // Pourrait être ajouté pour optimiser.
})
// Implémente OnInit (pour le chargement initial) et OnChanges (pour réagir aux changements d'Inputs).
export class ParticipationEventModalComponent implements OnInit, OnChanges {
  // --- INPUTS & OUTPUTS ---

  /**
   * @Input() isVisible
   * @description Contrôle la visibilité de la modale depuis le composant parent.
   */
  @Input() isVisible = false;

  /**
   * @Input() eventId
   * @description L'ID de l'événement pour lequel afficher les réservations.
   *              `null` si aucun événement n'est spécifié.
   */
  @Input() eventId: number | null = null;

  /**
   * @Input() eventTitle
   * @description Le titre de l'événement, affiché dans l'en-tête de la modale.
   *              Initialisé à "Réservations" par défaut.
   */
  @Input() eventTitle: string = 'Réservations'; // Valeur par défaut.

  /**
   * @Output() closeModal
   * @description Événement émis vers le parent lorsque la modale demande à être fermée.
   */
  @Output() closeModal = new EventEmitter<void>();

  // --- PROPRIÉTÉS INTERNES ---

  /**
   * @property readonly reservationStatus
   * @description Expose l'énumération `ReservationStatus` au template HTML pour pouvoir
   *              l'utiliser (ex: dans des boutons de filtre, avec `reservationStatus.CONFIRME`).
   */
  readonly reservationStatus = ReservationStatus;

  // Injection des services.
  private reservationService = inject(ReservationService);
  private cdr = inject(ChangeDetectorRef); // Pour notifier Angular des changements (utile avec OnPush ou opérations asynchrones).

  /**
   * @property allReservationsForStatus
   * @description Stocke la liste *complète* des réservations récupérées de l'API pour le `currentFilter` (statut) actif.
   *              Cette liste sert de source de vérité pour le filtrage de recherche côté client.
   */
  private allReservationsForStatus: Reservation[] = [];

  /**
   * @property filteredReservations
   * @description La liste des réservations qui est *effectivement affichée* dans le template.
   *              Elle est le résultat du filtrage par `currentFilter` (via API) PUIS par `searchTerm` (côté client).
   */
  filteredReservations: Reservation[] = [];

  /**
   * @property searchTerm
   * @description Le terme de recherche saisi par l'utilisateur dans le champ de recherche.
   *              Lié via `[(ngModel)]` dans le template.
   */
  searchTerm: string = '';

  /**
   * @property isLoading
   * @description Booléen pour indiquer si un chargement de données est en cours (appel API).
   *              Permet d'afficher un indicateur de chargement dans l'UI.
   */
  isLoading = false;

  /**
   * @property error
   * @description Stocke un message d'erreur si le chargement des réservations échoue.
   *              Permet d'afficher une notification d'erreur dans l'UI.
   */
  error: string | null = null;

  /**
   * @property currentFilter
   * @description Le statut de réservation (`ReservationStatus`) actuellement appliqué comme filtre principal.
   *              `null` signifie "tous les statuts" (ou le comportement par défaut de l'API).
   */
  currentFilter: ReservationStatus | null = null;

  /**
   * @method ngOnChanges
   * @description Réagit aux changements des propriétés @Input.
   *              Si `eventId` change pendant que la modale est visible, recharge les réservations.
   *              Si la modale devient visible (`isVisible` passe à `true`), charge les réservations.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Scénario 1: L'ID de l'événement change alors que la modale est déjà ouverte.
    if (changes['eventId'] && this.isVisible && this.eventId !== null) {
      console.log('ParticipationModal: eventId a changé, rechargement des réservations.');
      this.searchTerm = ''; // Réinitialise la recherche textuelle.
      this.loadReservations(this.currentFilter); // Recharge avec le filtre de statut actuel.
    }

    // Scénario 2: La modale devient visible.
    // `changes['isVisible'].currentValue === true` : la nouvelle valeur est true.
    // `!changes['isVisible'].previousValue` : la valeur précédente n'était pas true (donc false, undefined, ou premier changement).
    if (changes['isVisible'] && changes['isVisible'].currentValue === true && !changes['isVisible'].previousValue) {
      console.log('ParticipationModal: Modale devient visible, chargement des réservations.');
      if (this.eventId !== null) {
        this.loadReservations(this.currentFilter); // Charge avec le filtre de statut actuel.
      } else {
        console.warn('ParticipationModal: Tentative d\'ouverture sans eventId.');
        this.error = "Aucun événement n'est spécifié pour afficher les participations.";
        this.allReservationsForStatus = [];
        this.filteredReservations = [];
      }
    }
  }

  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie appelé une fois après l'initialisation des @Input.
   *              Charge les réservations si un `eventId` est déjà fourni et si la modale est visible (bien que
   *              ngOnChanges gère déjà le cas où isVisible devient true). Il est plus sûr ici de
   *              charger si `eventId` est présent, ngOnChanges gérera la visibilité.
   */
  ngOnInit(): void {
    console.log('ParticipationModal: ngOnInit - eventId:', this.eventId);
  }

  /**
   * @method loadReservations
   * @description Charge les réservations pour l'`eventId` actuel depuis le `ReservationService`.
   *              Applique le filtre de statut (`status`) fourni lors de l'appel API.
   * @param status Le `ReservationStatus` à utiliser pour filtrer les réservations côté serveur.
   *               Si `null`, l'API peut retourner tous les statuts ou avoir un défaut.
   */
  loadReservations(status: ReservationStatus | null = this.currentFilter): void {
    if (this.eventId === null) {
      console.warn('ParticipationModal: loadReservations appelé sans eventId.');
      this.error = "ID de l'événement manquant pour charger les réservations.";
      return;
    }

    this.isLoading = true;    // Active l'indicateur de chargement.
    this.error = null;        // Réinitialise les erreurs précédentes.
    this.currentFilter = status; // Met à jour le filtre de statut actif.

    console.log(`ParticipationModal: Chargement des réservations pour eventId ${this.eventId} avec statut ${status || 'TOUS'}.`);

    this.reservationService.getReservationsByEvent(this.eventId, status).pipe(
      tap(data => {
        console.log('ParticipationModal: Données de réservation reçues de lAPI:', data);
        this.allReservationsForStatus = data; // Stocke la liste brute pour ce statut.
        this.applyClientSideFilters();      // Applique ensuite le filtre de recherche textuelle.
      }),
      catchError(err => {
        console.error("ParticipationModal: Erreur lors du chargement des réservations:", err);
        this.error = "Impossible de charger la liste des participations.";
        this.allReservationsForStatus = []; // Vide les listes en cas d'erreur.
        this.filteredReservations = [];
        return of([]); // Retourne un Observable vide pour que la chaîne ne se brise pas.
      }),
      finalize(() => { // Exécuté que la requête réussisse ou échoue.
        this.isLoading = false; // Désactive l'indicateur de chargement.
        // `markForCheck()` est important si ce composant ou ses parents utilisent
        // la stratégie de détection de changements `OnPush`. Il notifie Angular
        // que l'état interne du composant a changé et qu'il doit être vérifié.
        this.cdr.markForCheck();
      })
    ).subscribe(); // S'abonne pour déclencher la requête HTTP.
  }

  /**
   * @method applyFilter
   * @description Applique un filtre de statut (ex: 'CONFIRME', 'ANNULE') en rechargeant les données
   *              depuis le serveur avec ce nouveau filtre de statut.
   *              Réinitialise également le filtre de recherche textuelle.
   * @param status Le `ReservationStatus` à appliquer, ou `null` pour tous les statuts.
   */
  applyFilter(status: ReservationStatus | null): void {
    console.log('ParticipationModal: Application du filtre de statut:', status);
    this.searchTerm = ''; // Réinitialise la recherche textuelle lors du changement de filtre de statut.
    this.loadReservations(status); // Recharge les données avec le nouveau filtre de statut.
  }

  /**
   * @method onSearchTermChange
   * @description Appelée lorsque la valeur du champ de recherche (`searchTerm`) change
   *              (généralement via `(ngModelChange)` ou `(input)` dans le template).
   *              Réapplique le filtre de recherche textuelle côté client sur la liste
   *              `allReservationsForStatus` déjà chargée.
   */
  onSearchTermChange(): void {
    console.log('ParticipationModal: Terme de recherche a changé:', this.searchTerm);
    this.applyClientSideFilters();
  }

  /**
   * @method applyClientSideFilters
   * @description Filtre la liste `this.allReservationsForStatus` (qui contient les réservations
   *              pour le `currentFilter` de statut) en fonction du `this.searchTerm` actuel.
   *              Met à jour `this.filteredReservations` qui est la liste affichée.
   *              Ce filtrage est purement côté client.
   */
  applyClientSideFilters(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Prépare le terme de recherche.

    if (!searchTermLower) {
      // Si le terme de recherche est vide, la liste filtrée est une copie de la liste brute pour le statut.
      this.filteredReservations = [...this.allReservationsForStatus];
    } else {
      // Sinon, filtre `allReservationsForStatus` pour trouver les correspondances.
      // Recherche dans le nom ou le prénom du membre associé à la réservation.
      // L'utilisation de `?.` (optional chaining) est cruciale car `membre`, `nom`, ou `prenom`
      // pourraient être `null` ou `undefined`.
      this.filteredReservations = this.allReservationsForStatus.filter(resa =>
        (resa.membre?.nom?.toLowerCase().includes(searchTermLower) ||
          resa.membre?.prenom?.toLowerCase().includes(searchTermLower))
      );
    }
    console.log('ParticipationModal: Liste après filtre client:', this.filteredReservations);
    // Notifie Angular de la mise à jour de `filteredReservations` pour rafraîchir la vue.
    this.cdr.markForCheck();
  }

  /**
   * @method onClose
   * @description Gère la demande de fermeture de la modale.
   *              Réinitialise l'état interne (filtres, listes) et émet l'événement `closeModal`.
   */
  onClose(): void {
    console.log('ParticipationModal: Demande de fermeture.');
    // Réinitialisation optionnelle de l'état pour une "propreté" lors de la prochaine ouverture.
    this.searchTerm = '';
    this.currentFilter = null;
    this.allReservationsForStatus = [];
    this.filteredReservations = [];
    this.error = null;
    this.isLoading = false; // S'assurer que le chargement est arrêté.

    this.closeModal.emit(); // Émet l'événement pour que le parent ferme la modale.
  }

  /**
   * @method stopPropagation
   * @description Empêche la propagation d'un événement (typiquement un clic) vers les éléments parents.
   *              Utilisé sur le contenu de la modale pour éviter qu'un clic à l'intérieur
   *              ne ferme la modale si le parent a une logique de "clic à l'extérieur pour fermer".
   * @param event L'objet événement DOM.
   */
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  /**
   * @method isFilterActive
   * @description Fonction d'aide pour le template, permettant de savoir si un bouton de filtre de statut
   *              correspond au `currentFilter` actif (pour appliquer un style visuel, par exemple).
   * @param status Le statut à vérifier.
   * @returns `true` si `status` est le filtre de statut actuellement appliqué.
   */
  isFilterActive(status: ReservationStatus | null): boolean {
    return this.currentFilter === status;
  }
}

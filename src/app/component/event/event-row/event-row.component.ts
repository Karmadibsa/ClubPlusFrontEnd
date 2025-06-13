import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { EditEventModalComponent } from '../edit-event/edit-event.component';
import { Evenement } from '../../../model/evenement';
import { ParticipationEventModalComponent } from '../participation-event-modal/participation-event-modal.component';
import { SweetAlertService } from '../../../service/sweet-alert.service';

/**
 * Affiche une seule ligne d'un événement dans un tableau.
 *
 * Ce composant est conçu pour être utilisé comme un attribut sur un élément `<tr>`.
 * Il affiche les informations de l'événement et gère les actions de l'utilisateur
 * telles que la modification, la suppression et la visualisation des participations
 * en contrôlant ses propres modales.
 *
 * @example
 * <tr app-event-row [evenement]="monEvent" (deleteRequest)="..." (eventUpdated)="..."></tr>
 */
@Component({
  selector: '[app-event-row]', // Sélecteur d'attribut pour s'attacher à un <tr>
  standalone: true,
  imports: [
    DatePipe,
    LucideAngularModule,
    EditEventModalComponent,
    ParticipationEventModalComponent
  ],
  templateUrl: './event-row.component.html',
  styleUrls: ['./event-row.component.scss']
})
export class EventRowComponent {

  /** L'objet `Evenement` à afficher dans cette ligne. Requis. */
  @Input() evenement!: Evenement;

  /** Émis lorsque l'utilisateur confirme la suppression de l'événement. */
  @Output() deleteRequest = new EventEmitter<Evenement>();

  /** Émis avec les données à jour après une modification réussie de l'événement. */
  @Output() eventUpdated = new EventEmitter<Evenement>();

  /** Contrôle la visibilité de la modale d'édition. */
  public isModalEditVisible = false;

  /** Contrôle la visibilité de la modale des participations. */
  public isParticipationModalVisible = false;

  private readonly swalService = inject(SweetAlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  // =================================================================================================
  // == GESTION DE LA MODALE D'ÉDITION
  // =================================================================================================

  /**
   * Ouvre la modale d'édition pour l'événement de cette ligne.
   */
  public ouvrirModalEditionDeLigne(): void {
    this.isModalEditVisible = true;
    this.cdr.detectChanges();
  }

  /**
   * Ferme la modale d'édition.
   */
  public fermerModalEditionDeLigne(): void {
    this.isModalEditVisible = false;
    this.cdr.detectChanges();
  }

  /**
   * Gère la sauvegarde réussie depuis la modale d'édition.
   * Ferme la modale et propage l'événement mis à jour au composant parent.
   * @param evenementModifie - L'objet Evenement avec les nouvelles données.
   */
  public handleSaveSuccessEditionDeLigne(evenementModifie: Evenement): void {
    this.fermerModalEditionDeLigne();
    this.eventUpdated.emit(evenementModifie);
  }

  // =================================================================================================
  // == GESTION DE LA MODALE DE PARTICIPATION
  // =================================================================================================

  /**
   * Ouvre la modale des participations pour l'événement de cette ligne.
   */
  public ouvrirModalParticipation(): void {
    if (this.evenement) {
      this.isParticipationModalVisible = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * Ferme la modale des participations.
   */
  public handleCloseParticipationModal(): void {
    this.isParticipationModalVisible = false;
    this.cdr.detectChanges();
  }

  // =================================================================================================
  // == ACTIONS
  // =================================================================================================

  /**
   * Demande une confirmation à l'utilisateur avant d'émettre une requête
   * de suppression au composant parent.
   */
  public requestDelete(): void {
    this.swalService.confirmAction(
      'Désactiver cet événement ?',
      `Êtes-vous sûr de vouloir désactiver l'événement "${this.evenement.nom}" ?`,
      () => {
        this.deleteRequest.emit(this.evenement);
      },
      'Oui, désactiver'
    );
  }
}

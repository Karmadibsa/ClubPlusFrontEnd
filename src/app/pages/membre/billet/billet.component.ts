import {
  Component,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { Subscription } from 'rxjs';

import { ReservationRowComponent } from '../../../component/reservation/reservation-row/reservation-row.component';
import { QRCodeComponent } from 'angularx-qrcode';

import { Reservation } from '../../../model/reservation';
import { SafeUrl } from '@angular/platform-browser';

import { ReservationService } from '../../../service/crud/reservation.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import jsPDF from 'jspdf';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component BilletComponent
 * @description Page permettant aux utilisateurs de visualiser et gérer leurs réservations (billets).
 * Affiche les réservations, génère des QR codes et PDF, et permet d'annuler des réservations.
 */
@Component({
  selector: 'app-billet',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    ReservationRowComponent,
    QRCodeComponent
  ],
  templateUrl: './billet.component.html',
  styleUrl: './billet.component.scss'
})
export class BilletComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private notification = inject(SweetAlertService);
  private reservationService = inject(ReservationService);
  private fb = inject(FormBuilder);

  // --- ÉTAT DU COMPOSANT ---
  /** Réservation actuellement sélectionnée pour affichage (ex: QR code, PDF). */
  selectedTicket: Reservation | undefined;
  /** Contrôle la visibilité de la modale affichant le QR code. */
  isModalOpen: boolean = false;
  /** Tableau de toutes les réservations de l'utilisateur courant. */
  reservations: Reservation[] = [];
  /** Formulaire réactif pour filtrer les réservations. */
  reservationForm!: FormGroup;

  /** Message d'erreur à afficher en cas de problème. */
  errorMessage: string | null = null;
  /** Indique si une opération asynchrone est en cours. */
  isLoading: boolean = false;

  private subscriptions: Subscription[] = []; // Gère la désinscription des Observables.

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Initialise le formulaire et charge les réservations.
   */
  ngOnInit(): void {
    console.log("BilletComponent: Initialisation.");
    this.reservationForm = this.fb.group({
      search: [''],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required]
    });

    this.isLoading = true;
    const sub = this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.isLoading = false;
        console.log(`BilletComponent: ${reservations.length} réservations chargées.`);
      },
      error: (err) => {
        this.isLoading = false;
        console.error("BilletComponent: Erreur lors du chargement des réservations:", err);
        this.notification.show("Erreur lors du chargement de vos réservations.", 'error');
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction. Désabonne tous les Observables actifs.
   */
  ngOnDestroy(): void {
    console.log("BilletComponent: Destruction, désinscription des abonnements.");
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }


  // --- GÉNÉRATION DE PDF ---
  /**
   * @method generatePDF
   * @description Génère un document PDF pour la réservation sélectionnée.
   * Inclut les détails de la réservation et un QR code.
   * @param reservation La réservation pour laquelle générer le PDF.
   */
  generatePDF(reservation: Reservation): void {
    this.selectedTicket = reservation;
    console.log(`BilletComponent: Début de la génération PDF pour réservation ID ${reservation.reservationUuid}`);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const mainOrange = '#f26122';
    const mainBlue = '#1a5f7a';

    function hexToRgb(hex: string): { r: number, g: number, b: number } {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    }

    const orangeRgb = hexToRgb(mainOrange);
    doc.setFillColor(orangeRgb.r, orangeRgb.g, orangeRgb.b);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Votre billet Club Plus', pageWidth / 2, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    const eventName = reservation.event?.nom || 'Non spécifié';
    doc.text(`Événement: ${eventName}`, margin, 60);

    const blueRgb = hexToRgb(mainBlue);
    doc.setTextColor(blueRgb.r, blueRgb.g, blueRgb.b);
    doc.setFontSize(12);
    const eventStartDate = reservation.event?.startTime ? new DatePipe('fr-FR').transform(reservation.event.startTime, 'dd/MM/yyyy HH:mm') : 'Non spécifiée';
    doc.text(`Date: ${eventStartDate}`, margin, 70);
    doc.text(`Lieu: ${reservation.event?.location || 'Non spécifié'}`, margin, 80);

    doc.setTextColor(0, 0, 0);
    doc.text(`Catégorie: ${reservation.categorie?.nom || 'Non spécifiée'}`, margin, 90);
    doc.text(`Titulaire: ${reservation.membre?.prenom || ''} ${reservation.membre?.nom || ''}`, margin, 100);

    doc.setFillColor(blueRgb.r, blueRgb.g, blueRgb.b);
    doc.rect(margin, 110, pageWidth - (margin * 2), 1, 'F');
    doc.setTextColor(orangeRgb.r, orangeRgb.g, orangeRgb.b);
    doc.setFontSize(14);
    doc.text('Scannez ce QR code à l\'entrée', pageWidth / 2, 120, { align: 'center' });

    const qrCodeContent = reservation.qrcodeData || reservation.reservationUuid || 'DONNÉE QR MANQUANTE';
    if (qrCodeContent) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      script.onload = () => {
        const canvas = document.createElement('canvas');
        // @ts-ignore
        new window.QRious({ element: canvas, value: qrCodeContent, size: 200, backgroundAlpha: 1 });
        const qrDataUrl = canvas.toDataURL('image/png');

        doc.addImage(qrDataUrl, 'PNG', (pageWidth - 60) / 2, 130, 60, 60);

        doc.setFillColor(blueRgb.r, blueRgb.g, blueRgb.b);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Merci de présenter ce billet à l\'entrée de l\'événement. Club Plus.', pageWidth / 2, pageHeight - 10, { align: 'center' });

        doc.save(`Billet-${eventName.replace(/\s+/g, '_')}-${reservation.categorie.nom}-${ reservation.event.startTime}.pdf`);
        console.log("BilletComponent: PDF généré et sauvegardé.");
        document.head.removeChild(script);
      };
      script.onerror = () => {
        console.error("BilletComponent: Erreur lors du chargement du script QRious.");
        this.notification.show("Erreur lors de la génération du QR Code pour le PDF.", 'error');
        doc.save(`Billet-${eventName.replace(/\s+/g, '_')}-${reservation.reservationUuid}_sans_QR.pdf`);
        document.head.removeChild(script);
      };
      document.head.appendChild(script);
    } else {
      console.warn("BilletComponent: Aucune donnée pour le QR code, PDF généré sans QR code.");
      this.notification.show("Aucune donnée QR code disponible pour ce billet.", 'warning');
      doc.setFillColor(blueRgb.r, blueRgb.g, blueRgb.b);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Merci de présenter ce billet à l\'entrée de l\'événement. Club Plus.', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.save(`Billet-${eventName.replace(/\s+/g, '_')}-${reservation.reservationUuid}_sans_QR.pdf`);
    }
  }

  /**
   * @method onChangeURL
   * @description Callback appelée par `angularx-qrcode` après génération de l'URL du QR code.
   * @param url L'URL de données de l'image QR code.
   * @param reservation La réservation associée au QR code.
   */
  onChangeURL(url: SafeUrl, reservation: Reservation): void {
    const index = this.reservations.findIndex(r => r.id === reservation.id);
    if (index !== -1) {
      if (typeof url === "string") {
        this.reservations[index].qrcodeData = url;
        console.log(`BilletComponent: URL du QR Code mise à jour pour réservation ID ${reservation.reservationUuid}`);
      } else {
        console.warn("BilletComponent: onChangeURL a reçu un type d'URL non géré:", url);
      }
    }
  }

  // --- ACTIONS UTILISATEUR (ANNULATION) ---
  /**
   * @method onCancelReservation
   * @description Gère la demande d'annulation d'une réservation.
   * @param reservation La réservation à annuler.
   */
  onCancelReservation(reservation: Reservation): void {
    if (!reservation || !reservation.id) {
      console.error("BilletComponent: Impossible d'annuler la réservation, ID manquant ou objet invalide.");
      this.notification.show("Impossible d'annuler : ID de réservation manquant.", 'error');
      return;
    }

    this.notification.confirmAction(
      'Annuler la réservation ?',
      `Êtes-vous sûr de vouloir annuler votre réservation pour l'événement "${reservation.event?.nom || 'cet événement'}" ? Cette action est irréversible.`,
      () => {
        console.log(`BilletComponent: Confirmation reçue pour annuler la réservation ID: ${reservation.id}`);
        this.isLoading = true;
        this.errorMessage = null;

        const sub = this.reservationService.cancelReservation(reservation.id).subscribe({
          next: () => {
            this.isLoading = false;
            this.reservations = this.reservations.filter(r => r.id !== reservation.id);
            this.notification.show('Votre réservation a été annulée avec succès.', 'success');
            console.log(`BilletComponent: Réservation ID ${reservation.id} annulée.`);
          },
          error: (error: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`BilletComponent: Erreur lors de l'annulation de la réservation ID ${reservation.id}:`, error);
            const message = error.error?.message || error.message || 'Une erreur inconnue est survenue lors de l\'annulation.';
            this.errorMessage = `Échec de l'annulation : ${message}`;
            this.notification.show(this.errorMessage, 'error');
          }
        });
        this.subscriptions.push(sub);
      },
      'Oui, annuler',
      'Non, conserver'
    );
  }
}

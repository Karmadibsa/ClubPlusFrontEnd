import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';

import {LucideAngularModule} from 'lucide-angular';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ReservationRowComponent} from '../../../component/reservation/reservation-row/reservation-row.component';
import jspdf from 'jspdf';
import {QRCodeComponent} from 'angularx-qrcode';
import {SafeUrl} from '@angular/platform-browser';
import {Reservation} from '../../../model/reservation';
import {ReservationService} from '../../../service/crud/reservation.service';
import {SweetAlertService} from '../../../service/sweet-alert.service';


@Component({
  selector: 'app-billet',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, ReservationRowComponent, ReactiveFormsModule, QRCodeComponent],
  templateUrl: './billet.component.html',
  styleUrl: './billet.component.scss'
})
export class BilletComponent {
  private swalSimpleService = inject(SweetAlertService);

  private reservationService = inject(ReservationService)
  private notification = inject(SweetAlertService)
  selectedTicket: Reservation | undefined;
  isModalOpen: boolean = false;
  reservations: Reservation[] = [];
  reservationForm!: FormGroup;
  private http = inject(HttpClient);

  constructor(private fb: FormBuilder) {
  }

  errorMessage: string | null = null;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.reservationForm = this.fb.group({
      search: [''],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required]
    });

    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
      },
      error: (err) => {
        this.notification.show("Erreur lors du chargement de vos reservations", 'error')
      }
    })
  }

  openQrModal(reservation: Reservation): void {
    this.selectedTicket = reservation;
    this.isModalOpen = true;
  }

  closeQrModal(): void {
    this.isModalOpen = false;
  }

  generatePDF(reservation: Reservation): void {
    this.selectedTicket = reservation;

    // Créer un nouveau document PDF
    const doc = new jspdf('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Couleurs du site
    const mainOrange = '#f26122';
    const mainBlue = '#1a5f7a';

    // Fonction utilitaire pour convertir HEX en RGB
    function hexToRgb(hex: string) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : {r: 0, g: 0, b: 0};
    }

    // Créer un en-tête coloré
    doc.setFillColor(hexToRgb(mainOrange).r, hexToRgb(mainOrange).g, hexToRgb(mainOrange).b);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Titre en blanc sur l'en-tête orange
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Votre billet', pageWidth / 2, 25, {align: 'center'});

    // Section d'informations principales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Événement: ${reservation.event?.nom || ''}`, margin, 60);

    // Date et lieu avec couleur bleue
    doc.setTextColor(hexToRgb(mainBlue).r, hexToRgb(mainBlue).g, hexToRgb(mainBlue).b);
    doc.setFontSize(12);
    doc.text(`Date: ${reservation.event?.start || ''}`, margin, 70);
    doc.text(`Lieu: ${reservation.event?.location || ''}`, margin, 80);

    // Revenir à la couleur normale pour les autres informations
    doc.setTextColor(0, 0, 0);
    doc.text(`Catégorie: ${reservation.categorie?.nom || ''}`, margin, 90);
    doc.text(`Nom: ${reservation.membre?.prenom || ''} ${reservation.membre?.nom || ''}`, margin, 100);

    // Ajouter un rectangle d'accent pour la section QR code
    doc.setFillColor(hexToRgb(mainBlue).r, hexToRgb(mainBlue).g, hexToRgb(mainBlue).b);
    doc.rect(margin, 110, pageWidth - (margin * 2), 1, 'F');

    doc.setTextColor(hexToRgb(mainOrange).r, hexToRgb(mainOrange).g, hexToRgb(mainOrange).b);
    doc.setFontSize(14);
    doc.text('Scannez le QR code ci-dessous', pageWidth / 2, 120, {align: 'center'});

    // Si nous avons l'URL du QR code
    if (reservation.qrcodeData) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      script.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;

        // @ts-ignore - QRious est chargé dynamiquement
        new window.QRious({
          element: canvas,
          value: reservation.qrcodeData,
          size: 200,
          backgroundAlpha: 1
        });

        const qrDataUrl = canvas.toDataURL('image/png');

        // Ajouter l'image QR code au PDF
        doc.addImage(qrDataUrl, 'PNG', (pageWidth - 60) / 2, 130, 60, 60);

        // Ajouter un pied de page coloré
        doc.setFillColor(hexToRgb(mainBlue).r, hexToRgb(mainBlue).g, hexToRgb(mainBlue).b);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

        // Texte du pied de page
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Présentez ce billet à l\'entrée de l\'événement', pageWidth / 2, pageHeight - 10, {align: 'center'});

        // Sauvegarder le PDF
        doc.save(`billet-${reservation.event?.nom || 'evenement'}.pdf`);
      };

      document.head.appendChild(script);
    } else {
      // Fallback si pas de QR code
      doc.save(`billet-${reservation.event?.nom || 'evenement'}.pdf`);
    }
  }


  onChangeURL(url: SafeUrl, reservation: Reservation): void {
    const index = this.reservations.findIndex(r => r.id === reservation.id);
    if (index !== -1) {
      if (typeof url === "string") {
        this.reservations[index].qrcodeData = url;
      }
    }
  }


  // Méthode appelée lorsqu'on clique sur le bouton Annuler/Supprimer d'une réservation
  onCancelReservation(reservation: any): void {
    if (!reservation || !reservation.id) {
      console.error("Impossible d'annuler : ID de réservation manquant.");
      this.swalSimpleService.show("Impossible d'annuler : ID de réservation manquant.", 'error');
      return;
    }

    // --- Utilisation de confirmAction ---
    this.swalSimpleService.confirmAction(
      'Êtes-vous sûr ?', // Titre
      `Voulez-vous vraiment annuler la réservation pour ${reservation.event?.nom || 'cet événement'} ?`, // Texte
      // ---- Début de la fonction callback (ce qui se passe si confirmé) ----
      () => {
        console.log('Confirmation reçue, annulation de', reservation.id);
        this.isLoading = true;
        this.errorMessage = null;
        // Note: Appeler cdr.detectChanges() ici si vous utilisez OnPush

        this.reservationService.cancelReservation(reservation.id)
          .subscribe({
            next: () => {
              this.isLoading = false;
              this.errorMessage = null;
              this.reservations = this.reservations.filter(r => r.id !== reservation.id);
              this.swalSimpleService.show('Réservation annulée.', 'success'); // Utilise la méthode show du même service
              // Note: Appeler cdr.detectChanges() ici si vous utilisez OnPush
            },
            error: (error) => {
              this.isLoading = false;
              console.error(`Erreur lors de l'annulation de la réservation ID: ${reservation.id}`, error);
              this.errorMessage = `Échec de l'annulation : ${error.message || 'Erreur inconnue du serveur'}`;
              this.swalSimpleService.show(this.errorMessage, 'error'); // Utilise la méthode show du même service
              // Note: Appeler cdr.detectChanges() ici si vous utilisez OnPush
            }
          });
      }
      // ---- Fin de la fonction callback ----
      // Options pour les textes des boutons (optionnel)
      // 'Oui, annuler !', // Texte confirmer
      // 'Non' // Texte annuler
    );
    // --- Fin de l'appel à confirmAction ---

    // Le code ici s'exécute immédiatement après l'appel à confirmAction,
    // l'affichage de la modale est asynchrone.
  }
}

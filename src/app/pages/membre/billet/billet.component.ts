import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';

import {LucideAngularModule} from 'lucide-angular';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {SidebarComponent} from "../../../component/sidebar/sidebar.component";
import {QrCodeModalComponent} from '../../../component/qr-code-modal/qr-code-modal.component';
import {HttpClient} from '@angular/common/http';
import {ReservationRowComponent} from '../../../component/reservation-row/reservation-row.component';
import html2canvas from 'html2canvas'; // Pour capturer le contenu HTML
import jspdf from 'jspdf';
import {QRCodeComponent} from 'angularx-qrcode';
import {SafeUrl} from '@angular/platform-browser';




@Component({
  selector: 'app-billet',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, SidebarComponent, QrCodeModalComponent, ReservationRowComponent, ReactiveFormsModule, QRCodeComponent],
  templateUrl: './billet.component.html',
  styleUrl: './billet.component.scss'
})
export class BilletComponent {
  selectedTicket: Reservation | null = null;
  isModalOpen: boolean = false;
  reservations: Reservation[] = [];
  reservationForm!: FormGroup;

  private http = inject(HttpClient);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.reservationForm = this.fb.group({
      search: [''],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required]
    });

    this.fetchReservations();
  }

  fetchReservations(): void {
    this.http.get<Reservation[]>("http://localhost:8080/api/reservations/membre/1")
      .subscribe(listereservations => {
        this.reservations = listereservations;
        console.log('Réservations chargées:', this.reservations);
      });
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
    console.log("Début génération PDF pour:", reservation.id);

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
      } : { r: 0, g: 0, b: 0 };
    }

    // Créer un en-tête coloré
    doc.setFillColor(hexToRgb(mainOrange).r, hexToRgb(mainOrange).g, hexToRgb(mainOrange).b);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Titre en blanc sur l'en-tête orange
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Votre billet', pageWidth/2, 25, { align: 'center' });

    // Section d'informations principales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Événement: ${reservation.event?.title || ''}`, margin, 60);

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
    doc.rect(margin, 110, pageWidth - (margin*2), 1, 'F');

    doc.setTextColor(hexToRgb(mainOrange).r, hexToRgb(mainOrange).g, hexToRgb(mainOrange).b);
    doc.setFontSize(14);
    doc.text('Scannez le QR code ci-dessous', pageWidth/2, 120, { align: 'center' });

    // Si nous avons l'URL du QR code
    if (reservation.qrcodeurl) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      script.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;

        // @ts-ignore - QRious est chargé dynamiquement
        new window.QRious({
          element: canvas,
          value: reservation.qrcodeurl,
          size: 200,
          backgroundAlpha: 1
        });

        const qrDataUrl = canvas.toDataURL('image/png');

        // Ajouter l'image QR code au PDF
        doc.addImage(qrDataUrl, 'PNG', (pageWidth-60)/2, 130, 60, 60);

        // Ajouter un pied de page coloré
        doc.setFillColor(hexToRgb(mainBlue).r, hexToRgb(mainBlue).g, hexToRgb(mainBlue).b);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

        // Texte du pied de page
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Présentez ce billet à l\'entrée de l\'événement', pageWidth/2, pageHeight - 10, { align: 'center' });

        // Sauvegarder le PDF
        doc.save(`billet-${reservation.event?.title || 'evenement'}.pdf`);
      };

      document.head.appendChild(script);
    } else {
      // Fallback si pas de QR code
      doc.save(`billet-${reservation.event?.title || 'evenement'}.pdf`);
    }
  }






  onChangeURL(url: SafeUrl, reservation: Reservation): void {
    console.log(`QR code généré pour la réservation ${reservation.id}:`, url);
    const index = this.reservations.findIndex(r => r.id === reservation.id);
    if (index !== -1) {
      if (typeof url === "string") {
        this.reservations[index].qrcodeurl = url;
      }
    }
  }

  onSubmit(): void {
    if (this.reservationForm.valid) {
      console.log('Formulaire soumis', this.reservationForm.value);
    } else {
      console.log('Formulaire invalide');
    }
  }
}


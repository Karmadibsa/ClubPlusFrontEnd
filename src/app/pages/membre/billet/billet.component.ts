// ----- IMPORTATIONS -----
import {
  Component,
  inject,         // Fonction moderne pour l'injection de dépendances.
  OnInit,
  OnDestroy       // Ajout de OnDestroy pour la gestion des abonnements.
  // ChangeDetectorRef // À ajouter si ChangeDetectionStrategy.OnPush est utilisé.
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Pour @if, @for, pipes (DatePipe n'est pas explicitement dans imports, CommonModule le fournit).
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'; // Pour les formulaires.
import {HttpClient, HttpErrorResponse} from '@angular/common/http'; // HttpClient est utilisé directement (pourrait être encapsulé).
import { Subscription } from 'rxjs';             // Pour gérer la désinscription des Observables.

// Composants Enfants/Associés
import { ReservationRowComponent } from '../../../component/reservation/reservation-row/reservation-row.component'; // Si utilisé pour afficher chaque réservation.
import { QRCodeComponent } from 'angularx-qrcode'; // Pour la génération de QR Code.

// Modèles (Interfaces de données)
import { Reservation } from '../../../model/reservation'; // Interface décrivant une réservation.
import { SafeUrl } from '@angular/platform-browser';    // Pour les URLs sûres (utilisé par qrcode).

// Services
import { ReservationService } from '../../../service/crud/reservation.service'; // Service pour les opérations sur les réservations.
import { SweetAlertService } from '../../../service/sweet-alert.service'; // Pour les notifications et confirmations.

// Librairies externes (pour PDF)
import jsPDF from 'jspdf'; // Librairie pour la génération de PDF.
// Note: Pour 'qrious' utilisé dans generatePDF, il est chargé dynamiquement.

// Autres (Icônes)
import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component BilletComponent
 * @description
 * Page permettant aux utilisateurs connectés de visualiser et gérer leurs réservations (billets).
 * Elle affiche une liste des réservations, permet d'ouvrir une modale avec un QR code pour chaque billet,
 * de générer un PDF du billet, et d'annuler des réservations.
 * Un formulaire de recherche/filtrage (dates) est également présent.
 *
 * @example
 * <app-billet></app-billet> <!-- Typiquement utilisé comme composant de route -->
 */
@Component({
  selector: 'app-billet',
  standalone: true,
  imports: [
    CommonModule,             // Pour les directives @if, @for, etc.
    LucideAngularModule,      // Pour les icônes.
    FormsModule,              // Pour [(ngModel)] si utilisé.
    ReactiveFormsModule,      // Pour le `reservationForm`.
    ReservationRowComponent,  // Si le template itère et utilise ce composant pour chaque ligne.
    QRCodeComponent           // Pour la directive <qrcode> utilisée dans la modale QR.
  ],
  templateUrl: './billet.component.html',
  styleUrl: './billet.component.scss'
  // changeDetection: ChangeDetectionStrategy.OnPush, // Envisager pour optimisation si la page devient complexe.
})
export class BilletComponent implements OnInit, OnDestroy { // Implémente OnInit et OnDestroy.

  // --- INJECTIONS DE SERVICES via inject() ---
  /**
   * @private
   * @description Service pour afficher des notifications et des boîtes de dialogue de confirmation.
   */
  private notification = inject(SweetAlertService);
  /**
   * @private
   * @description Service pour les opérations CRUD liées aux réservations de l'utilisateur.
   */
  private reservationService = inject(ReservationService);
  // private notification = inject(SweetAlertService); // Déjà injecté en tant que notification.
  /**
   * @private
   * @description Service Angular pour construire des formulaires réactifs.
   * Injecté via le constructeur pour la compatibilité avec l'initialisation de `reservationForm`.
   */
  private fb = inject(FormBuilder);

  // --- ÉTAT DU COMPOSANT (DONNÉES ET UI) ---
  /**
   * @property {Reservation | undefined} selectedTicket
   * @description Stocke la réservation actuellement sélectionnée, typiquement pour l'affichage
   * dans une modale (QR code ou détails pour PDF).
   * @default undefined
   */
  selectedTicket: Reservation | undefined;
  /**
   * @property {boolean} isModalOpen
   * @description Contrôle la visibilité de la modale affichant le QR code.
   * @default false
   */
  isModalOpen: boolean = false;
  /**
   * @property {Reservation[]} reservations
   * @description Tableau stockant toutes les réservations de l'utilisateur courant.
   * @default []
   */
  reservations: Reservation[] = [];
  /**
   * @property {FormGroup} reservationForm
   * @description Le formulaire réactif Angular utilisé pour filtrer les réservations
   * (par terme de recherche et/ou par dates).
   * Le `!` indique qu'il sera initialisé dans `ngOnInit`.
   */
  reservationForm!: FormGroup;

  /**
   * @property {string | null} errorMessage
   * @description Stocke un message d'erreur à afficher à l'utilisateur en cas de problème
   * lors d'une opération (annulation, chargement).
   * @default null
   */
  errorMessage: string | null = null;
  /**
   * @property {boolean} isLoading
   * @description Booléen indiquant si une opération asynchrone (appel API) est en cours.
   * Utilisé pour afficher des indicateurs de chargement et désactiver des contrôles.
   * @default false
   */
  isLoading: boolean = false;

  /**
   * @private
   * @property {Subscription[]} subscriptions
   * @description Tableau pour stocker tous les abonnements RxJS afin de les désinscrire
   * proprement dans `ngOnDestroy` et éviter les fuites de mémoire.
   */
  private subscriptions: Subscription[] = [];

  // Le constructeur est utilisé ici principalement pour l'injection de FormBuilder
  // qui est une pratique courante, bien que `inject(FormBuilder)` soit aussi possible.
  // constructor(private fb: FormBuilder) {} // fb est maintenant injecté via inject().

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Crochet de cycle de vie Angular. Appelé une fois après l'initialisation.
   * Initialise le `reservationForm` et lance le chargement des réservations de l'utilisateur.
   * @see {@link ReservationService.getMyReservations}
   * @returns {void}
   */
  ngOnInit(): void {
    console.log("BilletComponent: Initialisation.");
    // Initialisation du formulaire de recherche/filtrage.
    this.reservationForm = this.fb.group({
      search: [''], // Champ pour un terme de recherche textuel.
      startDate: ['', Validators.required], // Validateur optionnel, dépend si le filtre est obligatoire.
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required]
    });
    // Note: La logique d'application de ces filtres sur `this.reservations` n'est pas
    // implémentée dans ce fichier .ts ; elle serait dans le template ou une méthode dédiée.

    // Chargement initial des réservations de l'utilisateur.
    this.isLoading = true; // Active le chargement.
    const sub = this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.isLoading = false;
        console.log(`BilletComponent: ${reservations.length} réservations chargées.`);
        // this.cdr.detectChanges(); // Si OnPush.
      },
      error: (err) => {
        this.isLoading = false;
        console.error("BilletComponent: Erreur lors du chargement des réservations:", err);
        this.notification.show("Erreur lors du chargement de vos réservations.", 'error');
        // this.cdr.detectChanges(); // Si OnPush.
      }
    });
    this.subscriptions.push(sub); // Ajoute l'abonnement pour la désinscription.
  }

  /**
   * @method ngOnDestroy
   * @description Crochet de cycle de vie Angular. Appelé avant la destruction du composant.
   * Se désabonne de tous les abonnements RxJS stockés.
   * @returns {void}
   */
  ngOnDestroy(): void {
    console.log("BilletComponent: Destruction, désinscription des abonnements.");
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }


  // --- GÉNÉRATION DE PDF ---
  /**
   * @method generatePDF
   * @description Génère un document PDF pour la réservation sélectionnée.
   * Le PDF inclut les détails de la réservation et un QR code généré dynamiquement.
   * Utilise la librairie `jspdf` pour la création du PDF et charge dynamiquement `qrious`
   * pour la génération de l'image du QR code.
   * @param {Reservation} reservation - La réservation pour laquelle générer le PDF.
   * @returns {void}
   */
  generatePDF(reservation: Reservation): void {
    this.selectedTicket = reservation; // S'assure que le ticket est bien celui passé en argument.
    console.log(`BilletComponent: Début de la génération PDF pour réservation ID ${reservation.reservationUuid}`);

    const doc = new jsPDF('p', 'mm', 'a4'); // Orientation portrait, unités mm, format A4.
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Couleurs (similaires à celles de `styles.txt`).
    const mainOrange = '#f26122';
    const mainBlue = '#1a5f7a';

    // Fonction utilitaire pour convertir HEX en RGB pour jsPDF.
    function hexToRgb(hex: string): { r: number, g: number, b: number } {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    }

    // En-tête du PDF.
    const orangeRgb = hexToRgb(mainOrange);
    doc.setFillColor(orangeRgb.r, orangeRgb.g, orangeRgb.b);
    doc.rect(0, 0, pageWidth, 40, 'F'); // Rectangle de fond orange.
    doc.setTextColor(255, 255, 255);    // Texte blanc.
    doc.setFontSize(24);
    doc.text('Votre billet Club Plus', pageWidth / 2, 25, { align: 'center' });

    // Informations de la réservation.
    doc.setTextColor(0, 0, 0); // Texte noir.
    doc.setFontSize(14);
    const eventName = reservation.event?.nom || 'Non spécifié';
    doc.text(`Événement: ${eventName}`, margin, 60);

    const blueRgb = hexToRgb(mainBlue);
    doc.setTextColor(blueRgb.r, blueRgb.g, blueRgb.b); // Texte bleu.
    doc.setFontSize(12);
    const eventStartDate = reservation.event?.startTime ? new DatePipe('fr-FR').transform(reservation.event.startTime, 'dd/MM/yyyy HH:mm') : 'Non spécifiée';
    doc.text(`Date: ${eventStartDate}`, margin, 70);
    doc.text(`Lieu: ${reservation.event?.location || 'Non spécifié'}`, margin, 80);

    doc.setTextColor(0, 0, 0); // Texte noir.
    doc.text(`Catégorie: ${reservation.categorie?.nom || 'Non spécifiée'}`, margin, 90);
    doc.text(`Titulaire: ${reservation.membre?.prenom || ''} ${reservation.membre?.nom || ''}`, margin, 100);

    // Séparateur et titre pour QR code.
    doc.setFillColor(blueRgb.r, blueRgb.g, blueRgb.b);
    doc.rect(margin, 110, pageWidth - (margin * 2), 1, 'F'); // Ligne bleue.
    doc.setTextColor(orangeRgb.r, orangeRgb.g, orangeRgb.b); // Texte orange.
    doc.setFontSize(14);
    doc.text('Scannez ce QR code à l\'entrée', pageWidth / 2, 120, { align: 'center' });

    // Génération et ajout du QR Code.
    // `reservation.qrcodeData` doit contenir la chaîne à encoder (ex: reservation.reservationUuid).
    const qrCodeContent = reservation.qrcodeData || reservation.reservationUuid || 'DONNÉE QR MANQUANTE';
    if (qrCodeContent) {
      // Charge dynamiquement la librairie QRious pour la génération du QR Code.
      // C'est une approche pour éviter d'inclure la librairie dans le bundle initial si non nécessaire partout.
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
      script.onload = () => {
        const canvas = document.createElement('canvas');
        // @ts-ignore - QRious est chargé dynamiquement et attaché à window.
        new window.QRious({ element: canvas, value: qrCodeContent, size: 200, backgroundAlpha: 1 });
        const qrDataUrl = canvas.toDataURL('image/png'); // Convertit le canvas en image Data URL.

        doc.addImage(qrDataUrl, 'PNG', (pageWidth - 60) / 2, 130, 60, 60); // Ajoute l'image au PDF.

        // Pied de page du PDF.
        doc.setFillColor(blueRgb.r, blueRgb.g, blueRgb.b);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F'); // Rectangle de fond bleu.
        doc.setTextColor(255, 255, 255); // Texte blanc.
        doc.setFontSize(10);
        doc.text('Merci de présenter ce billet à l\'entrée de l\'événement. Club Plus.', pageWidth / 2, pageHeight - 10, { align: 'center' });

        doc.save(`Billet-${eventName.replace(/\s+/g, '_')}-${reservation.categorie.nom}-${ reservation.event.startTime}.pdf`); // Sauvegarde du PDF.
        console.log("BilletComponent: PDF généré et sauvegardé.");
        document.head.removeChild(script); // Nettoie le script chargé.
      };
      script.onerror = () => {
        console.error("BilletComponent: Erreur lors du chargement du script QRious.");
        this.notification.show("Erreur lors de la génération du QR Code pour le PDF.", 'error');
        doc.save(`Billet-${eventName.replace(/\s+/g, '_')}-${reservation.reservationUuid}_sans_QR.pdf`); // Sauvegarde sans QR si script échoue.
        document.head.removeChild(script);
      };
      document.head.appendChild(script);
    } else {
      console.warn("BilletComponent: Aucune donnée pour le QR code, PDF généré sans QR code.");
      this.notification.show("Aucune donnée QR code disponible pour ce billet.", 'warning');
      // Sauvegarde du PDF même sans QR code (ou afficher une erreur plus forte).
      // Pied de page (répété pour le cas sans QR)
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
   * @description Méthode de rappel (callback) appelée par le composant `angularx-qrcode`
   * lorsqu'il a généré l'URL de données (Data URL) de l'image QR code.
   * Stocke cette URL dans la propriété `qrcodeData` de l'objet `reservation` correspondant
   * pour une utilisation ultérieure (ex: dans `generatePDF`).
   * @param {SafeUrl} url - L'URL de données de l'image QR code générée.
   * @param {Reservation} reservation - La réservation associée à ce QR code.
   * @returns {void}
   */
  onChangeURL(url: SafeUrl, reservation: Reservation): void {
    const index = this.reservations.findIndex(r => r.id === reservation.id);
    if (index !== -1) {
      // `SafeUrl` est un objet, on a besoin de la chaîne URL réelle.
      // La conversion dépend de comment `angularx-qrcode` émet `url`.
      // Si `url` est un objet avec une propriété (ex: `changingThisBreaksApplicationSecurity`),
      // il faut extraire la chaîne. Souvent, c'est directement la chaîne.
      // Pour l'instant, on suppose que c'est une chaîne ou peut être converti.
      if (typeof url === "string") { // Vérification de base.
        this.reservations[index].qrcodeData = url; // Stocke la Data URL pour le PDF.
        console.log(`BilletComponent: URL du QR Code mise à jour pour réservation ID ${reservation.reservationUuid}`);
      } else {
        // Si SafeUrl est un objet, il faut utiliser DomSanitizer pour obtenir la chaîne.
        // Cependant, angularx-qrcode émet souvent la chaîne directement via (qrCodeURL).
        // Si ce n'est pas le cas, cette méthode doit être adaptée.
        console.warn("BilletComponent: onChangeURL a reçu un type d'URL non géré:", url);
      }
    }
  }

  // --- ACTIONS UTILISATEUR (ANNULATION) ---
  /**
   * @method onCancelReservation
   * @description Gère la demande d'annulation d'une réservation.
   * Affiche une boîte de dialogue de confirmation à l'utilisateur via `SweetAlertService`.
   * Si confirmé, appelle `ReservationService.cancelReservation()` et met à jour
   * la liste des réservations après succès.
   * @param {Reservation} reservation - La réservation à annuler. Note: le type `any` était utilisé, corrigé en `Reservation`.
   * @returns {void}
   */
  onCancelReservation(reservation: Reservation): void { // Typage corrigé.
    if (!reservation || !reservation.id) {
      console.error("BilletComponent: Impossible d'annuler la réservation, ID manquant ou objet invalide.");
      this.notification.show("Impossible d'annuler : ID de réservation manquant.", 'error');
      return;
    }

    // Utilisation de la méthode de confirmation de SweetAlertService.
    this.notification.confirmAction(
      'Annuler la réservation ?',
      `Êtes-vous sûr de vouloir annuler votre réservation pour l'événement "${reservation.event?.nom || 'cet événement'}" ? Cette action est irréversible.`,
      () => { // Callback exécutée si l'utilisateur confirme.
        console.log(`BilletComponent: Confirmation reçue pour annuler la réservation ID: ${reservation.id}`);
        this.isLoading = true;
        this.errorMessage = null;
        // this.cdr.detectChanges(); // Si OnPush.

        const sub = this.reservationService.cancelReservation(reservation.id).subscribe({
          next: () => {
            this.isLoading = false;
            this.reservations = this.reservations.filter(r => r.id !== reservation.id); // Met à jour la liste.
            this.notification.show('Votre réservation a été annulée avec succès.', 'success');
            console.log(`BilletComponent: Réservation ID ${reservation.id} annulée.`);
            // this.cdr.detectChanges(); // Si OnPush.
          },
          error: (error: HttpErrorResponse) => {
            this.isLoading = false;
            console.error(`BilletComponent: Erreur lors de l'annulation de la réservation ID ${reservation.id}:`, error);
            const message = error.error?.message || error.message || 'Une erreur inconnue est survenue lors de l\'annulation.';
            this.errorMessage = `Échec de l'annulation : ${message}`;
            this.notification.show(this.errorMessage, 'error');
            // this.cdr.detectChanges(); // Si OnPush.
          }
        });
        this.subscriptions.push(sub); // Ajoute pour désinscription.
      },
      'Oui, annuler', // Texte du bouton de confirmation.
      'Non, conserver'  // Texte du bouton d'annulation.
    );
  }
}

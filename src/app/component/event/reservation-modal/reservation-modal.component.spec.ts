// Fichier: reservation-modal.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {of, Subject, throwError} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

// --- Importations des modèles et services ---
import { ReservationModalComponent } from './reservation-modal.component';
import { ReservationService } from '../../../service/crud/reservation.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { Evenement } from '../../../model/evenement';
import { Club } from '../../../model/club';
import { Categorie } from '../../../model/categorie';
import { LucideAngularModule, CalendarPlus, X, Ticket, Loader } from 'lucide-angular';

// --- Création des Mocks (inchangés) ---
const mockReservationService = jasmine.createSpyObj('ReservationService', ['createReservation']);
const mockSweetAlertService = jasmine.createSpyObj('SweetAlertService', ['show']);

// --- ========================================================= ---
// --- DONNÉES DE TEST CONFORMES À VOS INTERFACES FINALES ---
// --- ========================================================= ---

// 1. Création d'un mock valide pour l'interface Club
const mockClub: Club = {
  id: 10,
  nom: 'Club des Champions',
  date_creation: '2010-05-20',
  date_inscription: '2023-01-15',
  numero_voie: '123',
  rue: 'Avenue des Sports',
  codepostal: '75015',
  ville: 'Paris',
  telephone: '0123456789',
  email: 'contact@champions.com',
  codeClub: 'CDC2010',
  actif: true
};

// 2. Création d'un mock valide pour l'interface Evenement
const mockEvent: Evenement = {
  id: 1,
  nom: 'Finale du Tournoi',
  startTime: '2025-07-20T20:00:00Z',
  endTime: '2025-07-20T22:00:00Z',
  description: 'Un match épique à ne pas manquer.',
  location: 'Stade Central',
  actif: true,
  placeTotal: 200,
  placeReserve: 55,
  amiParticipants: ['Jean Dupont', 'Marie Curie'],
  // La section `categories` est maintenant conforme à votre interface Categorie.
  categories: [
    { id: 101, nom: 'Tribune Nord', capacite: 150, placeDisponible: 50 },
    { id: 102, nom: 'Loges VIP', capacite: 50, placeDisponible: 5 },
  ],
  organisateur: mockClub
};

// 3. Création d'un mock pour la réponse de réservation
const mockCreatedReservation: any = {
  id: 999,
  reservationUuid: 'uuid-test-1234',
  status: 'CONFIRME',
  dateReservation: new Date().toISOString(),
};


// --- Début de la suite de tests (logique inchangée) ---
describe('ReservationModalComponent', () => {
  let component: ReservationModalComponent;
  let fixture: ComponentFixture<ReservationModalComponent>;
  let reservationApiSubject: Subject<any>;

  beforeEach(async () => {
    reservationApiSubject = new Subject<any>();
    mockReservationService.createReservation.calls.reset();
    mockSweetAlertService.show.calls.reset();

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReservationModalComponent,
        LucideAngularModule.pick({  CalendarPlus, X, Ticket, Loader })

      ],
      providers: [
        { provide: ReservationService, useValue: mockReservationService },
        { provide: SweetAlertService, useValue: mockSweetAlertService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationModalComponent);
    component = fixture.componentInstance;
    component.event = mockEvent;
    component.isVisible = true;
    fixture.detectChanges();
  });

  it('devrait être créé et afficher les informations de l\'événement et des catégories', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    // Vérifie le titre
    expect(compiled.querySelector('h2')?.textContent).toContain('Réserver pour : Finale du Tournoi');
    // Vérifie qu'une catégorie est bien affichée
    const categoryLabels = compiled.querySelectorAll('.category-label');
    expect(categoryLabels.length).toBe(2);
    expect(categoryLabels[0].textContent).toContain('Tribune Nord');
    expect(categoryLabels[0].textContent).toContain('50 places restantes');
  });

  it('le bouton "Réserver" devrait être désactivé si aucune catégorie n\'est sélectionnée', () => {
    const reserveButton = fixture.debugElement.query(By.css('button.btn-primary')).nativeElement;
    expect(reserveButton.disabled).toBeTrue();
  });

  // --- LE TEST CLÉ POUR LA CRÉATION D'UNE RÉSERVATION ---


  it('onSubmit - doit appeler l\'API et réussir quand une catégorie est sélectionnée', fakeAsync(() => {
    // Arrange
    spyOn(component.closeModal, 'emit');
    spyOn(component.reserveSuccess, 'emit');
    component.selectedCategory = mockEvent.categories[0];
    mockReservationService.createReservation.and.returnValue(reservationApiSubject.asObservable());
    fixture.detectChanges();
    const reserveButton = fixture.debugElement.query(By.css('button.btn-primary')).nativeElement;

    // Act
    reserveButton.click();
    fixture.detectChanges();

    // Assert - Vérification de l'état "en cours de soumission"
    expect(component.isSubmitting).toBeTrue();
    expect(reserveButton.textContent).toContain('Sauvegarde...');

    // Act 2 : On simule la réponse réussie ET la complétion de l'API
    reservationApiSubject.next(mockCreatedReservation);
    reservationApiSubject.complete(); // <-- CORRECTION : Simuler la fin du flux HTTP

    tick();
    fixture.detectChanges();

    // Assert - Vérification de l'état final
    expect(mockReservationService.createReservation).toHaveBeenCalledOnceWith(1, 101);
    expect(mockSweetAlertService.show).toHaveBeenCalledWith('Réservation effectuée avec succès !', 'success');
    expect(component.reserveSuccess.emit).toHaveBeenCalledWith(mockCreatedReservation);
    expect(component.closeModal.emit).toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  }));

  it('onSubmit - doit afficher une erreur et ne pas fermer la modale si l\'API retourne une erreur', fakeAsync(() => {
    // Arrange
    spyOn(component.closeModal, 'emit');
    spyOn(component.reserveSuccess, 'emit');
    component.selectedCategory = mockEvent.categories[1];
    mockReservationService.createReservation.and.returnValue(reservationApiSubject.asObservable());
    fixture.detectChanges();
    const errorResponse = new HttpErrorResponse({ status: 409, error: { message: 'Capacité maximale atteinte' } });
    const reserveButton = fixture.debugElement.query(By.css('button.btn-primary')).nativeElement;

    // Act
    reserveButton.click();
    fixture.detectChanges();

    // Assert - État intermédiaire
    expect(component.isSubmitting).toBeTrue();

    // Act 2 : On simule la réponse d'erreur de l'API (une erreur complète aussi le flux)
    reservationApiSubject.error(errorResponse);

    tick();
    fixture.detectChanges();

    // Assert - État final
    expect(mockReservationService.createReservation).toHaveBeenCalledOnceWith(1, 102);
    expect(mockSweetAlertService.show).toHaveBeenCalledWith('Capacité maximale atteinte', 'error');
    expect(component.reserveSuccess.emit).not.toHaveBeenCalled();
    expect(component.closeModal.emit).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  }));

  it('onSubmit - ne doit rien faire et notifier si aucune catégorie n\'est sélectionnée', () => {
    // Arrange
    component.selectedCategory = null;
    fixture.detectChanges();

    // Act
    component.onSubmit();

    // Assert
    expect(mockReservationService.createReservation).not.toHaveBeenCalled();
    expect(mockSweetAlertService.show).toHaveBeenCalledWith('Veuillez sélectionner une catégorie pour la réservation.', 'warning');
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EventComponent } from './event.component';
import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LucideAngularModule, Loader, CalendarClock, Users } from 'lucide-angular';

// Mock des services
class MockEventService {
  getAllEventsWithFriend = jasmine.createSpy().and.returnValue(of([]));
}
class MockSweetAlertService {
  show = jasmine.createSpy();
}

// Fonction utilitaire pour créer un événement complet (évite les erreurs dans les templates enfants)
function createFakeEvent(id: number) {
  return {
    id,
    nom: `Événement ${id}`,
    date: new Date().toISOString(),
    lieu: 'Salle Polyvalente',
    description: 'Description de test',
    participants: [],
    categories: []
  };
}

describe('EventComponent', () => {
  let component: EventComponent;
  let fixture: ComponentFixture<EventComponent>;
  let eventService: MockEventService;
  let notification: MockSweetAlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EventComponent,
        LucideAngularModule.pick({ Loader, CalendarClock, Users })
      ],
      providers: [
        { provide: EventService, useClass: MockEventService },
        { provide: SweetAlertService, useClass: MockSweetAlertService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventComponent);
    component = fixture.componentInstance;
    eventService = TestBed.inject(EventService) as unknown as MockEventService;
    notification = TestBed.inject(SweetAlertService) as unknown as MockSweetAlertService;
    fixture.detectChanges();
  });

  // Test 1 : Création du composant
  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // Test 2 : Chargement initial des événements
  it('doit charger les événements au démarrage', () => {
    component.ngOnInit();
    expect(eventService.getAllEventsWithFriend).toHaveBeenCalled();
  });

  // Test 3 : Gestion d’erreur lors du chargement des événements
  it('doit afficher une notification en cas d\'erreur lors du chargement', () => {
    eventService.getAllEventsWithFriend = jasmine.createSpy().and.returnValue(throwError(() => ({ message: 'Erreur API' })));
    component.loadEvents();
    expect(notification.show).toHaveBeenCalledWith('Erreur API', 'error');
  });

  // Test 4 : Affichage du loader pendant le chargement
  it('doit afficher l\'indicateur de chargement quand isLoading est true', () => {
    component.isLoading = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-indicator')).toBeTruthy();
    expect(compiled.textContent).toContain('Chargement des événements...');
  });

  // Test 5 : Affichage du message "Aucun événement" quand la liste est vide
  it('doit afficher un message quand il n\'y a aucun événement à afficher', () => {
    component.isLoading = false;
    component.paginatedEvents = [];
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.no-data-message')).toBeTruthy();
    expect(compiled.textContent).toContain("Aucun événement ne correspond à vos critères");
  });
});

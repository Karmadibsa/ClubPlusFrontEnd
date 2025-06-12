// Import des outils de test Angular
import { TestBed, ComponentFixture } from '@angular/core/testing';
// Import du composant à tester
import { EventAdminComponent } from './eventAdmin.component';
// Import des services utilisés par le composant
import { EventService } from '../../../service/crud/event.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { AuthService } from '../../../service/security/auth.service';
// Import pour simuler HttpClient dans les tests
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
// Import des outils RxJS pour simuler des réponses asynchrones
import { of, throwError } from 'rxjs';
// Import Lucide Angular et toutes les icônes utilisées dans le composant et ses enfants
import { LucideAngularModule, CirclePlus, ChevronUp, Eye, Pen, Trash } from 'lucide-angular';

// Création de mocks pour les services afin d'isoler le composant du backend réel
class MockEventService {
  getAllEvents = jasmine.createSpy().and.returnValue(of([])); // Simule la récupération des événements
  softDeleteEvent = jasmine.createSpy().and.returnValue(of({})); // Simule la suppression d'un événement
}
class MockSweetAlertService {
  show = jasmine.createSpy(); // Simule l'affichage d'une notification
}
class MockAuthService {
  isLoggedIn = jasmine.createSpy().and.returnValue(true); // Simule un utilisateur connecté
}

describe('EventAdminComponent', () => {
  let component: EventAdminComponent;
  let fixture: ComponentFixture<EventAdminComponent>;
  let eventService: MockEventService;
  let notification: MockSweetAlertService;

  // Avant chaque test, on prépare un environnement propre
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EventAdminComponent, // Import du composant standalone
        // Import du module Lucide avec toutes les icônes utilisées dans le composant ou ses enfants
        LucideAngularModule.pick({ CirclePlus, ChevronUp, Eye, Pen, Trash }),
      ],
      providers: [
        { provide: EventService, useClass: MockEventService }, // On remplace EventService par le mock
        { provide: SweetAlertService, useClass: MockSweetAlertService }, // Idem pour SweetAlertService
        { provide: AuthService, useClass: MockAuthService }, // Idem pour AuthService
        provideHttpClient(),           // Fournit HttpClient pour les tests
        provideHttpClientTesting(),    // Fournit les mocks pour HttpClient
      ]
    }).compileComponents();

    // Création d'une instance du composant pour chaque test
    fixture = TestBed.createComponent(EventAdminComponent);
    component = fixture.componentInstance;
    // On récupère les mocks pour vérifier les appels
    eventService = TestBed.inject(EventService) as unknown as MockEventService;
    notification = TestBed.inject(SweetAlertService) as unknown as MockSweetAlertService;
    // On déclenche la détection des changements pour initialiser le composant
    fixture.detectChanges();
  });

  // Test 1 : Vérifie que le composant se crée correctement
  it('devrait créer le composant', () => {
    expect(component).toBeTruthy(); // Le composant doit exister après initialisation
  });

  // Test 2 : Vérifie l’appel au service lors du chargement des événements
  it('devrait charger les événements au démarrage', () => {
    component.ngOnInit(); // Simule le cycle de vie Angular
    expect(eventService.getAllEvents).toHaveBeenCalled(); // Vérifie que la méthode a bien été appelée
  });

  // Test 3 : Vérifie la gestion d’une liste d’événements filtrée
  it('devrait mettre à jour la liste filtrée et la pagination lors du filtrage', () => {
    const fakeEvents = [{ id: 1 }, { id: 2 }] as any; // Données factices
    component.filteredEvenements = [];
    component.paginatedEvenements = [];
    component.itemsPerPage = 1;
    component.handleFilteredEventsChange(fakeEvents); // Simule l'application d'un filtre
    expect(component.filteredEvenements).toEqual(fakeEvents); // La liste filtrée doit être mise à jour
    expect(component.currentPage).toBe(1); // La page doit être remise à 1
    expect(component.paginatedEvenements.length).toBe(1); // Un seul événement par page
  });

  // Test 4 : Vérifie la gestion de la suppression d’un événement
  it('devrait supprimer un événement et mettre à jour les listes', () => {
    // On simule une liste contenant un événement
    component.allEvenements = [{ id: 1, nom: 'Test' }] as any;
    component.filteredEvenements = [{ id: 1, nom: 'Test' }] as any;
    component.paginatedEvenements = [{ id: 1, nom: 'Test' }] as any;
    component.itemsPerPage = 10;
    component.handleDeleteEventRequest({ id: 1, nom: 'Test' } as any); // Simule la suppression
    expect(component.allEvenements.length).toBe(0); // La liste doit être vide
    expect(component.filteredEvenements.length).toBe(0); // Idem pour la liste filtrée
    expect(notification.show).toHaveBeenCalled(); // Une notification doit être affichée
  });

  // Test 5 : Vérifie la gestion d’une erreur lors du chargement des événements
  it('doit afficher une notification en cas d\'erreur lors du chargement', () => {
    // On modifie le mock pour simuler une erreur API
    eventService.getAllEvents = jasmine.createSpy().and.returnValue(throwError(() => ({ message: 'Erreur API' })));
    component.chargerEvenements(); // Appel de la méthode de chargement
    expect(notification.show).toHaveBeenCalledWith('Erreur API', 'error'); // Vérifie que l'erreur est notifiée
  });

  // Test 6 : Vérifie le changement de page
  it('doit changer de page si la page demandée est valide', () => {
    component.filteredEvenements = [{}, {}, {}] as any; // 3 événements simulés
    component.itemsPerPage = 1;
    component.currentPage = 1;
    component.onPageChange(2); // Simule le passage à la page 2
    expect(component.currentPage).toBe(2); // La page courante doit être 2
    expect(component.paginatedEvenements.length).toBe(1); // Toujours 1 événement par page
  });
});

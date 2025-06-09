import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MembreAdminComponent } from './membreAdmin.component';
import { MembreService } from '../../../service/crud/membre.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';
import { AuthService } from '../../../service/security/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LucideAngularModule, CirclePlus, ChevronUp, Eye, Pen, Trash, UserCog } from 'lucide-angular';

// Mocks des services pour isoler le composant du backend réel
class MockMembreService {
  getMembersByClub = jasmine.createSpy().and.returnValue(of([]));
  changeMemberRole = jasmine.createSpy().and.returnValue(of({}));
}
class MockSweetAlertService {
  show = jasmine.createSpy();
}
class MockAuthService {
  getManagedClubId = jasmine.createSpy().and.returnValue(1); // Simule un club ID valide
}

describe('MembreAdminComponent', () => {
  let component: MembreAdminComponent;
  let fixture: ComponentFixture<MembreAdminComponent>;
  let membreService: MockMembreService;
  let notification: MockSweetAlertService;
  let authService: MockAuthService;

  // Préparation de l'environnement avant chaque test
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembreAdminComponent,
        LucideAngularModule.pick({ CirclePlus, ChevronUp, Eye, Pen, Trash, UserCog }),
      ],
      providers: [
        { provide: MembreService, useClass: MockMembreService },
        { provide: SweetAlertService, useClass: MockSweetAlertService },
        { provide: AuthService, useClass: MockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MembreAdminComponent);
    component = fixture.componentInstance;
    membreService = TestBed.inject(MembreService) as unknown as MockMembreService;
    notification = TestBed.inject(SweetAlertService) as unknown as MockSweetAlertService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    fixture.detectChanges();
  });

  // Test 1 : Création du composant
  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // Test 2 : Chargement des membres au démarrage
  it('devrait charger les membres du club au démarrage', () => {
    component.ngOnInit();
    expect(membreService.getMembersByClub).toHaveBeenCalledWith(1);
  });

  // Test 3 : Gestion d'une liste de membres filtrée
  it('doit mettre à jour la liste filtrée et la pagination lors du filtrage', () => {
    const fakeMembres = [{ id: 1 }, { id: 2 }] as any;
    component.filteredMembres = [];
    component.paginatedMembres = [];
    component.itemsPerPage = 1;
    component.handleFilteredMembresChange(fakeMembres);
    expect(component.filteredMembres).toEqual(fakeMembres);
    expect(component.currentPage).toBe(1);
    expect(component.paginatedMembres.length).toBe(1); // 1 membre par page
  });

  // Test 4 : Gestion de la pagination
  it('doit changer de page si la page demandée est valide', () => {
    component.filteredMembres = [{}, {}, {}] as any; // 3 membres simulés
    component.itemsPerPage = 1;
    component.currentPage = 1;
    component.onPageChange(2); // Passe à la page 2
    expect(component.currentPage).toBe(2);
    expect(component.paginatedMembres.length).toBe(1);
  });

  // Test 5 : Gestion d'une erreur lors du chargement des membres
  it('doit afficher une notification en cas d\'erreur lors du chargement', () => {
    // On simule une erreur API
    membreService.getMembersByClub = jasmine.createSpy().and.returnValue(throwError(() => ({ message: 'Erreur API' })));
    component.chargerMembresDuClub();
    expect(notification.show).toHaveBeenCalledWith('Erreur API', 'error');
  });

  // Test 6 : Modification du rôle d'un membre
  it('doit modifier le rôle d\'un membre et mettre à jour la liste', () => {
    // On simule des membres existants
    component.allMembres = [{ id: 1, role: 'MEMBRE' }] as any;
    component.filteredMembres = [{ id: 1, role: 'MEMBRE' }] as any;
    membreService.changeMemberRole = jasmine.createSpy().and.returnValue(of({ id: 1, role: 'ADMIN' }));
    component.handleSaveRole({ membreId: 1, newRole: 'ADMIN' });
    expect(membreService.changeMemberRole).toHaveBeenCalledWith(1, 1, 'ADMIN');
    expect(notification.show).toHaveBeenCalled();
  });
});

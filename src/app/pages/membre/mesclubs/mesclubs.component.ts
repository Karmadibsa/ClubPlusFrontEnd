import {ChangeDetectorRef, Component, inject} from '@angular/core';
import {LucideAngularModule} from "lucide-angular";
import {finalize, Subscription} from 'rxjs';
import {Club} from '../../../model/club';
import {ClubService} from '../../../service/model/club.service';
import {NotificationService} from '../../../service/model/notification.service';
import {FormsModule} from '@angular/forms';
import {MembreService} from '../../../service/model/membre.service';
import {SweetAlertService} from '../../../service/sweet-alert.service';

@Component({
  selector: 'app-mesclubs',
  imports: [
    LucideAngularModule,
    FormsModule
  ],
  templateUrl: './mesclubs.component.html',
  styleUrl: './mesclubs.component.scss'
})
export class MesclubsComponent {

  // --- Injections ---
  private membreService = inject(MembreService);
  private notification = inject(SweetAlertService);
  private cdr = inject(ChangeDetectorRef); // Indispensable avec OnPush

  // --- State Properties ---
  userClubs: Club[] = []; // Liste originale des clubs
  filteredClubs: Club[] = []; // Liste affichée, après filtrage
  isLoadingClubs = false;
  errorLoadingClubs: string | null = null;

  joinClubCode: string = 'CLUB-'; // <--- Valeur initiale ici
  isJoiningClub = false;
  errorJoiningClub: string | null = null; // Correction du type par rapport à votre code

  // Utilise un ID pour suivre quel club est en cours de suppression
  leavingClubId: number | null = null;
  // Utilise un Set pour stocker les ID des clubs où une erreur s'est produite lors de la tentative de départ
  errorLeavingClubIds = new Set<number>();
  clubSearchTerm: string = '';

  // --- Subscriptions ---
  private clubsSub: Subscription | null = null;
  private joinSub: Subscription | null = null;
  private leaveSub: Subscription | null = null;

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    this.loadUserClubs();
  }

  ngOnDestroy(): void {
    // Nettoyage des souscriptions pour éviter les fuites mémoire
    this.clubsSub?.unsubscribe();
    this.joinSub?.unsubscribe();
    this.leaveSub?.unsubscribe();
  }

  // --- Data Loading ---
  loadUserClubs(): void {
    this.isLoadingClubs = true;
    this.errorLoadingClubs = null;
    this.userClubs = [];
    this.filteredClubs = []; // Réinitialise aussi la liste filtrée
    this.clubSearchTerm = ''; // Réinitialise la recherche lors du rechargement
    this.cdr.detectChanges(); // Met à jour l'UI (chargement visible)

    this.clubsSub?.unsubscribe(); // Annule la requête précédente si elle existe

    this.clubsSub = this.membreService.getUserClubs().pipe(
      finalize(() => { // Sera exécuté que la requête réussisse ou échoue
        this.isLoadingClubs = false;
        this.cdr.detectChanges(); // Met à jour l'UI (fin du chargement)
      })
    ).subscribe({
      next: (clubs: Club[]) => {
        this.userClubs = clubs;
        this.filterClubsList(); // Appelle le filtre une fois les données chargées
        console.log('Clubs utilisateur chargés:', this.userClubs);
        // Change detection est déjà appelée dans finalize (ou peut être rappelée ici si besoin après filtre)
        // this.cdr.detectChanges(); // Déjà dans finalize
      },
      error: (error) => { // Type d'erreur plus générique
        console.error('Erreur chargement clubs:', error);
        this.errorLoadingClubs = error?.message || "Impossible de charger la liste de vos clubs.";
        this.filteredClubs = []; // Assure que la liste est vide en cas d'erreur
        // Change detection est déjà appelée dans finalize
      }
    });
  }

  // --- Club Actions ---
  joinClub(): void {
    const code = this.joinClubCode.trim();
    if (!code || this.isJoiningClub) {
      if (!code) {
        this.notification.show("Veuillez entrer un code club.", "warning");
      }
      return;
    }

    this.isJoiningClub = true;
    this.errorJoiningClub = null;
    this.errorLeavingClubIds.clear();
    this.cdr.detectChanges();

    this.joinSub?.unsubscribe();

    this.joinSub = this.membreService.joinClubByCode(code).pipe(
      finalize(() => {
        this.isJoiningClub = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (joinedClub) => { // Adapte selon ce que l'API renvoie
        // Utilisation plus sûre de l'objet retourné, par exemple si c'est un Club ou juste un message
        const clubName = (typeof joinedClub === 'object' && joinedClub?.nom) ? joinedClub.nom : code;
        this.notification.show(`Vous avez rejoint le club "${clubName}" !`, 'success');
        this.joinClubCode = '';
        this.loadUserClubs(); // Recharge la liste des clubs (qui appellera filterClubsList)
      },
      error: (error) => {
        console.error('Erreur pour rejoindre club:', error);
        this.errorJoiningClub = error?.message || "Impossible de rejoindre le club. Vérifiez le code.";
        if (this.errorJoiningClub){
        this.notification.show(this.errorJoiningClub, 'error');
        }
        // Change detection est déjà appelée dans finalize
      }
    });
  }

  leaveClub(club: Club): void {
    if (this.leavingClubId !== null) {
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir quitter le club "${club.nom}" ?`)) {
      return;
    }

    this.leavingClubId = club.id;
    this.errorJoiningClub = null;
    this.errorLeavingClubIds.delete(club.id);
    this.cdr.detectChanges();

    this.leaveSub?.unsubscribe();

    this.leaveSub = this.membreService.leaveClub(club.id).pipe(
      finalize(() => {
        this.leavingClubId = null;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.notification.show(`Vous avez quitté le club "${club.nom}".`, 'success');
        this.loadUserClubs(); // Recharge la liste (qui appellera filterClubsList)
      },
      error: (error) => {
        console.error(`Erreur pour quitter club ${club.id}:`, error);
        this.errorLeavingClubIds.add(club.id);
        this.notification.show(error?.message || `Impossible de quitter le club "${club.nom}".`, 'error');
        // Change detection est déjà appelée dans finalize
      }
    });
  }

  // --- Filtering Logic ---
  filterClubsList(): void {
    const searchTerm = this.clubSearchTerm.trim().toLowerCase();

    if (!searchTerm) {
      this.filteredClubs = [...this.userClubs]; // Copie de la liste originale si recherche vide
    } else {
      this.filteredClubs = this.userClubs.filter(club =>
        // Vérifie si les propriétés existent avant d'appeler toLowerCase et includes
        (club.nom && club.nom.toLowerCase().includes(searchTerm)) ||
        (club.ville && club.ville.toLowerCase().includes(searchTerm)) ||
        (club.codepostal && club.codepostal.toLowerCase().includes(searchTerm)) ||
        (club.codeClub && club.codeClub.toLowerCase().includes(searchTerm)) ||
        (club.rue && club.rue.toLowerCase().includes(searchTerm)) // Ajout de la rue si pertinent
      );
    }
    // Le filtre est appelé soit par (input) (déjà dans la zone Angular), soit après un appel HTTP (géré par finalize).
    // Un detectChanges ici peut être redondant mais assure la mise à jour si le filtre est appelé manuellement ailleurs.
    this.cdr.detectChanges();
  }

  // Helper pour le template pour vérifier si un ID est en erreur
  hasLeaveError(clubId: number): boolean {
    return this.errorLeavingClubIds.has(clubId);
  }

  copyCode(code: string | null | undefined, clubId?: number): void {
    if (!code) {
      this.notification.show('Code club non disponible.', 'warning');
      return;
    }

    navigator.clipboard.writeText(code).then(
      () => {
        this.notification.show(`Code "${code}" copié !`, 'success');
        // Optionnel: Feedback visuel direct sur la carte
        if (clubId) {
          const feedbackEl = document.getElementById(`copy-feedback-${clubId}`);
          if (feedbackEl) {
            feedbackEl.textContent = 'Copié!';
            setTimeout(() => { feedbackEl.textContent = ''; }, 1500); // Efface après 1.5s
          }
        }
      },
      (err) => {
        console.error('Erreur copie code club:', err);
        this.notification.show('Erreur lors de la copie du code.', 'error');
      }
    );
  }
}

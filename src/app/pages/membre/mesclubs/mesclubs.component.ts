import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { MembreService } from '../../../service/crud/membre.service';
import { SweetAlertService } from '../../../service/sweet-alert.service';

import { Club } from '../../../model/club';

import { LucideAngularModule } from 'lucide-angular';

/**
 * @Component MesclubsComponent
 * @description Page de gestion des affiliations aux clubs.
 * Permet de visualiser, rejoindre et quitter des clubs.
 * Inclut une fonctionnalité de recherche/filtrage.
 */
@Component({
  selector: 'app-mesclubs',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FormsModule
  ],
  templateUrl: './mesclubs.component.html',
  styleUrl: './mesclubs.component.scss'
})
export class MesclubsComponent implements OnInit, OnDestroy {

  // --- INJECTIONS DE SERVICES ---
  private notification = inject(SweetAlertService);
  private membreService = inject(MembreService);
  private cdr = inject(ChangeDetectorRef);

  // --- ÉTAT DU COMPOSANT ---
  /** Liste complète des clubs de l'utilisateur. */
  userClubs: Club[] = [];
  /** Liste des clubs filtrée pour l'affichage. */
  filteredClubs: Club[] = [];
  /** Indique si le chargement des clubs est en cours. */
  isLoadingClubs = false;
  /** Message d'erreur si le chargement des clubs échoue. */
  errorLoadingClubs: string | null = null;

  /** Code saisi pour rejoindre un club. */
  joinClubCode: string = 'CLUB-';
  /** Indique si une opération pour rejoindre un club est en cours. */
  isJoiningClub = false;
  /** Message d'erreur si la tentative de rejoindre un club échoue. */
  errorJoiningClub: string | null = null;

  /** ID du club en cours de départ. */
  leavingClubId: number | null = null;
  /** IDs des clubs pour lesquels une tentative de départ a échoué. */
  errorLeavingClubIds = new Set<number>();
  /** Terme de recherche pour filtrer les clubs. */
  clubSearchTerm: string = '';

  // --- ABONNEMENTS RxJS ---
  private clubsSub: Subscription | null = null;
  private joinSub: Subscription | null = null;
  private leaveSub: Subscription | null = null;

  // --- CYCLE DE VIE ANGULAR ---
  /**
   * @method ngOnInit
   * @description Appelé après l'initialisation. Lance le chargement initial des clubs.
   */
  ngOnInit(): void {
    console.log("MesclubsComponent: Initialisation.");
    this.loadUserClubs();
  }

  /**
   * @method ngOnDestroy
   * @description Appelé avant la destruction du composant. Désabonne tous les Observables actifs.
   */
  ngOnDestroy(): void {
    console.log("MesclubsComponent: Destruction, désinscription des abonnements.");
    this.clubsSub?.unsubscribe();
    this.joinSub?.unsubscribe();
    this.leaveSub?.unsubscribe();
  }

  // --- CHARGEMENT DES DONNÉES ---
  /**
   * @method loadUserClubs
   * @description Charge la liste des clubs de l'utilisateur.
   * Gère les états de chargement et d'erreur.
   */
  loadUserClubs(): void {
    this.isLoadingClubs = true;
    this.errorLoadingClubs = null;
    this.userClubs = [];
    this.filteredClubs = [];
    this.clubSearchTerm = '';
    this.cdr.detectChanges();

    this.clubsSub?.unsubscribe();

    this.clubsSub = this.membreService.getUserClubs().pipe(
      finalize(() => {
        this.isLoadingClubs = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (clubs: Club[]) => {
        this.userClubs = clubs;
        this.filterClubsList();
        console.log(`MesclubsComponent: ${this.userClubs.length} clubs utilisateur chargés.`);
      },
      error: (error) => {
        console.error('MesclubsComponent: Erreur lors du chargement des clubs:', error);
        this.errorLoadingClubs = error?.message || "Impossible de charger la liste de vos clubs.";
        this.filteredClubs = [];
      }
    });
  }

  // --- ACTIONS SUR LES CLUBS ---
  /**
   * @method joinClub
   * @description Tente de faire rejoindre un club à l'utilisateur.
   * Valide la saisie, appelle `MembreService.joinClubByCode()`, et gère les notifications.
   */
  joinClub(): void {
    const code = this.joinClubCode.trim();
    if (!code || code === 'CLUB-' || this.isJoiningClub) {
      if (!code || code === 'CLUB-') {
        this.notification.show("Veuillez entrer un code club valide.", "warning");
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
      next: (joinedClubResponse) => {
        let clubName = code;
        if (typeof joinedClubResponse === 'object' && joinedClubResponse !== null && 'nom' in joinedClubResponse) {
          clubName = (joinedClubResponse as Club).nom || code;
        }
        this.notification.show(`Vous avez rejoint le club "${clubName}" avec succès !`, 'success');
        this.joinClubCode = 'CLUB-';
        this.loadUserClubs();
        console.log("MesclubsComponent: Club rejoint avec succès.");
      },
      error: (error: HttpErrorResponse) => {
        console.error('MesclubsComponent: Erreur pour rejoindre le club:', error);
        this.errorJoiningClub = error.error?.message || error.message || "Impossible de rejoindre le club. Vérifiez le code ou si vous êtes déjà membre.";
        if (this.errorJoiningClub) {
          this.notification.show(this.errorJoiningClub, 'error');
        }
      }
    });
  }

  /**
   * @method leaveClub
   * @description Gère la demande de l'utilisateur pour quitter un club.
   * Affiche une confirmation et met à jour la liste des clubs.
   * @param club Le club que l'utilisateur souhaite quitter.
   */
  leaveClub(club: Club): void {
    if (this.leavingClubId !== null) {
      return;
    }

    this.notification.confirmAction(
      'Quitter ce club ?',
      `Êtes-vous sûr de vouloir quitter le club "${club.nom}" ? Cette action est irréversible.`,
      () => {
        console.log(`MesclubsComponent: Confirmation reçue pour quitter le club ID: ${club.id}`);
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
            this.notification.show(`Vous avez quitté le club "${club.nom}" avec succès.`, 'success');
            this.loadUserClubs();
            console.log(`MesclubsComponent: Club ID ${club.id} quitté.`);
          },
          error: (error: HttpErrorResponse) => {
            console.error(`MesclubsComponent: Erreur pour quitter le club ${club.id}:`, error);
            this.errorLeavingClubIds.add(club.id);
            const message = error.error?.message || error.message || `Impossible de quitter le club "${club.nom}".`;
            this.notification.show(message, 'error');
          }
        });
      },
      'Oui, quitter',
    );
  }

  // --- LOGIQUE DE FILTRAGE ---
  /**
   * @method filterClubsList
   * @description Filtre la liste des clubs par nom, ville, code postal, code club ou rue.
   */
  filterClubsList(): void {
    const searchTerm = this.clubSearchTerm.trim().toLowerCase();
    console.log(`MesclubsComponent: Filtrage de la liste des clubs avec le terme: "${searchTerm}"`);

    if (!searchTerm) {
      this.filteredClubs = [...this.userClubs];
    } else {
      this.filteredClubs = this.userClubs.filter(club =>
        (club.nom && club.nom.toLowerCase().includes(searchTerm)) ||
        (club.ville && club.ville.toLowerCase().includes(searchTerm)) ||
        (club.codepostal && club.codepostal.toLowerCase().includes(searchTerm)) ||
        (club.codeClub && club.codeClub.toLowerCase().includes(searchTerm)) ||
        (club.rue && club.rue.toLowerCase().includes(searchTerm))
      );
    }
    this.cdr.detectChanges();
  }

  // --- MÉTHODES UTILITAIRES POUR LE TEMPLATE ---
  /**
   * @method hasLeaveError
   * @description Vérifie si une erreur est survenue lors de la tentative de quitter un club.
   * @param clubId L'ID du club à vérifier.
   */
  hasLeaveError(clubId: number): boolean {
    return this.errorLeavingClubIds.has(clubId);
  }

  /**
   * @method copyCode
   * @description Copie le code fourni dans le presse-papiers et affiche une notification.
   * @param code Le code à copier.
   * @param clubId L'ID du club (optionnel, pour feedback UI).
   */
  copyCode(code: string | null | undefined, clubId?: number): void {
    if (!code) {
      this.notification.show('Code non disponible pour la copie.', 'warning');
      return;
    }

    navigator.clipboard.writeText(code).then(
      () => {
        this.notification.show(`Code "${code}" copié dans le presse-papiers !`, 'success');
        console.log(`MesclubsComponent: Code "${code}" copié.`);
        if (clubId) {
          const feedbackEl = document.getElementById(`copy-feedback-${clubId}`);
          if (feedbackEl) {
            feedbackEl.textContent = 'Copié!';
            setTimeout(() => { if(feedbackEl) feedbackEl.textContent = ''; }, 1500);
          }
        }
      },
      (err) => {
        console.error('MesclubsComponent: Erreur lors de la copie du code:', err);
        this.notification.show('Erreur lors de la copie du code. Vérifiez les permissions du navigateur.', 'error');
      }
    );
  }
}

import {Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild} from '@angular/core';

import { NavbarComponent } from "../../../component/navigation/navbar/navbar.component";
import { FooterComponent } from '../../../component/navigation/footer/footer.component';

import { LucideAngularModule } from 'lucide-angular';
import {SwiperContainer} from 'swiper/element';
import {CommonModule} from '@angular/common';

/**
 * @Component AboutComponent
 * @description Page "À Propos" de l'application.
 * Présente des informations générales sur l'application, son développeur,
 * le contexte du projet, les technologies et les fonctionnalités clés.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    NavbarComponent,
    LucideAngularModule,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AboutComponent {

  // --- PROPRIÉTÉS DU COMPOSANT ---
  /** Nom de l'application. */
  appName: string = 'Club Plus';

  /** Nom du développeur. */
  developerName: string = 'Axel MOMPER';

  /** Contexte du projet (formation). */
  projectContext: string = 'Projet réalisé dans le cadre du titre professionnel CDA-JAVA 2024-2025';

  /** Nom de l'école de formation. */
  schoolName: string = 'Metz Numeric School';

  /** Technologies et outils utilisés. */
  technologies: string[] = [
    'Angular',
    'TypeScript',
    'Spring Boot',
    'Java 17',
    'MySQL',
    'Hibernate/JPA',
    'Spring Security',
    'Maven',
    'Git & GitHub ',
    'HTML5',
    'CSS3/SCSS',
    'Lucide Icons ',
    'SweetAlert2',
    'jsPDF & qrious',
    'Chart.js'
  ];

  /** Principales fonctionnalités de l'application. */
  features: string[] = [
    'Gestion complète des utilisateurs (inscription, connexion, profil, rôles)',
    'Système de réservation d\'événements par catégories de places',
    'Gestion administrative des événements (CRUD complet)',
    'Suivi des participations et validation des présences via scan de QR codes',
    'Système de notation des événements par les participants sur plusieurs critères',
    'Fonctionnalité sociale : gestion d\'une liste d\'amis et demandes d\'ami',
    'Tableau de bord administrateur avec statistiques clés et graphiques (taux d\'occupation, inscriptions, notes moyennes)',
    'Gestion de l\'affiliation des membres aux clubs (rejoindre/quitter un club via code)',
    'Gestion des informations du club par les administrateurs',
    'Thème clair/sombre adaptable',
    'Interface utilisateur responsive pour une utilisation sur mobile et bureau'
  ];

  @ViewChild('swiperContainer') swiperContainerRef?: ElementRef<SwiperContainer>;
  private swiperInstance: SwiperContainer['swiper'] | null = null;

  ngAfterViewInit() {
    if (this.swiperContainerRef?.nativeElement) {
      const swiperEl = this.swiperContainerRef.nativeElement;

      const swiperParams = {
        slidesPerView: 3,
        spaceBetween: 16,
        loop: true,
        autoplay: {
          delay: 2500,
          disableOnInteraction: false,
        },
        pagination: {
          clickable: true,
        },
        slidesPerGroup: 1,

        breakpoints: {
          0: {
            slidesPerView: 1,
            spaceBetween: 10,
            slidesPerGroup: 1,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 15,
            slidesPerGroup: 1,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 16,
            slidesPerGroup: 1,
          }
        }
      };

      Object.assign(swiperEl, swiperParams);
      swiperEl.initialize();
      this.swiperInstance = swiperEl.swiper;

      if (this.swiperInstance) {
        if (this.swiperInstance.params.autoplay && (this.swiperInstance.params.autoplay as any).delay) {
          this.swiperInstance.autoplay.start();
        }

        this.swiperInstance.on('slideChange', () => {
          if (this.swiperInstance?.pagination && this.swiperInstance.pagination.el) {
            this.swiperInstance.pagination.update();
          }
        });

        this.swiperInstance.on('init', () => {
          if (this.swiperInstance?.pagination && this.swiperInstance.pagination.el) {
            this.swiperInstance.pagination.update();
          }
        });

        if (this.swiperInstance.params.loop && this.swiperInstance.pagination && this.swiperInstance.pagination.el) {
          this.swiperInstance.pagination.update();
        }
      }
    }
  }
}

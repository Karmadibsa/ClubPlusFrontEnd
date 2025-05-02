import { Component } from '@angular/core';
import {NavbarComponent} from "../../../component/navigation/navbar/navbar.component";
import {LucideAngularModule} from 'lucide-angular';
import {FooterComponent} from '../../../component/navigation/footer/footer.component';

@Component({
  selector: 'app-about',
  imports: [
    NavbarComponent,
    LucideAngularModule,
    FooterComponent
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  appName: string = 'Club Plus';
  developerName: string = 'Axel MOMPER';
  projectContext: string = 'Projet réalisé dans le cadre du titre professionnel CDA-JAVA 2024-2025';
  schoolName: string = 'Metz Numeric School';
  technologies: string[] = ['Angular', 'TypeScript', 'Spring Boot', 'Java 17', 'MySQL', 'Hibernate/JPA', 'Maven', 'Git', 'HTML5', 'CSS3/SCSS']; // [4]
  features: string[] = [
    'Gestion complète des utilisateurs',
    'Système de réservation par catégorie',
    'Gestion des événements (CRUD)',
    'Suivi des présences par QR codes',
    'Système de notation',
    'Fonctionnalité sociale (Amis)',
    'Tableau de bord statistiques'
  ];
}

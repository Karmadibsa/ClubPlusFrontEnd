import { Component } from '@angular/core';
import {FooterComponent} from '../../../component/navigation/footer/footer.component';
import {NavbarComponent} from '../../../component/navigation/navbar/navbar.component';

@Component({
  selector: 'app-accueil',
  imports: [
    FooterComponent,
    NavbarComponent
  ],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent {

}

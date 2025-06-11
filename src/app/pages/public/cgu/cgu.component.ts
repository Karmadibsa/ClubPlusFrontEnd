import { Component } from '@angular/core';
import {FooterComponent} from "../../../component/navigation/footer/footer.component";
import {LucideAngularModule} from "lucide-angular";
import {NavbarComponent} from "../../../component/navigation/navbar/navbar.component";
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-cgu',
  imports: [
    FooterComponent,
    LucideAngularModule,
    NavbarComponent,
    RouterLink
  ],
  templateUrl: './cgu.component.html',
  styleUrl: './cgu.component.scss'
})
export class CguComponent {

}

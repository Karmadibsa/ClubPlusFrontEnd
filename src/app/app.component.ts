import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LucideAngularModule} from 'lucide-angular';
import {AuthService} from './service/security/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'FrontEndClubPlus';

  auth = inject(AuthService)
}

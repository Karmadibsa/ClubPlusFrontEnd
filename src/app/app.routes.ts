import {Routes} from '@angular/router';
import {Page404Component} from './pages/public/page404/page404.component';
import {MonCompteComponent} from './pages/membre/moncompte/moncompte.component';
import {EventComponent} from './pages/membre/event/event.component';
import {BilletComponent} from './pages/membre/billet/billet.component';



export const routes: Routes = [
  {
    path: "event",
    component: EventComponent,
  },
  {
    path: "profil",
    component: MonCompteComponent,
  },
  {
    path: "billet",
    component: BilletComponent,
  },

  {path: "", redirectTo: "event", pathMatch: "full"},
  {path: "**", component: Page404Component, pathMatch: "full"}
];

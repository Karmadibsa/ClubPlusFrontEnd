import {Routes} from '@angular/router';
import {Page404Component} from './pages/public/page404/page404.component';
import {MonCompteComponent} from './pages/membre/moncompte/moncompte.component';
import {EventComponent} from './pages/membre/event/event.component';
import {BilletComponent} from './pages/membre/billet/billet.component';
import {DashboardComponent} from './pages/admin/dashboard/dashboard.component';
import {EventAdminComponent} from './pages/admin/eventAdmin/eventAdmin.component';
import {MembreAdminComponent} from './pages/admin/membreAdmin/membreAdmin.component';
import {MonclubComponent} from './pages/admin/monclub/monclub.component';
import {AccueilComponent} from './pages/public/accueil/accueil.component';
import {InscriptionClubComponent} from './pages/public/inscription-club/inscription-club.component';
import {InscriptionMembreComponent} from './pages/public/inscription-membre/inscription-membre.component';
import {LoginComponent} from './pages/public/login/login.component';



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
  {
    path: "dashboard",
    component: DashboardComponent,
  },
  {
    path: "eventadmin",
    component: EventAdminComponent,
  },
  {
    path: "membreadmin",
    component: MembreAdminComponent,
  },
  {
    path: "monclub",
    component: MonclubComponent,
  },
  {
    path: "accueil",
    component: AccueilComponent,
  },
  {
    path: "inscription-club",
    component: InscriptionClubComponent,
  },
  {
    path: "inscription-membres",
    component: InscriptionMembreComponent,
  },
  {
    path: "connexion",
    component: LoginComponent,
  },

  {path: "", redirectTo: "event", pathMatch: "full"},
  {path: "**", component: Page404Component, pathMatch: "full"}
];

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
import {connecteGuard} from './service/security/connecte.guard';



export const routes: Routes = [
  {
    path: "event",
    component: EventComponent,
    canActivate: [connecteGuard]
  },
  {
    path: "profil",
    component: MonCompteComponent,
    canActivate: [connecteGuard]
  },
  {
    path: "billet",
    component: BilletComponent,
    canActivate: [connecteGuard]
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [connecteGuard]
  },
  {
    path: "eventadmin",
    component: EventAdminComponent,
    canActivate: [connecteGuard]
  },
  {
    path: "membreadmin",
    component: MembreAdminComponent,
    canActivate: [connecteGuard]
  },
  {
    path: "monclub",
    component: MonclubComponent,
    canActivate: [connecteGuard]
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

  {path: "", redirectTo: "accueil", pathMatch: "full"},
  {path: "**", component: Page404Component, pathMatch: "full"}
];

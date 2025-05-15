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
import {managerGuard} from './service/security/manager.guard';
import {AmisComponent} from './pages/membre/amis/amis.component';
import {NotationComponent} from './pages/membre/notation/notation.component';
import {UserLayoutComponent} from './component/navigation/user-layout/user-layout.component';
import {ForgotPasswordComponent} from './pages/public/forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './pages/public/reset-password/reset-password.component';
import {AboutComponent} from './pages/public/about/about.component';
import {ContactComponent} from './pages/public/contact/contact.component';
import {MesclubsComponent} from './pages/membre/mesclubs/mesclubs.component';


export const routes: Routes = [
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
  {
    path: "reset-password",
    component: ResetPasswordComponent,
  },
  {
    path: "forgot-password",
    component: ForgotPasswordComponent,
  },
  {
    path: "about",
    component: AboutComponent,
  },
  {
    path: "contact",
    component: ContactComponent,
  },

  {
    path: 'app', // Ou un autre préfixe comme 'membre', ou même '' si c'est le défaut après login
    component: UserLayoutComponent, // Le composant parent qui contient la sidebar
    canActivate: [connecteGuard], // Protège TOUTES les routes enfants ci-dessous
    children: [
      // Routes Membre/Admin qui s'afficheront dans le <router-outlet> de UserLayoutComponent
      {path: "event", component: EventComponent}, // Note: plus besoin de canActivate ici si déjà sur le parent
      {path: "profil", component: MonCompteComponent},
      {path: "billet", component: BilletComponent},
      {path: "amis", component: AmisComponent},
      {path: "notation", component: NotationComponent},
      {path: "mesclubs", component: MesclubsComponent},
      {
        path: "dashboard",
        component: DashboardComponent,
        canActivate: [managerGuard] // Garde spécifique si nécessaire en plus de connecteGuard
      },
      {
        path: "eventadmin",
        component: EventAdminComponent,
        canActivate: [managerGuard] // Garde spécifique
      },
      {
        path: "membreadmin",
        component: MembreAdminComponent,
        canActivate: [managerGuard]
      },
      {
        path: "monclub",
        component: MonclubComponent,
        canActivate: [managerGuard]
      },
      // Redirection par défaut DANS le layout utilisateur (ex: vers dashboard ou event)
      {path: "", redirectTo: "event", pathMatch: "full"} // Ou 'dashboard' si c'est la page par défaut
    ]
  },

  {path: "", redirectTo: "accueil", pathMatch: "full"},
  {path: "**", component: Page404Component, pathMatch: "full"}
];

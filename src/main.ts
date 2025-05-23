import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {AppComponent} from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr, 'fr-FR');

import { register } from 'swiper/element/bundle'; // Importez register

register(); // Appelez register ici

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

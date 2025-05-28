import {ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {icons, LucideAngularModule} from 'lucide-angular';
import {jwtInterceptor} from './service/security/jwt.interceptor';
import {provideCharts, withDefaultRegisterables} from 'ng2-charts';
import {DATE_PIPE_DEFAULT_OPTIONS} from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({eventCoalescing: true}), provideRouter(routes), provideCharts(withDefaultRegisterables()), provideHttpClient(withInterceptors([jwtInterceptor])),
    importProvidersFrom(LucideAngularModule.pick(icons)),{
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: {
        // Vous pouvez spécifier un format de date par défaut ici aussi si vous le souhaitez
        // dateFormat: 'dd/MM/yyyy HH:mm',
        dateFormat: 'EEEE, MMMM d, y, h:mm:ss a zzzz', // Un format très verbeux et distinct

        timezone: 'Europe/Paris' // Ou '+0200' si vous préférez un décalage fixe
                                 // 'Europe/Paris' gérera l'heure d'été/hiver pour Paris.
      }
    },

    // --- CONFIGURATION DE LA LOCALE PAR DÉFAUT POUR LES PIPES (optionnel) ---
    // Si vous avez registerLocaleData(localeFr, 'fr-FR'); dans main.ts,
    // vous pouvez définir la LOCALE_ID ici pour qu'elle soit utilisée par défaut.
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
};

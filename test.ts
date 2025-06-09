// src/test.ts

import {getTestBed, TestBed} from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { LucideAngularModule, ChevronUp, CirclePlus } from 'lucide-angular';

// Initialisation standard
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Ajout global d'un module ou d'un provider
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      LucideAngularModule.pick({ ChevronUp, CirclePlus }), // Ajoute les icônes nécessaires
      // ...autres modules globaux si besoin
    ]
  });
});

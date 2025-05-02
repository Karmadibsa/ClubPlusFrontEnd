import {TestBed} from '@angular/core/testing';
import {CanActivateFn} from '@angular/router';

import {connecteGuard} from './connecte.guard';

describe('connecteGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => connecteGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { membreGuard } from './membre.guard';

describe('membreGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => membreGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

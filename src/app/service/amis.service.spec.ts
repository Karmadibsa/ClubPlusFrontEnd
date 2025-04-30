import { TestBed } from '@angular/core/testing';

import { AmisService } from './amis.service';

describe('AmisService', () => {
  let service: AmisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

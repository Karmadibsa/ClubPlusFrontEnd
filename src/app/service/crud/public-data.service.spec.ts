import {TestBed} from '@angular/core/testing';

import {PublicDataService} from './public-data.service';

describe('PublicDataService', () => {
  let service: PublicDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

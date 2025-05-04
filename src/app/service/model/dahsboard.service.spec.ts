import { TestBed } from '@angular/core/testing';

import { DahsboardService } from './dahsboard.service';

describe('DahsboardService', () => {
  let service: DahsboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DahsboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ReservationRowComponent} from './reservation-row.component';

describe('ReservationRowComponent', () => {
  let component: ReservationRowComponent;
  let fixture: ComponentFixture<ReservationRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationRowComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ReservationRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

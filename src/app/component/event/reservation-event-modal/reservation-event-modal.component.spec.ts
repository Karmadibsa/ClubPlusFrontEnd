import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationEventModalComponent } from './reservation-event-modal.component';

describe('ReservationEventModalComponent', () => {
  let component: ReservationEventModalComponent;
  let fixture: ComponentFixture<ReservationEventModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationEventModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationEventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

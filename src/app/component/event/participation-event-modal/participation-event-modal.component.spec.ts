import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipationEventModalComponent } from './participation-event-modal.component';

describe('ReservationEventModalComponent', () => {
  let component: ParticipationEventModalComponent;
  let fixture: ComponentFixture<ParticipationEventModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipationEventModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParticipationEventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

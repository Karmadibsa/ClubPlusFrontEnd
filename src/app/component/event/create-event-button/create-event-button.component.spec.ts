import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CreateEventButtonComponent} from './create-event-button.component';

describe('CreateEventButtonComponent', () => {
  let component: CreateEventButtonComponent;
  let fixture: ComponentFixture<CreateEventButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEventButtonComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CreateEventButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

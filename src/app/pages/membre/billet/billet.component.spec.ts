import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BilletComponent} from './billet.component';

describe('BilletComponent', () => {
  let component: BilletComponent;
  let fixture: ComponentFixture<BilletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilletComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BilletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

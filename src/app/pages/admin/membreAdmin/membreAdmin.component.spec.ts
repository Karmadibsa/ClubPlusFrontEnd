import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MembreComponent} from './membreAdmin.component';

describe('MembreComponent', () => {
  let component: MembreComponent;
  let fixture: ComponentFixture<MembreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembreComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MembreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

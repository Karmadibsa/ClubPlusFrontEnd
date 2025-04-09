import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscriptionMembreComponent } from './inscription-membre.component';

describe('InscriptionMembreComponent', () => {
  let component: InscriptionMembreComponent;
  let fixture: ComponentFixture<InscriptionMembreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscriptionMembreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscriptionMembreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

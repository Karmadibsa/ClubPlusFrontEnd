import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MonCompteComponent} from './moncompte.component';

describe('MonCompteComponent', () => {
  let component: MonCompteComponent;
  let fixture: ComponentFixture<MonCompteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonCompteComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MonCompteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

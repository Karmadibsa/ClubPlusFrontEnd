import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AmisComponent} from './amis.component';

describe('AmisComponent', () => {
  let component: AmisComponent;
  let fixture: ComponentFixture<AmisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmisComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AmisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

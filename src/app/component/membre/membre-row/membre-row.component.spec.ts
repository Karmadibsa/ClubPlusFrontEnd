import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MembreRowComponent} from './membre-row.component';

describe('MembreRowComponent', () => {
  let component: MembreRowComponent;
  let fixture: ComponentFixture<MembreRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembreRowComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MembreRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

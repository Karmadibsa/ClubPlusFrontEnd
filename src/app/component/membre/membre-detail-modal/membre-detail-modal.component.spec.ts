import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MembreDetailModalComponent} from './membre-detail-modal.component';

describe('MembreDetailModalComponent', () => {
  let component: MembreDetailModalComponent;
  let fixture: ComponentFixture<MembreDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembreDetailModalComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MembreDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

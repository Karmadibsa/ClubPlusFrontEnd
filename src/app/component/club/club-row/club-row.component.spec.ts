import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ClubRowComponent} from './club-row.component';

describe('ClubRowComponent', () => {
  let component: ClubRowComponent;
  let fixture: ComponentFixture<ClubRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

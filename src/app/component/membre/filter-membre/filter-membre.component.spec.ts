import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FilterMembreComponent} from './filter-membre.component';

describe('FilterMembreComponent', () => {
  let component: FilterMembreComponent;
  let fixture: ComponentFixture<FilterMembreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterMembreComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FilterMembreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

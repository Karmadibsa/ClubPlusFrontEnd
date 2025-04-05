import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FilterEventComponent} from './filter-event.component';

describe('FilterEventComponent', () => {
  let component: FilterEventComponent;
  let fixture: ComponentFixture<FilterEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterEventComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FilterEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ItemnotationComponent} from './itemnotation.component';

describe('ItemnotationComponent', () => {
  let component: ItemnotationComponent;
  let fixture: ComponentFixture<ItemnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemnotationComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ItemnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

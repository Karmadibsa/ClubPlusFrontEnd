import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MonclubComponent} from './monclub.component';

describe('MonclubComponent', () => {
  let component: MonclubComponent;
  let fixture: ComponentFixture<MonclubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonclubComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MonclubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

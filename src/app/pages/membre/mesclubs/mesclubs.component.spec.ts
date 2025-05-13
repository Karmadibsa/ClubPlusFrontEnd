import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MesclubsComponent} from './mesclubs.component';

describe('MesclubsComponent', () => {
  let component: MesclubsComponent;
  let fixture: ComponentFixture<MesclubsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesclubsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesclubsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

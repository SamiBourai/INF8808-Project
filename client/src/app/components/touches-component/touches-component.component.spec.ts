import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouchesComponentComponent } from './touches-component.component';

describe('TouchesComponentComponent', () => {
  let component: TouchesComponentComponent;
  let fixture: ComponentFixture<TouchesComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TouchesComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TouchesComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

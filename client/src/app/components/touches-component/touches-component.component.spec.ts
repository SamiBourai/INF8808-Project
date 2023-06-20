import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TouchesComponent } from './touches-component.component';

describe('TouchesComponentComponent', () => {
  let component: TouchesComponent;
  let fixture: ComponentFixture<TouchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TouchesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TouchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

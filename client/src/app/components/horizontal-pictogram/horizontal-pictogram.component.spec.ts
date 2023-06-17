import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorizontalPictogramComponent } from './horizontal-pictogram.component';

describe('HorizontalPictogramComponent', () => {
  let component: HorizontalPictogramComponent;
  let fixture: ComponentFixture<HorizontalPictogramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HorizontalPictogramComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HorizontalPictogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

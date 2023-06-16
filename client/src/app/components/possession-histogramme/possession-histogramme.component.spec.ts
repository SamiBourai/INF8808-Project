import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PossessionHistogrammeComponent } from './possession-histogramme.component';

describe('PossessionHistogrammeComponent', () => {
  let component: PossessionHistogrammeComponent;
  let fixture: ComponentFixture<PossessionHistogrammeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PossessionHistogrammeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PossessionHistogrammeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

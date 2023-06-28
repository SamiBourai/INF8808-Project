import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolarAreaChartsComponent } from './multi-bar-chart.component';

describe('PolarAreaChartsComponent', () => {
  let component: PolarAreaChartsComponent;
  let fixture: ComponentFixture<PolarAreaChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PolarAreaChartsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PolarAreaChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

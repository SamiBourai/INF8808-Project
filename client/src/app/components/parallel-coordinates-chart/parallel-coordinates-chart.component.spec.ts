import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParallelCoordinatesChartComponent } from './parallel-coordinates-chart.component';

describe('ParallelCoordinatesChartComponent', () => {
  let component: ParallelCoordinatesChartComponent;
  let fixture: ComponentFixture<ParallelCoordinatesChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParallelCoordinatesChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParallelCoordinatesChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

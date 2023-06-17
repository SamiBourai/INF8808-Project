import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WinsAndLossesBarsChartComponent } from './wins-and-losses-bars-chart.component';

describe('WinsAndLossesBarsChartComponent', () => {
  let component: WinsAndLossesBarsChartComponent;
  let fixture: ComponentFixture<WinsAndLossesBarsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WinsAndLossesBarsChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WinsAndLossesBarsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

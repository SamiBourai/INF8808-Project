import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackToBackChartComponent } from './back-to-back-chart.component';

describe('BackToBackChartComponent', () => {
  let component: BackToBackChartComponent;
  let fixture: ComponentFixture<BackToBackChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackToBackChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackToBackChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

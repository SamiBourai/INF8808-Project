import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BackToBackChartComponent } from './components/back-to-back-chart/back-to-back-chart.component';
import { PossessionHistogrammeComponent } from './components/possession-histogramme/possession-histogramme.component';
import { HorizontalPictogramComponent } from './components/horizontal-pictogram/horizontal-pictogram.component';
import { WinsAndLossesBarsChartComponent } from './components/wins-and-losses-bars-chart/wins-and-losses-bars-chart.component';
import { ParallelCoordinatesChartComponent } from './components/parallel-coordinates-chart/parallel-coordinates-chart.component';
import { PolarAreaChartsComponent } from './components/polar-area-charts/polar-area-charts.component';
import { PossessionTopFourComponent } from './components/possession-top-four/possession-top-four.component';
import { TouchesComponent } from './components/touches-component/touches-component.component';

@NgModule({
  declarations: [
    AppComponent,
    BackToBackChartComponent,
    PossessionHistogrammeComponent,
    PossessionTopFourComponent,
    TouchesComponent,
    HorizontalPictogramComponent,
    WinsAndLossesBarsChartComponent,
    ParallelCoordinatesChartComponent,
    PolarAreaChartsComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

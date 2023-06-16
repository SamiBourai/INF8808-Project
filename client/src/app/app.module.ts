import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BackToBackChartComponent } from './components/back-to-back-chart/back-to-back-chart.component';
import { PossessionHistogrammeComponent } from './components/possession-histogramme/possession-histogramme.component';
import { TouchesComponentComponent } from './components/touches-component/touches-component.component';
import { PossessionTopFourComponent } from './components/possession-top-four/possession-top-four.component';

@NgModule({
  declarations: [
    AppComponent,
    PossessionHistogrammeComponent,
    TouchesComponentComponent,
    BackToBackChartComponent,
    PossessionTopFourComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

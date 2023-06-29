import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { CHART_POLICE, COUNTRY_COLOR_SCALE, NOM_PAYS_FONTSIZE } from 'src/constants/constants';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements AfterViewInit{
  @ViewChild('legendChart') private chartContainer!: ElementRef;
  private observer: IntersectionObserver | null = null;
  public countries: string[] = [
    'Morocco',
    'Top 3 (Argentina, France, Croatia)',
    'Similar African Nations (Senagal, Tunisia, Ghana)'
  ];
  public colors: string[] = [
    '#E80284',
    '#03a0c7',
    '#DB8500',
  ];
  private element: any;
  private margin = { top: 30, right: 150, bottom: 10, left: 150 };
  private width: number = 0;
  private height: number =  75 - this.margin.top - this.margin.bottom;
  private svg: any;
  private countryColorScale: any;
  private xScale: any;



  constructor() { }


  observeChart() {
    const options = {
      root: null, // relative to document viewport 
      rootMargin: '-150px', // margin around root. Values are similar to css property. Unitless values not allowed
      threshold: 0.5 // visible amount of item shown in relation to root
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.createChart();
        } else {
          this.removeChart();
        }
      });
    });
    this.observer.observe(this.chartContainer.nativeElement);
}

  ngAfterViewInit() {
    this.observeChart();
}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.removeChart()
    this.observer?.disconnect()
    this.observeChart()
  }



  createChart(): void {
    this.element = this.chartContainer.nativeElement;
    this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
    this.createCountryColorScale();
    this.createXScale();
    this.createSVG();
    this.drawLegend();
  }

  private drawLegend() : void {
    this.svg.select('.legend-g')
            .selectAll('rect')
            .data(this.countries)
            .join('rect')
            .attr('height','20px')
            .attr('width','30px')
            .attr('x',(d:any)=>this.xScale(d))
            .attr('fill',(d:any)=>this.countryColorScale(d))
    this.svg.select('.legend-g')
            .selectAll('text')
            .data(this.countries)
            .join('text')
            .text((d:any)=> d)
            .attr('x',(d:any)=>this.xScale(d) + 35 )
            .attr('y', 15)
            .attr('fill',(d:any)=>this.countryColorScale(d))
            .style('font-size',NOM_PAYS_FONTSIZE)
            .style("font-family", CHART_POLICE)

  }

  private createSVG(): void {
    this.svg = d3.select(this.chartContainer.nativeElement)
        .append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.svg.append('g')
        .attr('class', 'legend-g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }

  private createCountryColorScale() : void {
    this.countryColorScale = d3.scaleOrdinal()
                        .domain(this.countries)
                        .range(this.colors)
  }
  private createXScale(): void {
    this.xScale = d3.scaleBand()
        .domain(this.countries)
        .range([0, this.width])
        .paddingInner(0.1); // You can adjust this to add some padding between bars

  }


  removeChart() {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

}

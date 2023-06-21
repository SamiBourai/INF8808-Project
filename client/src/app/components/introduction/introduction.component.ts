import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  Renderer2,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.css']
})
export class IntroductionComponent implements OnInit {
  @ViewChild('legendChart') private chartContainer!: ElementRef;
  private observer: IntersectionObserver | null = null;
  public countries: string[] = [
    'Morocco',
    'Top 3 \n(Argentina, France, Croatia)',
    'Similar African Countries'
  ];
  public colors: string[] = [
    '#E80284',
    '#4517EE',
    '#DB8500',
  ];
  private element: any;
  private margin = { top: 50, right: 150, bottom: 20, left: 150 };
  private width: number = 0;
  private height: number =  100 - this.margin.top - this.margin.bottom;
  private svg: any;
  private countryColorScale: any;
  private xScale: any;
  private data = this.countries.reduce((acc, country, i) => {
    acc[country] = this.colors[i];
    return acc;
}, {});



  constructor() { }

  ngOnInit(): void {
    this.element = this.chartContainer.nativeElement;
    this.width = this.element.offsetWidth - this.margin.left - this.margin.right;

  }

  ngAfterViewInit() {
    this.observeChart();
  }



  observeChart() {
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

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    d3.select(this.chartContainer.nativeElement).select('svg').remove();
    this.createChart();
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
            .attr('y', 10)
            .attr('fill',(d:any)=>this.countryColorScale(d))
            .style('font-size','15px')
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

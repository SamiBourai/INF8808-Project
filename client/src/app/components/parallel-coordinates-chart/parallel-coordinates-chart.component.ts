import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';

import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { COLOR_PARALLEL_CHART, TEAM_STATS } from 'src/constants/constants';

@Component({
  selector: 'app-parallel-coordinates-chart',
  templateUrl: './parallel-coordinates-chart.component.html',
  styleUrls: ['./parallel-coordinates-chart.component.css'],
})
export class ParallelCoordinatesChartComponent
  implements OnInit, AfterViewInit
{
  @ViewChild('parallelChart') private chartContainer!: ElementRef;
  private observer: IntersectionObserver | null = null;

  constructor(private http: HttpClient) {}

  private data: any;
  private element: any;
  private margin = { top: 100, right: 50, bottom: 10, left: 50 };
  private width = 500 - this.margin.left - this.margin.right;
  private height = 500 - this.margin.top - this.margin.bottom;
  private xScale: any;
  private colorScale: any;
  private countries = ['Morocco', 'Argentina', 'France', 'Croatia', 'Ghana', 'Tunisia', 'Croatia'];
  public colors = COLOR_PARALLEL_CHART
  private dimensions = ['pass', 'goal', 'recup', 'tacles', 'intercep'];
  private xlabels = {
    pass: 'Number of\nattempted passes\n/90min',
    goal: 'Number of\ngoal-creating actions\n/90min',
    recup: 'Number of\nrecoveries\n/90min',
    tacles: 'Number of\ntackles\n/90min',
    intercep: 'Number of\ninterceptions\n/90min',
  };

  private animationTime = 1000;
  private yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};
  private svg: any;
  private color = d3.scaleOrdinal().domain(this.countries).range(this.colors);
  
  ngOnInit() {
    
    const list= TEAM_STATS
    this.data = list

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

  ngAfterViewInit() {
    this.observeChart();
  }

  createChart(): void {
    this.element = this.chartContainer.nativeElement;
    this.width =
      this.element.offsetWidth - this.margin.left - this.margin.right;
    this.xScale = d3
      .scalePoint()
      .range([0, this.width])
      .domain(this.dimensions);
    this.colorScale = d3
      .scaleOrdinal()
      .domain(this.countries)
      .range(Object.values(this.colors));

    for (let dimension of this.dimensions) {
      const max = Math.max(
        ...this.data.map((d: any) => parseFloat(d[dimension]))
      );
      this.yScales[dimension] = d3
        .scaleLinear()
        .domain([0, 1.1 * max])
        .range([this.height, 0]);
    }
    this.buildSvg();

  }


  private highlight(d: any, color: any) {
    // first every group turns grey
    d3.selectAll('.line')
      .filter((node: any) => node.country !== d.country)
      .transition()
      .duration(200)
      .ease(d3.easeCubicInOut)
      .style('opacity', '0.3');
    // Second the hovered specie takes its color
    d3.selectAll('.' + d.country)
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(200)
      .style('stroke', color[d.country])
      .style('opacity', '1');
  }

  doNotHighlight(d: any, color: any): void {
    d3.selectAll('.line')
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(200)
      .style('stroke', color[d.country])
      .style('opacity', '1');
  }

  buildSvg(): void {
    let element = this.chartContainer.nativeElement;
    const tooltip = d3.select('#tooltip');
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);
    
    this.svg
      .append('g')
      .attr('class', 'lines-g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

      const paths = this.svg
      .selectAll('.lines-g')
      .selectAll('path')
      .data(this.data)
      .join('path')
      .attr('class', (d: any) => "line " + this.d_class(d))
      .attr('fill', 'none')
      .attr('stroke-width', 4)
      .attr('opacity', 0)
      .attr('d', (d: any) => this.path(d))
      .attr('stroke', (d: any) => this.d_country(d))
      .on('mouseover', (e, d) => {
        this.highlight(d, this.color)
        tooltip
          .style('opacity', 1)
          .style('border', `2px solid ${this.d_country(d)}`)
          .style('left', e.pageX - 55 + 'px')
          .style('top', e.pageY - 75 + 'px').html(`
            <div style="text-align: center;color=${this.colorScale(d.country)}">
                ${d.country}
            </div>
          `);
      })
      .on('mouseleave', (e, d) => {
        this.doNotHighlight(d, this.color)
        tooltip.style('opacity', 0);});

    paths
      .attr('stroke-dashoffset', (d:any) => (d3.select(".line-" + d.country).node() as SVGPathElement).getTotalLength())
      .attr('stroke-dasharray', (d:any) => (d3.select(".line-" + d.country).node() as SVGPathElement).getTotalLength())
      .attr('opacity', 1)
      .transition()
      .duration(this.animationTime)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);
  
    this.svg
    .selectAll('g')
    // For each dimension of the dataset, add a 'g' element:
    .data(this.dimensions)
    .join('g')
    .attr('class', 'y-axis')
    .attr(
      'transform',
      (d: any) =>
        `translate(${this.margin.left + this.xScale(d)},${this.margin.top})`
    )
    .each((d: any, i: number, nodes: any) => {
      const axis = d3.axisLeft(this.yScales[d]).ticks(5);
      d3.select(nodes[i]).call(axis);
    });
    this.svg
      .selectAll('.tick text')
      .attr('font-size', '12px')
      .attr('font-family', 'Arial');


    this.svg
      .selectAll('.y-axis')
      .append('text')
      .style('text-anchor', 'middle')
      .attr('y', -50)
      .style('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-family', 'Arial')
      .attr('opacity',0)
      .each((d: any, i: number, nodes: any) => {
        let text = this.xlabels[d];
        let parts = text.split('\n'); // split on space, or choose your own criterion
        parts.forEach((part: any, index: number) => {
          d3.select(nodes[i])
            .append('tspan')
            .attr('x', 0)
            .attr('dy', `1.2em`)
            .style('font-weight', index === 1 ? 'bold' : 'none')
            .text(part);
        });
      })
      .transition()
      .delay((d:any,i:number) => i*this.animationTime/this.dimensions.length)
      .attr('opacity',1)
  }

  d_country(d) {
    return this.colorScale(d.country); // removed nullish coalescing
  }

  d_class(d) {
    return 'line-' + d.country;
  }

  path(d: any) {
    return d3.line()(
      this.dimensions.map((p) => [this.xScale(p), this.yScales[p](d[p])]));
  }


  removeChart(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

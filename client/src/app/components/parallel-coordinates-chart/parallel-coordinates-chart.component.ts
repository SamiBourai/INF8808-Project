import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';

import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { TEAM_STATS, CHART_POLICE, COUNTRY_COLOR_SCALE, NOT_FOCUSED_OPACITY } from 'src/constants/constants';
import { Team } from 'src/models/interfaces/parallel';

@Component({
  selector: 'app-parallel-coordinates-chart',
  templateUrl: './parallel-coordinates-chart.component.html',
  styleUrls: ['./parallel-coordinates-chart.component.css'],
})
export class ParallelCoordinatesChartComponent
  implements AfterViewInit
{
  @ViewChild('parallelChart') private chartContainer!: ElementRef;
  private observer: IntersectionObserver | null = null;

  constructor(private http: HttpClient) {}

  private element: any;
  private margin = { top: 100, right: 50, bottom: 10, left: 50 };
  private width = 500 - this.margin.left - this.margin.right;
  private height = 500 - this.margin.top - this.margin.bottom;
  private xScale: any;
  private dimensions = ['pass', 'goal', 'recup', 'tacles', 'intercep'];
  private xlabels = {
    pass: 'Number of\nattempted passes\n(NAP)\n/90min',
    goal: 'Number of\ngoal-creating actions\n(NGCA)\n/90min',
    recup: 'Number of\nrecoveries\n(NR)\n/90min',
    tacles: 'Number of\ntackles\n(NT)\n/90min',
    intercep: 'Number of\ninterceptions\n(NI)\n/90min',
  };

  private animationTime = 1000;
  private yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};
  private svg: any;
  private data: Team[] = TEAM_STATS


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
    this.removeChart()
    this.observer?.disconnect()
    this.observeChart()
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

    for (let dimension of this.dimensions) {
      const max = Math.max(
        ...this.data.map((d: Team) => parseFloat(d[dimension]))
      );
      this.yScales[dimension] = d3
        .scaleLinear()
        .domain([0, 1.1 * max])
        .range([this.height, 0]);
    }
    this.buildSvg();

  }


  private highlight(d: Team, color:string) {
    // first every group turns grey
    d3.selectAll('.line')
      .filter((node: any) => node.country !== d.country)
      .transition()
      .duration(200)
      .ease(d3.easeCubicInOut)
      .style('opacity', NOT_FOCUSED_OPACITY);
      
    // Second the hovered specie takes its color
    d3.selectAll('.' + d.country)
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(200)
      .style('opacity', '1');
  }

  doNotHighlight(d: Team,color:string): void {
    d3.selectAll('.line')
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(200)
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
      .attr('stroke', (d: Team) => COUNTRY_COLOR_SCALE(d.country))
      .on('mouseover', (e, d:Team) => {
        this.highlight(d, COUNTRY_COLOR_SCALE(d.country) as string)
        tooltip
          .style('opacity', 1)
          .style('border', `2px solid ${COUNTRY_COLOR_SCALE(d.country)}`)
          .style('left', e.pageX + 5 + 'px')
          .style('top', e.pageY - 60 + 'px').html(`
            <div>
                <h3 style='color:${COUNTRY_COLOR_SCALE(d.country)}'>${d.country}</h3>
                <p><span style='font-weight:bold'>NAP: </span></span>${d.pass}</p>
                <p< <span style='font-weight:bold'>NGCA: </span> ${d.goal}</p>
                <p><span style='font-weight:bold'>NR: </span>${d.recup} </p>
                <p><span style='font-weight:bold'>NT: </span>${d.tacles}</p>
                <p><span style='font-weight:bold'>NI: </span>${d.intercep}</p>
            </div>
          `);
        
      })
      .on('mouseleave', (e, d) => {
        this.doNotHighlight(d, COUNTRY_COLOR_SCALE(d.country) as string)
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
      .attr('font-family', CHART_POLICE);


    this.svg
      .selectAll('.y-axis')
      .append('text')
      .style('text-anchor', 'middle')
      .attr('y', -70)
      .style('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-family', CHART_POLICE)
      .attr('opacity',0)
      .each((d: any, i: number, nodes: any) => {
        let text = this.xlabels[d];
        let parts = text.split('\n');
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

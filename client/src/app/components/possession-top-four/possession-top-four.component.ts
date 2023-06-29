import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import {
  COLOR_OF_TOP4,
  COUNTRIES_TOP4,
  POSSESSION_DATA_TOP3,
} from 'src/constants/constants';
import { Possession } from 'src/models/interfaces/possession';

@Component({
  selector: 'app-possession-top-four',
  templateUrl: './possession-top-four.component.html',
  styleUrls: ['./possession-top-four.component.css'],
})
export class PossessionTopFourComponent implements OnInit, AfterViewInit {
  @ViewChild('histogramme2') private chartContainer2!: ElementRef;
  private data2: Possession[] = [];
  private observer2: IntersectionObserver | null = null;
  constructor() {}

  ngOnInit(): void {
    this.data2 = COUNTRIES_TOP4.map((country, i) => ({
      country: country,
      possessionPercentage: POSSESSION_DATA_TOP3[i],
      color: COLOR_OF_TOP4[i],
    }));
  }

  ngAfterViewInit() {
    this.observeChart();
  }
  observeChart() {
    this.observer2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.createChart();
        } else {
          this.removeChart();
        }
      });
    });
    this.observer2.observe(this.chartContainer2.nativeElement);
  }

  @HostListener('window:resize', ['$event'])
  onResize2(event: any) {
    this.removeChart()
    this.observer2?.disconnect()
    this.observeChart()
  }

  createChart(): void {
    let element = this.chartContainer2.nativeElement;
    const margin = { top: 70, right: 100, bottom: 40, left: 100 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
    // Sort Data
    this.data2 = this.data2.sort(
      (eq1: Possession, eq2: Possession) =>
        eq2.possessionPercentage - eq1.possessionPercentage
    );

    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(this.data2.map((d) => d.country))
      .padding(0.1);

    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    let xAxis = svg
      .append('g')
      .attr('transform', `translate(0,${-10})`)
      .call(
        d3
          .axisBottom(x)
          .tickSizeOuter(0)
          .ticks(5)
          .tickFormat((d: any) => Math.abs(d as number).toString())
      );

    xAxis.selectAll('.tick text').attr('dy', -20);

    svg.append('g').attr('transform', `translate(${width / 2},${height})`);

    x.ticks().forEach((tick) => {
      svg
        .append('g')
        .attr('class', 'grid-line')
        .append('line')
        .attr('x1', x(tick))
        .attr('y1', 0)
        .attr('x2', x(tick))
        .attr('y2', height)
        .style('stroke', '#5a5858a8')
        .style('stroke-dasharray', '3, 3');
    });

    let yAxis = svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .attr('stroke', 'none');

    yAxis
      .selectAll('.tick text')
      .attr('fill', (d: any, i: any) => this.data2[i].color) // This will hide the tick lines
      .attr('font-size', 15)
      .attr('font-family', 'Arial');

    const tooltip = d3.select('#tooltip');

    svg
      .append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'end')
      .attr('x', (width + margin.left + margin.right) / 2 + 30)
      .attr('y', -40)
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .style('font-family', 'Arial')
      .text('Average Possession (%) (Knockout Stage)');

    svg
      .selectAll('myRect')
      .data(this.data2)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: Possession) => x(Math.min(0, d.possessionPercentage)))
      .attr('y', (d: Possession) => y(d.country) ?? '')
      .attr('height', y.bandwidth())
      .attr('fill', (d: Possession) => d.color)
      .on('mouseover', (event: any, d: Possession) => {
        svg.select(`.possession-${d.country}`).attr('fill', '#08b355');
        svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
        svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity', 0.3);

        svg
          .selectAll('rect')
          .filter((node: any) => node.country !== d.country)
          .transition()
          .duration(100)
          .ease(d3.easeCubicInOut)
          .attr('opacity', 0.3);
        tooltip
          .style('opacity', 1)
          .style('border', `2px solid ${d.color}`)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
      <div>
      <div>${d.country}</div>
      <div>${Math.abs(d.possessionPercentage)}%</div>
      </div>
      `);
      })
      .on('mouseout', (event: MouseEvent, d: Possession) => {
        svg.select(`.possession-${d.country}`).attr('fill', '#35d047b6');
        svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node.country !== d.country)
          .select('text')
          .style('font-weight', 'normal');
        tooltip.style('opacity', 0);

        svg
          .selectAll('rect')
          .filter((node: any) => node.country !== d.country)
          .transition()
          .duration(100)
          .ease(d3.easeCubicInOut)
          .attr('opacity', 1);
        svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity', 1);
      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d: Possession) =>
        Math.abs(x(d.possessionPercentage) - x(0))
      );
  }

  removeChart() {
    d3.select(this.chartContainer2.nativeElement).selectAll('*').remove();
  }
}

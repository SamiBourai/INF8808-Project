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
  COUNTRIES_TOP4,
  POSSESSION_CHART_DATA,
  NOT_FOCUSED_OPACITY,
  NOM_PAYS_FONTSIZE,
  CHART_POLICE,
  COUNTRY_COLOR_SCALE,
  POSSESSION_DATA_TOP3,
} from 'src/constants/constants';
import { Possession } from 'src/models/interfaces/possession';
@Component({
  selector: 'app-possession-top-four',
  templateUrl: './possession-top-four.component.html',
  styleUrls: ['./possession-top-four.component.css'],
})
export class PossessionTopFourComponent implements OnInit, AfterViewInit {
  @ViewChild('histogramme2') private chartContainer!: ElementRef;

  private element: any;
  private margin = { top: 70, right: 100, bottom: 40, left: 100 };
  private width = 0;
  private height = 400 - this.margin.top - this.margin.bottom;
  private layoutStroke = '#5a5858a8';
  private xOffSet = 30;
  private transitionDuration = 100;
  private data: Possession[] = [];
  private observer: IntersectionObserver | null = null;
  private svg: any;
  private yScale: any;
  private xScale: any;

  constructor() {}

  ngOnInit(): void {
    this.data = COUNTRIES_TOP4.map((country, i) => ({
      country: country,
      percentage: POSSESSION_DATA_TOP3[i],
    }));
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
    this.observer?.disconnect();
    this.observeChart();
    this.removeChart();
  }

  createChart(): void {
    this.element = this.chartContainer.nativeElement;
    this.margin = { top: 70, right: 100, bottom: 40, left: 100 };
    this.width =
      this.element.offsetWidth - this.margin.left - this.margin.right;
    const layoutStrok = '#5a5858a8';

    this.xScale = d3.scaleLinear().domain([0, 100]).range([0, this.width]);

    this.yScale = d3
      .scaleBand()
      .range([0, this.height])
      .domain(this.data.map((d) => d.country))
      .padding(0.1);

    this.svg = d3
      .select(this.element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    let xAxis = this.svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${-10})`)
      .call(
        d3
          .axisBottom(this.xScale)
          .tickSizeOuter(0)
          .ticks(5)
          .tickFormat((d: any) => Math.abs(d as number).toString())
      );

    xAxis.selectAll('.tick text').attr('dy', -20);

    this.svg.append('g').attr('class', 'layout');
    this.xScale.ticks().forEach((tick: string) => {
      this.svg
        .select('.layout')
        .append('g')
        .attr('class', 'grid-line')
        .append('line')
        .attr('x1', this.xScale(tick))
        .attr('y1', 0)
        .attr('x2', this.xScale(tick))
        .attr('y2', this.height)
        .style('stroke', this.layoutStroke)
        .style('stroke-dasharray', '3, 3');
    });

    let yAxis = this.svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale).tickSizeOuter(0))
      .attr('stroke', 'none');

    yAxis
      .selectAll('.tick text')
      .attr('fill', (country: string) => COUNTRY_COLOR_SCALE(country)) // This will hide the tick lines
      .attr('font-size', NOM_PAYS_FONTSIZE)
      .attr('font-family', CHART_POLICE)
      .attr('class', 'ytick');

    this.svg.selectAll('.tick line').attr('stroke', 'none'); // This will hide the tick lines

    this.svg
      .append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'end')
      .attr(
        'x',
        (this.width + this.margin.left + this.margin.right) / 2 + this.xOffSet
      )
      .attr('y', -40)
      //fill with white
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .style('font-family', CHART_POLICE)
      .text('Average Possession (%) (Knockout Stage)');

    this.svg.append('g').attr('class', 'bars-g');
    this.svg
      .select('.bars-g')
      .selectAll('g')
      .data(this.data)
      .join('g')
      .attr('class', 'bar-g')
      .append('rect')
      .attr('x', 0)
      .attr(
        'y',
        (possesion: Possession) => this.yScale(possesion.country) ?? ''
      )
      .attr('height', this.yScale.bandwidth())
      .attr('fill', (possession: Possession) =>
        COUNTRY_COLOR_SCALE(possession.country)
      )
      .on('mouseover', (event: any, possession: Possession) => {
        this.highlightYAxis(possession.country);
        this.highlightBar(possession);
      })
      .on('mouseout', (event: MouseEvent, possession: Possession) => {
        this.unhighlightYAxis(possession.country);
        this.unhighlightBar(possession);
      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (possesion: Possession) =>
        this.xScale(possesion.percentage)
      );
  }

  highlightBar(possession: Possession): void {
    this.svg
      .selectAll('.bar-g')
      .filter((node: any) => node.country !== possession.country)
      .select('rect')
      .transition()
      .duration(this.transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr('opacity', NOT_FOCUSED_OPACITY);

    const barmargin = 5;
    this.svg
      .selectAll('.bar-g')
      .filter(
        (possession2: Possession) => possession2.country === possession.country
      )
      .append('text')
      .text((possesion: Possession) => possesion.percentage.toString())
      .style('font-size', NOM_PAYS_FONTSIZE)
      .style('font-family', CHART_POLICE)
      .attr(
        'x',
        (possesion: Possession) => this.xScale(possesion.percentage) + barmargin
      )
      .attr(
        'y',
        (possesion: Possession) =>
          this.yScale(possesion.country) + this.yScale.bandwidth() / 2 + 4
      )
      .attr('text-anchor', 'left')
      .attr('fill', (possession: Possession) =>
        COUNTRY_COLOR_SCALE(possession.country)
      );
  }

  unhighlightBar(d: any): void {
    this.svg
      .selectAll('.bar-g')
      .filter((node: any) => node.country !== d.country)
      .select('rect')
      .transition()
      .duration(this.transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr('opacity', 1);

    this.svg
      .selectAll('.bar-g text')
      .filter((node: any) => node.country === d.country)
      .remove();
  }

  highlightYAxis(country: string) {
    this.svg
      .selectAll('.y-axis .tick')
      .filter((tick: string) => tick === country)
      .select('text')
      .style('font-weight', 'bold');
    this.svg
      .selectAll('.y-axis .tick')
      .filter((tick: string) => tick !== country)
      .attr('opacity', NOT_FOCUSED_OPACITY);
  }

  unhighlightYAxis(country: string) {
    this.svg
      .selectAll('.y-axis .tick')
      .filter((tick: string) => tick === country)
      .select('text')
      .style('font-weight', 'normal');
    this.svg
      .selectAll('.y-axis .tick')
      .filter((tick: string) => tick !== country)
      .attr('opacity', 1);
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

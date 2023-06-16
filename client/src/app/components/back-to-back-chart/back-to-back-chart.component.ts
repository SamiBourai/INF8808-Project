import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import * as d3 from 'd3';

interface CountryData {
  country: string;
  scored: number;
  conceded: number;
}

@Component({
  selector: 'app-back-to-back-chart',
  templateUrl: './back-to-back-chart.component.html',
  styleUrls: ['./back-to-back-chart.component.css'],
})
export class BackToBackChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') private chartContainer!: ElementRef;

  private data: CountryData[] = [];
  private observer: IntersectionObserver | null = null;

  constructor() {}

  ngOnInit(): void {
    const countries: string[] = [
      'Morroco',
      'Argentina',
      'France',
      'Croatia',
      'Senegal',
      'Cameroon',
      'Tunisia',
      'Ghana',
    ];
    const scoredGoals: number[] = [6, 15, 16, 8, 5, 4, 1, 5];
    const concededGoals: number[] = [5, 8, 8, 7, 7, 4, 1, 7];

    this.data = countries.map((country, i) => ({
      country: country,
      scored: scoredGoals[i],
      conceded: -concededGoals[i],
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
    d3.select(this.chartContainer.nativeElement).select('svg').remove();
    this.createChart();
  }

  createChart(): void {
    let element = this.chartContainer.nativeElement;
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([-10, 16]).range([0, width]);

    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(this.data.map((d) => d.country))
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
          .tickValues([-8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12, 14, 16])
          .tickSizeOuter(0)
          .tickFormat((d: any) => Math.abs(d as number).toString())
      );

    xAxis.selectAll('.tick text').attr('dy', -18);

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

    svg.append('g').call(d3.axisLeft(y).tickSizeOuter(0));

    const tooltip = d3.select('#tooltip');

    svg
      .selectAll('myRect')
      .data(this.data)
      .enter()
      .append('rect')
      .attr('class', (d: CountryData) => `conceded-${d.country}`)
      .attr('x', (d: CountryData) => x(0))
      .attr('y', (d: CountryData) => y(d.country) ?? '')
      .attr('height', y.bandwidth())
      .attr('fill', '#d04a35cc')
      .on('mouseover', (event: MouseEvent, d: CountryData) => {
        svg.select(`.scored-${d.country}`).attr('opacity', 0.5);
        svg.select(`.conceded-${d.country}`).attr('fill', '#e72e11');
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
        tooltip
          .style('opacity', 1)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
      <div>
      <div>${d.country}</div>
      <div>Conceded Goals</div>
      <div>${Math.abs(d.conceded)}</div>
      </div>
      `);
      })
      .on('mouseout', (event: MouseEvent, d: CountryData) => {
        svg.select(`.scored-${d.country}`).attr('opacity', 1);
        svg.select(`.conceded-${d.country}`).attr('fill', '#d04a35cc');
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'normal');
        tooltip.style('opacity', 0);
      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d: CountryData) => Math.abs(x(d.conceded) - x(0)))
      .attr('x', (d: CountryData) => x(Math.min(0, d.conceded)));

    svg
      .selectAll('myRect')
      .data(this.data)
      .enter()
      .append('rect')
      .attr('class', (d: CountryData) => `scored-${d.country}`)
      .attr('x', (d: CountryData) => x(Math.min(0, d.scored)))
      .attr('y', (d: CountryData) => y(d.country) ?? '')
      .attr('height', y.bandwidth())
      .attr('fill', '#35d047b6')
      .on('mouseover', (event: any, d: any) => {
        svg.select(`.conceded-${d.country}`).attr('opacity', 0.5);
        svg.select(`.scored-${d.country}`).attr('fill', '#08b355');
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
        tooltip
          .style('opacity', 1)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
      <div>
      <div>${d.country}</div>
      <div>Scored Goals</div>
      <div>${Math.abs(d.scored)}</div>
      </div>
      `);
      })
      .on('mouseout', (event: MouseEvent, d: CountryData) => {
        svg.select(`.conceded-${d.country}`).attr('opacity', 1);
        svg.select(`.scored-${d.country}`).attr('fill', '#35d047b6');
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'normal');
        tooltip.style('opacity', 0);
      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d: CountryData) => Math.abs(x(d.scored) - x(0)));
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

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
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
    const possessionPercentages2: number[] = [39, 51.3, 56.5, 54.3];
    const countries2: string[] = ['Morroco', 'Argentina', 'France', 'Croatia'];
    const colors2: string[] = ['#e80284', '#4517EE', '#4517EE', '#4517EE'];

    this.data2 = countries2.map((country, i) => ({
      country: country,
      possessionPercentage: possessionPercentages2[i],
      color: colors2[i],
    }));
  }

  ngAfterViewInit() {
    this.observeChart2();
  }
  observeChart2() {
    this.observer2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.createChart2();
        } else {
          this.removeChart2();
        }
      });
    });
    this.observer2.observe(this.chartContainer2.nativeElement);
  }

  @HostListener('window:resize', ['$event'])
  onResize2(event: any) {
    d3.select(this.chartContainer2.nativeElement).select('svg').remove();
    this.createChart2();
  }

  /**
   * chart 2
   */
  createChart2(): void {
    let element = this.chartContainer2.nativeElement;
    const margin = { top: 70, right: 100, bottom: 40, left: 100 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

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

    svg
      .append('g')
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .attr('stroke', 'none');

    svg.selectAll('.tick line').attr('stroke', 'none'); // This will hide the tick lines

    const tooltip = d3.select('#tooltip');

    svg
      .append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'end')
      .attr('x', width / 2)
      .attr('y', -40)
      .attr('fill', '#fff')
      .text('Average Possession (%)');

    svg
      .selectAll('myRect')
      .data(this.data2)
      .enter()
      .append('rect')
      .attr('class', (d: Possession) => `conceded-${d.country}`)
      .attr('x', (d: Possession) => x(0))
      .attr('y', (d: Possession) => y(d.country) ?? '')
      .attr('height', y.bandwidth())
      .attr('fill', (d: Possession) => d.color)
      .on('mouseover', (event: MouseEvent, d: Possession) => {
        svg.select(`.possession-${d.country}`).attr('opacity', 0.5);
        svg
          .select(`.pourcentage-${d.possessionPercentage}`)
          .attr('fill', '#e72e11');
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
        tooltip
          .style('opacity', 1)
          .style('left', event.pageX - 10 + 'px')
          .style('top', event.pageY - 10 + 'px').html(`
      <div>
      <div>${d.country}</div>
      <div>Conceded Goals</div>
      <div>${Math.abs(d.possessionPercentage)}</div>
      </div>
      `);
      })
      .on('mouseout', (event: MouseEvent, d: Possession) => {
        svg.select(`.possession-${d.country}`).attr('opacity', 1);
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
      .attr('width', (d: Possession) =>
        Math.abs(x(d.possessionPercentage) - x(0))
      )
      .attr('x', (d: Possession) => x(Math.min(0, d.possessionPercentage)));

    svg
      .selectAll('myRect')
      .data(this.data2)
      .enter()
      .append('rect')
      .attr('class', (d: Possession) => `scored-${d.country}`)
      .attr('x', (d: Possession) => x(Math.min(0, d.possessionPercentage)))
      .attr('y', (d: Possession) => y(d.country) ?? '')
      .attr('height', y.bandwidth())
      .attr('fill', (d: Possession) => d.color)
      .on('mouseover', (event: any, d: any) => {
        svg.select(`.possession-${d.country}`).attr('fill', '#08b355');
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
      <div>Average Possession</div>
      <div>${Math.abs(d.possessionPercentage)}%</div>
      </div>
      `);
      })
      .on('mouseout', (event: MouseEvent, d: Possession) => {
        svg.select(`.possession-${d.country}`).attr('fill', '#35d047b6');
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
      .attr('width', (d: Possession) =>
        Math.abs(x(d.possessionPercentage) - x(0))
      );
  }

  removeChart2() {
    d3.select(this.chartContainer2.nativeElement).selectAll('*').remove();
  }
}

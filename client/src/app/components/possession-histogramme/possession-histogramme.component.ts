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
  selector: 'app-possession-histogramme',
  templateUrl: './possession-histogramme.component.html',
  styleUrls: ['./possession-histogramme.component.css'],
})
export class PossessionHistogrammeComponent implements OnInit, AfterViewInit {
  @ViewChild('histogramme') private chartContainer!: ElementRef;

  constructor() {}

  private data: Possession[] = [];
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const possessionPercentages: number[] = [
      37, 66.6, 58.6, 54, 46.6, 43.3, 42,
    ];
    const countries: string[] = [
      'Morroco',
      'Argentina',
      'France',
      'Croatia',
      'Senegal',
      'Tunisia',
      'Ghana',
    ];
    const colors: string[] = [
      '#e80284',
      '#4517EE',
      '#4517EE',
      '#4517EE',
      '#DB8500',
      '#DB8500',
      '#DB8500',
    ];

    this.data = countries.map((country, i) => ({
      country: country,
      possessionPercentage: possessionPercentages[i],
      color: colors[i],
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
    const margin = { top: 70, right: 100, bottom: 40, left: 100 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

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
      .attr('class','x-axis')
      .attr('transform', `translate(0,${-10})`)
      .call(
        d3
          .axisBottom(x)
          .tickSizeOuter(0)
          .ticks(5)
          .tickFormat((d: any) => Math.abs(d as number).toString())
      );
      

    xAxis.selectAll('.tick text').attr('dy', -20);

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
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .attr('stroke', 'none');
    
    yAxis.selectAll('.tick text')
         .attr('fill', (d:any,i:any) => this.data[i].color) // This will hide the tick lines
         .attr('font-size',15)
         .attr("font-family", "Arial")


    svg.selectAll('.tick line').attr('stroke', 'none'); // This will hide the tick lines

    const tooltip = d3.select('#tooltip');

    svg
      .append('text')
      .attr('class', 'x label')
      .attr('text-anchor', 'end')
      .attr('x', (width + margin.left + margin.right) / 2 + 30)
      .attr('y', -40)
      //fill with white
      .attr('fill', '#fff')
      .style("font-size", "12px")
      .style("font-family", "Arial")
      .text('Average Possession (%) (Group Stage)');

    svg
      .selectAll('myRect')
      .data(this.data)
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
          .style('border', `2px solid ${d.color}`)
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
      .data(this.data)
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

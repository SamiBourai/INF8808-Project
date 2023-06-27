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
  color: string
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
      'Tunisia',
      'Ghana',
    ];
    const scoredGoals: number[] = [6, 15, 16, 8, 5, 1, 5];
    const concededGoals: number[] = [5, 8, 8, 7, 7, 1, 7];
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
      scored: scoredGoals[i],
      conceded: -concededGoals[i],
      color: colors[i],
    }));

    // Sort data by the difference between scored and conceded goals
    this.data = this.data.sort((a: CountryData, b: CountryData) => {
    const differenceA = a.scored + a.conceded;
    const differenceB = b.scored + b.conceded;
    return differenceB - differenceA; // Sort in descending order
  });
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
    const margin = { top: 70, right: 30, bottom: 50, left: 100 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    

    const x = d3.scaleLinear().domain([-16, 16]).range([0, width]);
    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(this.data.map((d) => d.country))
      .padding(0.3);
    const colorScale : any= d3.scaleOrdinal()
      .domain(this.data.map((d:any)=> d.country))
      .range(this.data.map((d:any)=> d.color))

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
          .tickValues(Array.from({ length: 17 }, (_, index) => (index * 2) - 16)) //-16 to 16 2by2
          .tickSizeOuter(0)
          .tickFormat((d: any) => Math.abs(d as number).toString())
      )
      .select('text')
      .attr("font-size", "12px")
      .attr("font-family", "Arial");

    xAxis.selectAll('.tick text')
         .attr('dy', -18)

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

    // svg.append('g').call(d3.axisLeft(y).tickSizeOuter(0));
    let yAxis = svg.append('g').call(d3.axisLeft(y).tickSize(0).tickSizeOuter(0));
    yAxis.select(".domain").remove();
    yAxis.selectAll("text")
          .attr("font-size", "15px")
          .attr("font-family", "Arial")
          .attr("fill", (d:any,i:number) => colorScale(this.data[i].country))
          .attr("y",-10)


    svg.append('line')
      .attr('x1', x(0))
      .attr('y1', 0)
      .attr('x2', x(0))
      .attr('y2', height)
      .attr('stroke', 'black');
    
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
      .attr('stroke','none')
      .on('mouseover', (event: MouseEvent, d: CountryData) => {
        svg.select(`.scored-${d.country}`).attr('opacity', 0.5);
        svg.select(`.conceded-${d.country}`).attr('fill', '#e72e11');
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
        svg
          .selectAll('.tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity',0.5)
        svg
          .selectAll('.legend')
          .filter((node:any) => node === "Conceded goals")
          .select('text')
          .attr('font-weight','bold')
        svg
          .selectAll('.legend')
          .filter((node:any) => node !== "Conceded goals")
          .attr('opacity',0.3)
        tooltip
          .style('opacity', 1)
          .style('border', `2px solid ${colorScale(d.country)}`)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
      <divstyle="text-align: center;">
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
        svg
          .selectAll('.tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity',1);
        svg
          .selectAll('.legend')
          .filter((node:any) => node === "Conceded goals")
          .select('text')
          .attr('font-weight','normal');
        svg
          .selectAll('.legend')
          .filter((node:any) => node !== "Conceded goals")
          .attr('opacity',1)
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
      .attr('stroke','none')
      .on('mouseover', (event: any, d: any) => {
        svg
          .selectAll('.tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
        svg
          .selectAll('.tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity',0.5);
        svg
          .selectAll('.legend')
          .filter((node:any) => node !== "Conceded goals")
          .select('text')
          .attr('font-weight','bold');
        svg
          .selectAll('.legend')
          .filter((node:any) => node === "Conceded goals")
          .attr('opacity',0.3)
        tooltip
          .style('opacity', 1)
          .style('border', `2px solid ${colorScale(d.country)}`)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
      <divstyle="text-align: center;">
        <div>${d.country}</div>
        <div>Scored Goals</div>
        <div>${Math.abs(d.scored)}</div>
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
        svg
          .selectAll('.tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity',1);
        svg
          .selectAll('.legend')
          .filter((node:any) => node !== "Conceded goals")
          .select('text')
          .attr('font-weight','normal');
        svg
          .selectAll('.legend')
          .filter((node:any) => node === "Conceded goals")
          .attr('opacity',1)
        tooltip.style('opacity', 0);
      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d: CountryData) => Math.abs(x(d.scored) - x(0)));

    let legend = svg
      .selectAll('.legend')
      .data(['Conceded goals', 'Scored goals'])
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function (d, i) {
        let legendX = (width - 2 * 150) / 2;
        return 'translate(' + (legendX + i * 150) + ',' + (-60) + ')';
      });

    // Draw legend rectangles
    legend
    .append('rect')
    .attr('x', 0)
    .attr('width', 18)
    .attr('height', 18)
    .style('fill', function (d, i) {
      return ['#d04a35cc', '#35d047b6'][i];
    });

    // Draw legend text
    legend
    .append('text')
    .attr('x', 24)
    .attr('y', 9)
    .attr('dy', '.35em')
    .style('text-anchor', 'start')
    .style('fill', 'white')
    .style("font-size", "12px")
    .style("font-family", "Arial")
    .text((d) => {
      return d;
    });

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

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { Touches } from 'src/models/interfaces/touches';

@Component({
  selector: 'app-touches-component',
  templateUrl: './touches-component.component.html',
  styleUrls: ['./touches-component.component.css'],
})
export class TouchesComponent implements AfterViewInit {
  @ViewChild('izi') private chartContainer!: ElementRef;
  private className: string = 'waffle-chart';
  private svgs: Map<string, any> = new Map();

  data: Touches[] = [
    { country: 'Morroco', defense: 47 * 2, middle: 36 * 2, attack: 17 * 2 },
    { country: 'Argentina', defense: 30 * 2, middle: 46 * 2, attack: 24 * 2 },
    { country: 'France', defense: 31 * 2, middle: 45 * 2, attack: 24 * 2 },
    { country: 'Croatia', defense: 34 * 2, middle: 45 * 2, attack: 21 * 2 },
    { country: 'Senegal', defense: 38 * 2, middle: 37 * 2, attack: 25 * 2 },
    { country: 'Tunisia', defense: 43 * 2, middle: 37 * 2, attack: 20 * 2 },
    { country: 'Ghana', defense: 41 * 2, middle: 32 * 2, attack: 27 * 2 },
  ];
  width: number = 400;
  height: number = 140;

  private boxSize: number = 14; // Size of each box
  private boxGap: number = 2; // space between each box
  private howManyAcross: number = Math.floor(this.height / this.boxSize);
  private occurrences: any[] = [];

  private previousGroup: any = undefined;

  private colors: string[] = ['#21A179', '#1481BA', '#F3535B'];

  constructor() {}

  ngAfterViewInit(): void {
    this.createSvg();
    this.drawWaffle();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    d3.select(this.chartContainer.nativeElement).select('svg').remove();
    this.drawWaffle();
  }

  private drawWaffle() {
    this.data.forEach((d, i) => {
      const currentSvg = this.svgs.get(d.country);
      const constryIzi = d.country;
      const { country, ...rest } = d;

      const data: any[] = [];

      let totalCount = 0;
      for (let key in rest) {
        totalCount += rest[key];
      }
      // Create an array of the keys
      for (let key in rest) {
        let percentage = (rest[key] / totalCount) * 100;
        let keyArray = new Array(rest[key]).fill({
          label: key,
          percentage: percentage,
        });

        data.push(...keyArray);
      }

      // Initialize an empty object for storing the counts
      let categoryCounts = {};

      // Iterate over each element in the data array
      for (let element of data) {
        // If the category exists in categoryCounts, increment its count
        if (categoryCounts[element]) {
          categoryCounts[element]++;
        } else {
          // If the category does not exist in categoryCounts, set its count to 1
          categoryCounts[element] = 1;
        }
      }

      // Push the resulting categoryCounts object to the occurrences array
      this.occurrences.push(categoryCounts);

      const tooltip = d3.select('#tooltip');
      currentSvg
        .append('g')
        .attr('class', 'all-rects')
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('class', (d) => `square-${d.label}`)
        .attr('x', (d, i) => this.boxSize * Math.floor(i / this.howManyAcross))
        .attr('y', (d, i) => this.boxSize * (i % this.howManyAcross))
        .attr('width', this.boxSize - this.boxGap)
        .attr('height', this.boxSize - this.boxGap)
        .attr('fill', (d) => this.colors[Object.keys(rest).indexOf(d.label)])
        .on('mouseover', (_event: MouseEvent, d) => {
          if (this.previousGroup !== d) {
            currentSvg.selectAll('rect').attr('opacity', 0.5);
            currentSvg.selectAll(`.square-${d.label}`).attr('opacity', 1);
          }
          tooltip
            .style('opacity', 1)
            .style('left', _event?.pageX + 'px')
            .style('top', _event?.pageY + 'px')
            .html(this.getTipContent(d.label, d.percentage, constryIzi));
        })
        .on('mouseleave', (event: MouseEvent, d) => {
          this.previousGroup = d;

          tooltip
            .style('opacity', 0)
            .style('left', event.pageX + 'px')
            .style('top', event.pageY + 'px')
            .html(this.getTipContent(d.label, d.percentage, constryIzi));
        });

      if (d.country === 'Morroco') {
        const legend = currentSvg
          .append('g')
          .attr('class', `legend-${d.country}`)
          .selectAll('g')
          .data(Object.keys(rest))
          .join('g')
          .attr('transform', (d, i) => {
            return `translate(0, ${i * 20})`;
          })
          .on('mouseenter', (_event, d) => {
            currentSvg.selectAll('rect').attr('opacity', 0.5);
            currentSvg.selectAll(`.square-${d}`).attr('opacity', 1);
            let e = currentSvg.select('g.all-rects');
          })
          .on('mouseleave', (_event, d) => {
            currentSvg.selectAll('rect').attr('opacity', 1);
          });
        legend
          .append('rect')
          .attr('class', (d) => `square-${d}`)
          .attr('x', this.width - 50)
          .attr('width', 11)
          .attr('height', 11)
          .attr('fill', (d) => this.colors[Object.keys(rest).indexOf(d)]);
        legend
          .append('text')
          .attr('x', this.width - 30)
          .attr('y', 5)
          .attr('font-size', '10px')
          .attr('fill', '#fff')
          .attr('dy', '0.35em')
          .text((d) => d);
      }
    });
  }

  private getTipContent(z, perc, country): string {
    return `
    <div>
      <div>${country}</div>
      <div>${z} : ${perc.toFixed(2)} %</div>
    </div>
  `;
  }

  private createSvg(): void {
    this.data.forEach((d, i) => {
      this.svgs.set(d.country, this.createSvgForPlayer(d, i));
    });
  }

  private createSvgForPlayer(d: any, i: number): any {
    return d3
      .select(`figure#waffle-chart-${i}`)
      .append('svg')
      .attr('class', `${this.className}-${d.country}`)
      .attr('width', this.width)
      .attr('height', this.height)
      .on('mouseleave', (_event: MouseEvent, d) => {
        this.previousGroup = d;
        d3.selectAll('rect').attr('opacity', 1);
      });
  }
}

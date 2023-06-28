import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import {
  COLORS_POSSESSION_CHART,
  COUNTRIES,
  GRID_PLACE,
  WAFFLE_FIELD_COLORS,
} from 'src/constants/constants';
import { Touches } from 'src/models/interfaces/touches';

@Component({
  selector: 'app-touches-component',
  templateUrl: './touches-component.component.html',
  styleUrls: ['./touches-component.component.css'],
})
export class TouchesComponent implements AfterViewInit {
  @ViewChild('waffles') private chartContainer!: ElementRef;
  private element: any;
  private className: string = 'waffle-chart';
  private svg: any;
  private subSvgs: Map<string, any> = new Map();
  private observer: IntersectionObserver | null = null;

  data: Touches[] = [
    { country: 'Morroco', defense: 47 * 2, middle: 36 * 2, attack: 17 * 2 },
    { country: 'Argentina', defense: 30 * 2, middle: 46 * 2, attack: 24 * 2 },
    { country: 'France', defense: 31 * 2, middle: 45 * 2, attack: 24 * 2 },
    { country: 'Croatia', defense: 34 * 2, middle: 45 * 2, attack: 21 * 2 },
    { country: 'Senegal', defense: 38 * 2, middle: 37 * 2, attack: 25 * 2 },
    { country: 'Tunisia', defense: 43 * 2, middle: 37 * 2, attack: 20 * 2 },
    { country: 'Ghana', defense: 41 * 2, middle: 32 * 2, attack: 27 * 2 },
  ];

  margin = { left: 0, right: 0, top: 30, bottom: 0 };
  width: number = 400;
  height: number = 500;
  numCols = 3; // Number of columns
  numRows = 3; // Number of rows
  spacing = 40; // Spacing between sub-SVG elements

  private typeColorScale: any;

  private countryColorScale: any;
  private xScale: any;
  private yScale: any;
  private numSubRows: number = 10;
  private numSubCols: number = 20;
  private legendRectSide = 20;
  private legendGap = 10;

  private subWidth: number = 0;
  private subHeight: number = 0;

  private boxSize: number = 12; // Size of each box
  private boxGap: number = 1; // space between each box

  constructor() {}

  ngAfterViewInit(): void {
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

  createChart() {
    this.element = this.chartContainer.nativeElement;
    this.width =
      this.element.offsetWidth - this.margin.left - this.margin.right;
    this.subWidth =
      (this.width - this.spacing * (this.numCols - 1)) / this.numCols;
    this.subHeight =
      (this.height - this.spacing * (this.numRows - 1)) / this.numRows;
    this.boxSize = Math.min(
      (this.subHeight - this.boxGap * (this.numSubRows - 1)) / this.numSubRows,
      (this.subWidth - this.boxGap * (this.numSubCols - 1)) / this.numSubCols
    );
    console.log(this.boxSize);

    this.countryColorScale = d3
      .scaleOrdinal()
      .domain(COUNTRIES)
      .range(COLORS_POSSESSION_CHART);
    // Define the x-scale for positioning the sub-SVG elements
    this.xScale = d3
      .scaleLinear()
      .domain([1, this.numCols])
      .range([0, this.width - this.subWidth]);

    // Define the y-scale for positioning the sub-SVG elements
    this.yScale = d3
      .scaleLinear()
      .domain([1, this.numRows])
      .range([0, this.height - this.subHeight]);

    this.typeColorScale = d3
      .scaleOrdinal()
      .domain(Object.keys(WAFFLE_FIELD_COLORS))
      .range(Object.values(WAFFLE_FIELD_COLORS));

    this.createSVG();
    this.createsubSvg();
    this.normalizeData();
    this.drawWaffleChart();
    this.createLegend();
  }

  private normalizeData() {
    this.data = this.data.map((d: Touches) => {
      const { country, defense, middle, attack } = d;
      const sum = defense + middle + attack;
      return {
        country: country,
        defense: (defense / sum) * 100,
        middle: (middle / sum) * 100,
        attack: (attack / sum) * 100,
      };
    });
  }

  private drawWaffleChart() {
    this.data.forEach((d, i) => {
      const currentsubSvg = this.subSvgs.get(d.country);
      const { country, ...rest } = d;

      const data: any[] = [];

      // Create an array of the keys
      Object.keys(rest).forEach((key) => {
        let keyArray = new Array(
          Math.round((d[key] / 100) * this.numSubCols * this.numSubRows)
        ).fill({
          country: d.country,
          label: key,
          percentage: d[key],
        });
        data.push(...keyArray);
      });

      const tooltip = d3.select('#tooltip');

      currentsubSvg
        .selectAll('text')
        .data([{ country: country }])
        .join('text')
        .attr('class', 'waffle-title')
        .attr('fill', this.countryColorScale(country))
        .attr('text-anchor', 'middle')
        .style('font-size', '15px')
        .style('font-family', 'Arial')
        .attr('x', (this.boxSize * this.numSubCols) / 2)
        .attr('y', -this.spacing / 3)
        .text(country);

      currentsubSvg
        .append('g')
        .attr('class', 'waffle-g')
        // .attr("transform",`translate(${},0)`)
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('class', (d) => `square square-${d.label}`)
        .attr('x', (_, j) => Math.floor(j / this.numSubRows) * this.boxSize)
        .attr('y', (_, j) => (j % this.numSubRows) * this.boxSize)
        .attr('width', this.boxSize - this.boxGap)
        .attr('height', this.boxSize - this.boxGap)
        .attr('fill', (d) => this.typeColorScale(d.label))
        .on('mouseover', (_event: MouseEvent, d) => {
          currentsubSvg
            .selectAll('rect')
            .filter((node: any) => node.label !== d.label)
            .attr('opacity', 0.5);
          currentsubSvg
            .selectAll('.waffle-title')
            .filter((node: any) => node.country === d.country)
            .style('font-weight', 'bold');

          tooltip
            .style('opacity', 1)
            .style('left', _event?.pageX + 'px')
            .style('top', _event?.pageY + 'px')
            .style('border', `2px solid ${this.countryColorScale(d.country)}`)
            .html(this.getTipContent(d.label, d.percentage, d.country));
        })
        .on('mouseout', (_event: MouseEvent, d) => {
          currentsubSvg
            .selectAll('rect')
            .filter((node: any) => node.label !== d.label)
            .attr('opacity', 1);
          currentsubSvg
            .selectAll('.waffle-title')
            .filter((node: any) => node.country === d.country)
            .style('font-weight', 'normal');

          tooltip.style('opacity', 0);
        });
    });
    this.svg
      .selectAll('.waffle-title')
      .on('mouseover', (event, d) => {
        this.svg
          .selectAll('.waffle-title')
          .filter((node: any) => node !== d)
          .attr('opacity', 0.3);
        this.svg
          .selectAll('.waffle-title')
          .filter((node: any) => node === d)
          .style('font-weight', 'bold');
        this.svg
          .selectAll('.waffle-g')
          .selectAll('rect')
          .filter((node: any) => node.country !== d.country)
          .attr('opacity', 0.3);
      })
      .on('mouseout', (event, d) => {
        this.svg
          .selectAll('.waffle-title')
          .filter((node: any) => node !== d)
          .attr('opacity', 1);
        this.svg
          .selectAll('.waffle-title')
          .filter((node: any) => node === d)
          .style('font-weight', 'normal');
        this.svg
          .selectAll('.waffle-g')
          .selectAll('rect')
          .filter((node: any) => node.country !== d.country)
          .attr('opacity', 1);
      });
  }

  private createLegend() {
    const legend = this.svg
      .append('g')
      .attr('class', `legend`)
      .attr('transform', `translate(${this.xScale(3)},${this.yScale(1)})`);
    const legend_items = legend
      .selectAll('g')
      .data(
        Object.entries(WAFFLE_FIELD_COLORS).map(([label, color]) => ({
          label,
          color,
        }))
      )
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => {
        return `translate(${this.legendRectSide}, ${
          (i + 1) * (this.legendRectSide + this.legendGap)
        })`;
      })
      .on('mouseover', (event, d) => {
        this.svg
          .selectAll('.waffle-g')
          .selectAll('rect')
          .filter((node: any) => node.label !== d.label)
          .attr('opacity', 0.3);
        legend
          .selectAll('.legend-item')
          .filter((node: any) => node === d)
          .select('text')
          .attr('font-weight', 'bold');
        legend
          .selectAll('.legend-item')
          .filter((node: any) => node !== d)
          .attr('opacity', 0.3);
      })
      .on('mouseout', (event, d) => {
        this.svg
          .selectAll('.waffle-g')
          .selectAll('rect')
          .filter((node: any) => node.label !== d.label)
          .attr('opacity', 1);
        legend
          .selectAll('.legend-item')
          .filter((node: any) => node === d)
          .select('text')
          .attr('font-weight', 'normal');
        legend
          .selectAll('.legend-item')
          .filter((node: any) => node !== d)
          .attr('opacity', 1);
      });

    legend_items
      .append('rect')
      .attr('x', 0)
      .attr('width', this.legendRectSide)
      .attr('height', this.legendRectSide)
      .attr('fill', (d) => this.typeColorScale(d.label));
    legend_items
      .append('text')
      .attr('x', this.legendRectSide + this.legendGap)
      // .attr('y', -this.legendRectSide/2)
      .attr('font-size', '12px')
      .attr('font-family', 'Arial')
      .attr('fill', 'white')
      .attr('dy', (this.legendRectSide + this.legendGap) / 2)
      .text((d) => d.label);
  }

  private getTipContent(z, perc, country): string {
    return `
    <div>
      <div>${country}</div>
      <div>${z} : ${perc.toFixed(2)} %</div>
    </div>
  `;
  }

  private createsubSvg(): void {
    this.data.forEach((d, i) => {
      this.subSvgs.set(
        d.country,
        this.createFieldSVGForEachCountry(d.country, GRID_PLACE[i].gridplace)
      );
    });
  }

  private createFieldSVGForEachCountry(country: string, i: number): any {
    // Create the sub-SVG elements
    return this.svg
      .select('.all-waffle-charts')
      .append('g')
      .attr('class', `${this.className}-${country}`)
      .attr('transform', (d: any) => {
        if (i % this.numCols === 0) {
          return `translate(${this.xScale(this.numCols)}, ${this.yScale(
            i / this.numCols
          )})`;
        } else {
          return `translate(${this.xScale(i % this.numCols)}, ${this.yScale(
            Math.floor(i / this.numCols) + 1
          )})`;
        }
      });
  }

  private createSVG() {
    this.svg = d3
      .select(this.element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    this.svg
      .append('g')
      .attr('class', 'all-waffle-charts')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
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

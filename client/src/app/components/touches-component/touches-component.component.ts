import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-touches-component',
  templateUrl: './touches-component.component.html',
  styleUrls: ['./touches-component.component.css'],
})
export class TouchesComponentComponent implements OnInit {
  @ViewChild('chart') private chartElement!: ElementRef;
  constructor() {}
  private svg: any;
  private data = [
    { name: 'Category 1', count: 10 },
    { name: 'Category 2', count: 20 },
    { name: 'Category 3', count: 30 },
  ];
  private margin = { top: 10, right: 10, bottom: 10, left: 10 };
  private width = 800 - this.margin.left - this.margin.right;
  private height = 400 - this.margin.top - this.margin.bottom;
  private columns = 40;
  private rows = 10;

  ngOnInit() {
    this.createSvg();
    this.drawChart();
  }

  private createSvg(): void {
    let element = this.chartElement.nativeElement;
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', this.width + 2 * this.margin.left + 2 * this.margin.right)
      .attr(
        'height',
        this.height + 2 * this.margin.top + 2 * this.margin.bottom
      )
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
  }

  private drawChart(): void {
    // Compute the total count of squares
    let total = 0;
    for (let i = 0; i < this.data.length; i++) {
      total += this.data[i].count;
    }

    // Compute the size of squares
    const squareSize = Math.floor(this.width / this.columns);

    // Initialize counter
    let counter = 0;

    for (let i = 0; i < this.data.length; i++) {
      // Create squares
      for (let j = 0; j < this.data[i].count; j++) {
        // Compute row and column
        let row = Math.floor(counter / this.columns);
        let col = counter % this.columns;

        // Draw square
        this.svg
          .append('rect')
          .attr('width', squareSize)
          .attr('height', squareSize)
          .attr('x', col * squareSize)
          .attr('y', row * squareSize)
          .style('fill', this.colorScale(i / this.data.length));

        // Increment counter
        counter++;
      }
    }
  }

  private colorScale(value: number): string {
    return d3.interpolateRainbow(value);
  }
}

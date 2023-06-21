import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
// import { countries } from './constants';
// import * as fs from 'fs';
// import fs from 'fs';
// import {parse} from 'csv-parse';
import { HttpClient } from '@angular/common/http';
import {parse, ParseResult} from 'papaparse';
import { countries } from './constants';
import * as d3 from 'd3';

interface PhaseDetails {
  Result: string,
  Date: string,
  Display: string,
  Score: string,
}

interface DataDetails {
  Country: string,
  Phase: string,
  Result: string,
  Date: string,
  Display : string,
  Score: string,
}

@Component({
  selector: 'app-wins-and-losses-bars-chart',
  templateUrl: './wins-and-losses-bars-chart.component.html',
  styleUrls: ['./wins-and-losses-bars-chart.component.css']
})
export class WinsAndLossesBarsChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') private chartContainer!: ElementRef;
  @ViewChild('legend') private legendContainer!: ElementRef;
  // @ViewChild('tooltip') private tooltipElement!: ElementRef;

  countryMap: { [country: string]: { [phase: string]: PhaseDetails } } = {};
  dataMap: DataDetails[] = []
  constructor(private http: HttpClient) { }
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.createMap()
  }

  createMap(): void {
    this.http.get('assets/data_wins_chart.csv', { responseType: 'text' })
    .subscribe((data)=>{
      const parsedData : ParseResult<any> = parse(data, { header: true });
      parsedData.data.forEach((row: DataDetails) => {
        const { Country, Phase, Result, Date, Display, Score } = row;
        this.dataMap.push(row)
        
        if (!this.countryMap[Country]) {
          this.countryMap[Country] = {};
        }

        this.countryMap[Country][Phase] = {
          Result,
          Date,
          Display,
          Score,
        };
      });
    })

    console.log(this.dataMap)
    console.log(this.countryMap)
  }

  // cleanMap(): void {
    
  // }

  ngAfterViewInit(): void {
    this.observeChart()
  }

  observeChart() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.createChart();
          this.createLegend();
        } else {
          this.removeChart();
          this.removeLegend();
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

  countryColorScale

  createChart():void{
    let element = this.chartContainer.nativeElement;
    const margin = { top: 100, right: 30, bottom: 50, left: 80 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const phases = this.extractPhases()
    console.log(phases)

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // create tooltip element
    const tooltip = d3.select("#tooltip")
    
    // Create scales for x and y axes
    const xScale = d3
    .scaleBand()
    .domain(phases)
    .range([margin.left, width - margin.right])
    .padding(0.1);

    const yScale = d3
    .scaleBand()
    .domain(countries)
    .range([0, height])
    .padding(0.1);

    // Create color scale for the results
    const colorScale = d3
    .scaleOrdinal()
    .domain(['W', 'L', 'D'])
    .range(['green', 'red', 'gray']);

    // Create color scale for the results
    const countryColorScale = d3
    .scaleOrdinal()
    .domain(countries)
    .range([
      '#e80284',
      '#4517EE',
      '#4517EE',
      '#4517EE',
      '#DB8500',
      '#DB8500',
      '#DB8500',
    ]);

    // Add horizontal lines
    svg.selectAll("line")
    .data(countries)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => yScale(d)! + yScale!.bandwidth() / 2)
    .attr("y2", d => yScale(d)! + yScale!.bandwidth() / 2)
    .attr("stroke", "gray")
    .attr("stroke-dasharray", "3,3");


    const rectWidth = xScale!.bandwidth() - xScale!.bandwidth()/4
    svg.selectAll("rect")
    .data(this.dataMap)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.Phase)! + (xScale!.bandwidth() - rectWidth) / 2)
    .attr("y", d => yScale(d.Country)! + yScale.bandwidth() / 2)
    .attr("width", rectWidth )
    //.attr("height", yScale!.bandwidth())
    .attr("fill", (d) => colorScale(d.Result) as string)
    .on("mouseover", (event, d) => {
      // Show tooltip with details
      tooltip.style("opacity", 1)
        .style("left", event.pageX + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(`<div>Date: ${d.Date}</div>
               <div>Display: ${d.Display}</div>
               <div>Score: ${d.Score}</div>`);
    })
    .on("mouseout", () => {
      // Hide tooltip
      tooltip.style("opacity", 0);
    })
    .attr('height', 0)
      .transition()
      .duration(1000)
      .attr('height', d => yScale!.bandwidth())
      .attr('y', d => yScale(d.Country)! - yScale.bandwidth() / 2);

  // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickValues(phases))
      .selectAll("text")
      .style("font-size", "14px")
      .style("font-family", "Arial");

  // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "16px")
      .style("font-family", "Arial")
      .style("fill", (d) => countryColorScale(d as string) as string);
    
      // this.createLegend(element, margin, width, height)
  }

  createLegend(): void{
    const element = this.legendContainer.nativeElement
    const margin = { top: 100, right: 30, bottom: 50, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const legendX = width; // Adjust the horizontal position of the legend
    const legendY = 0; // Adjust the vertical position of the legend

   // Legend data
    const legendData = [
      { result: "Win", color: "green" },
      { result: "Loss", color: "red" },
      { result: "Draw", color: "gray" }
    ];

    // Create the legend container
    const legendContainer = d3.select(element);

    // Create the legend SVG element
    const legendSvg = legendContainer.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", '100%')
      .append("g")
      .attr("transform", `translate(${width - (margin.right + 50)}, 0)`)
      
    const legendWidth = 150
    legendSvg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", legendWidth)
    .attr("height", '100%')
    .attr("fill", "lightgray")
    .attr("stroke", "black");

    legendSvg.append("text")
    .attr("x", legendWidth / 2)
    .attr("dy", "10%")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("Legend");

    legendSvg.append("text")
    .attr("x", legendWidth / 2)
    .attr("dy", "90%")
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Without penalty shootouts");

    // Create a group for each legend item
    const legendItems = legendSvg.selectAll("g")
      .data(legendData)
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(0, ${10 + i * 30})`);

    // Add colored rectangles
    legendItems.append("rect")
      .attr("x", 10)
      .attr("y", 20)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => d.color);

    // Add legend text
    legendItems.append("text")
      .attr("x", 40)
      .attr("y", 35)
      .text(d => d.result);
  }

  extractPhases(): string[]{

    const phasesSet = new Set<string>();
    Object.keys(this.countryMap).forEach((country) => {
      const phases = Object.keys(this.countryMap[country]);
      phases.forEach((phase) => phasesSet.add(phase));
    });

    const phases = Array.from(phasesSet);
    return phases
  }

  removeChart():void{
      d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
  }

  removeLegend():void{
    d3.select(this.legendContainer.nativeElement).selectAll('*').remove();
  }

}

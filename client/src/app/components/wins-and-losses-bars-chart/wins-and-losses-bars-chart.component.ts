import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
        } else {
          this.removeChart();
        }
      });
    });

    this.observer.observe(this.chartContainer.nativeElement);
  }

  createChart():void{
    let element = this.chartContainer.nativeElement;
    const margin = { top: 50, right: 30, bottom: 50, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const phases = this.extractPhases()
    console.log(phases)

    // const svg = d3
    //   .select(element)
    //   .append('svg')
    //   .attr('width', width + margin.left + margin.right)
    //   .attr('height', height + margin.top + margin.bottom)
    //   .append('g')
    //   .attr('transform', `translate(${margin.left},${margin.top})`);

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
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
    .attr("y", d => yScale(d.Country)! - yScale.bandwidth() / 2)
    .attr("width", rectWidth )
    .attr("height", yScale!.bandwidth())
    .attr("fill", (d) => colorScale(d.Result) as string);

  // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

  // Add y-axis
  // svg.append('g').call(d3.axisLeft(y).tickSizeOuter(0));
    svg.append("g")
      .call(d3.axisLeft(yScale).tickSizeOuter(0));


  }

  createLegend():void{
    
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

}

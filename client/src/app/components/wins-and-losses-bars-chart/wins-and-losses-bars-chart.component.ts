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
    const margin = { top: 50, right: 30, bottom: 50, left: 80 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const phases = this.extractPhases()

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
    .range(['#21A179', '#F3535B', '#1481BA']);

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

    const groupedData = d3.group(this.dataMap, d => d.Phase);
    const rectWidth = xScale!.bandwidth() - xScale!.bandwidth()/4
    const rects = svg.selectAll("rect")
    .data(groupedData)
    .enter()
    .append("g")
    .selectAll("rect")
    .data(d => d[1])
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.Phase)! + (xScale!.bandwidth() - rectWidth) / 2)
    .attr("y", yScale.bandwidth() / 2)
    .attr("width", rectWidth)
    .attr("height", 0)
    .attr("fill", d => colorScale(d.Result) as string)
    .on("mouseover", (event, d) => {
      // Show tooltip with details
      tooltip.style("opacity", 1)
        .style("left", event.pageX + "px")
        .style("top", (event.pageY - 20) + "px")
        .style("border", `2px solid ${countryColorScale(d.Country)}`)
        .html(`<div>Date: ${d.Date}</div>
               <div>Display: ${d.Display}</div>
               <div>Score: ${d.Score}</div>`);
      svg.selectAll("rect")
      .style("opacity", function(rectData) {
        return rectData === d ? 1 : 0.3;
      });
      svg.selectAll("text")
        .style("opacity", 0.3);
      // Highlight corresponding country
      const countryText = svg.selectAll("text")
      .filter((data) => data === d.Country)
      .style("font-weight", "bold")
      .style("opacity", 1);
      
    })
    .on("mouseout", () => {
      svg.selectAll("rect")
      .style("opacity", 1);
      svg.selectAll("text")
      .style("opacity", 1)
      .style("font-weight", "normal");
      // Hide tooltip
      tooltip.style("opacity", 0);
    })
    .transition()
    .duration(350)
    .delay((d, i) => {
      const phaseIndex = phases.indexOf(d.Phase);
      const countryIndex = countries.indexOf(d.Country);
      return (phaseIndex * countries.length + countryIndex) * 50; // Delay based on phase and country index
    })
    .attr("y", d => yScale(d.Country)!)
    .attr("height", yScale.bandwidth());

  // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0, ${height + 10})`)
      .call(d3.axisBottom(xScale).tickValues(phases))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-family", "Arial");

  // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .attr('class','y-axis')
      .selectAll("text")
      .style("font-size", "15px")
      .style("font-family", "Arial")
      .style("fill", (d) => countryColorScale(d as string) as string)
      .on("mouseover", function(event, d) {
        // Reduce opacity of other country names
        svg.selectAll('.y-axis .tick')
          .filter((node: any) => node === d)
          .select('text')
          .style('font-weight', 'bold');
        svg.selectAll('.y-axis .tick')
          .filter((node: any) => node !== d)
          .select('text')
          .attr('opacity', 0.5);

        // Make the hovered country name bold
        d3.select(this).style("font-weight", "bold");
      })
      .on("mouseout", function(event, d) {
        // Restore opacity and font weight of all country names
        svg.selectAll('.y-axis .tick')
          .filter((node: any) => node === d)
          .select('text')
          .style('font-weight', 'normal');
        svg.selectAll('.y-axis .tick')
          .filter((node: any) => node !== d)
          .select('text')
          .attr('opacity',1)
      });
      // this.createLegend(element, margin, width, height)
  }

  createLegend(): void{
    const element = this.legendContainer.nativeElement
    const margin = { top: 10, right: 30, bottom: 50, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    const legendX = width; // Adjust the horizontal position of the legend
    const legendY = 50; // Adjust the vertical position of the legend

   // Legend data
    const legendData = [
      { result: "Win", color: "#21A179" },
      { result: "Loss", color: "#F3535B" },
      { result: "Draw", color: "#1481BA" }
    ];

    // Create the legend container
    const legendContainer = d3.select(element);

    // Create the legend SVG element
    const legendSvg = legendContainer.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", '100%')
      .append("g")
      .attr("transform", `translate(${width - (margin.right + 50)}, ${margin.top})`)
      
    const legendWidth = 150
    legendSvg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", legendWidth)
    .attr("height", '100%')
    .attr("fill", "none")
    .attr("stroke", "none");

    // legendSvg.append("text")
    // .attr("x", legendWidth / 2)
    // .attr("dy", "10%")
    // .attr("text-anchor", "middle")
    // .attr("font-weight", "bold")
    // .text("Legend")
    // .attr('fill','white')
    // .style('font-size','15px')
    // .style('font-style','Arial');

    legendSvg.append("text")
    .attr("x", legendWidth / 2)
    .attr("dy", "90%")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style('font-style','Arial')
    .attr('fill','white')
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
      .attr("font-size", "12px")
      .attr("font-family", "Arial")
      .text(d => d.result)
      .attr('fill','white');
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

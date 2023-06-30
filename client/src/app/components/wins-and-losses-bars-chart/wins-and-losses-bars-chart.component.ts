import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {parse, ParseResult} from 'papaparse';
import { countries } from './constants';
import * as d3 from 'd3';
import { CHART_POLICE, COUNTRY_COLOR_SCALE, NOT_FOCUSED_OPACITY } from 'src/constants/constants';

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
  svg: any

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

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.removeChart()
    this.observer?.disconnect()
    this.observeChart()
  }


  createChart():void{
    let element = this.chartContainer.nativeElement;
    const margin = { top: 50, right: 30, bottom: 50, left: 80 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 450 - margin.top;

    const phases = this.extractPhases()
    
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const barsChart = this.svg
      .append('g')
      .attr('class', 'barsChart')
      .attr('height', height * 0.8)
      .attr('width', width*0.95)
      .attr('transform', `translate(${margin.left},${150})`);

    const tooltip = d3.select("#tooltip")
    
    // Create scales for x and y axes
    const xScale = d3
    .scaleBand()
    .domain(phases)
    .range([margin.left, barsChart.attr('width')])
    .padding(0.1);

    const yScale = d3
    .scaleBand()
    .domain(countries)
    .range([0, barsChart.attr('height')])
    .padding(0.1);

    // Create color scale for the results
    const colorScale = d3
    .scaleOrdinal()
    .domain(['W', 'L', 'D'])
    .range(['#21A179', '#F3535B', '#B8B8B8']);

    barsChart
    .selectAll("line")
    .data(countries)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", (d) => yScale(d)! + yScale!.bandwidth() / 2)
    .attr("y2", (d) => yScale(d)! + yScale!.bandwidth() / 2)
    .attr("stroke", "gray")
    .attr("stroke-dasharray", "3,3");

    const groupedData = d3.group(this.dataMap, (d) => d.Phase);
    const rectWidth = xScale!.bandwidth() - xScale!.bandwidth() / 4;
    barsChart
    .selectAll("rect")
    .data(groupedData)
    .enter()
    .append("g")
    .selectAll("rect")
    .data((d) => d[1])
    .enter()
    .append("rect")
    .attr("class", "result-rects")
    .attr("x", (d) => xScale(d.Phase)! + (xScale!.bandwidth() - rectWidth) / 2)
    .attr("y", yScale.bandwidth() / 2)
    .attr("width", rectWidth)
    .attr("height", 0)
    .attr("fill", (d) => colorScale(d.Result) as string)
    .on("mouseover", (event, d) => {
      // Show tooltip with details
      tooltip
        .style("opacity", 1)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 20 + "px")
        .style("border", `2px solid ${COUNTRY_COLOR_SCALE(d.Country)}`)
        .html(
          `<div>
            <span style="font-weight:bold">Date: </span> ${d.Date}<br>
            <span style="font-weight:bold">Display: </span>${d.Display}<br>
            <span style="font-weight:bold">Score: </span>${d.Score}
          </div>`
        );

      barsChart.selectAll('.result-rects')
          .filter((dataRect:any) => dataRect !== d )
          .attr('opacity', NOT_FOCUSED_OPACITY);

      // Highlight corresponding country
      this.highlightXLabel(d);
      this.highlightYaxis(d.Country);
      this.highlightLegend(d);
    })
    .on("mouseout", (event, d) => {
      barsChart.selectAll('.result-rects')
          .filter((dataRect:any) => dataRect !== d )
          .attr('opacity', 1);

      // Hide tooltip
      tooltip.style("opacity", 0);
      this.unhighlightXLabel(d)
      this.unHighlightYaxis(d.Country)
      this.unHighlightLegend(d)
    })
    .transition()
    .duration(350)
    .delay((d, i) => {
      const phaseIndex = phases.indexOf(d.Phase);
      const countryIndex = countries.indexOf(d.Country);
      return (phaseIndex * countries.length + countryIndex) * 50;
    })
    .attr("y", d => yScale(d.Country)!)
    .attr("height", yScale.bandwidth());

    // Add x-axis
      barsChart.append("g")
        .call(d3.axisBottom(xScale).tickValues(phases))
        .attr('class', 'x-axis')
        .attr("transform", `translate(0, ${barsChart.attr('height')})`)
        .selectAll("text")
        .style("font-size", "12px")
        .style("font-family", CHART_POLICE);

    // Add y-axis
      barsChart.append("g")
        .call(d3.axisLeft(yScale).tickSizeOuter(0))
        .attr('class','y-axis')
        .selectAll("text")
        .style("font-size", "15px")
        .style("font-family", CHART_POLICE)
        .style("fill", (d) => COUNTRY_COLOR_SCALE(d as string) as string)
        .on("mouseover", (event:any, d:any) => {
          this.highlightYaxis(d);
          this.highlightLineCountry(d)
        })
        .on("mouseout", (event, d) => {
          this.unHighlightYaxis(d)
          this.unHighlightLineCountry(d)
        });

        this.createLegend(barsChart.attr('width'))
    }

  createLegend(width: number): void {
    const legendData = [
      { Result: "W", Color: "#21A179" },
      { Result: "L", Color: "#F3535B" },
      { Result: "D", Color: "#B8B8B8" }
    ];
    
    const legendWidth = 150;
    const legendHeight = 200;
    const legendX = width;
    const legendY = 0;
    
    const legendSvg = this.svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);
  
    legendSvg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "none")
      .attr("stroke", "none");
  
  
    const legendItems = legendSvg.selectAll(".legend-items")
      .data(legendData)
      .enter()
      .append("g")
      .attr('class', 'legend-items')
      .on("mouseover", (event, d) => {
        this.highlightRect(d)
      })
      .on("mouseout", (event, d) => {
        this.unHighlightRect(d)
      })
      .attr("transform", (d, i) => `translate(0, ${40 + i * 30})`);
     

  
    legendItems.append("rect")
      .attr("x", 10)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => d.Color);

  
    legendItems.append("text")
      .attr('class', 'legend-items-text')
      .attr("x", 40)
      .attr("y", 15)
      .attr("font-size", "12px")
      .attr("font-family", CHART_POLICE)
      .text(d => {
        if (d.Result == "W") {
          return "Win"
        }
        else if (d.Result == "L"){
          return "Loss"
        } else {
          return "Draw"
        }
      })
      .attr('fill', 'white');
  }

  highlightLegend(d:any) : void {
    this.svg.selectAll(".legend-items")
            .filter((node:any) => node.Result !== d.Result)
            .attr('opacity', NOT_FOCUSED_OPACITY)
    this.svg.selectAll(".legend-items")
            .filter((node:any) => node.Result === d.Result)
            .selectAll('text')
            .style('font-weight','bold')  
  }

  unHighlightLegend(d:any) : void {
    this.svg.selectAll(".legend-items")
            .filter((node:any) => node.Result !== d.Result)
            .attr('opacity', 1)
    this.svg.selectAll(".legend-items")
            .filter((node:any) => node.Result === d.Result)
            .selectAll('text')
            .style('font-weight','normal')  
  }
  

  highlightXLabel(d: any): void {  
    this.svg
      .selectAll('.x-axis .tick')
      .filter((node: any) => node === d.Phase)
      .select('text')
      .style('font-weight', 'bold')
    
    this.svg
    .selectAll('.x-axis .tick text')
    .filter((node: any) => node !== d.Phase)
    .attr('opacity',NOT_FOCUSED_OPACITY)
  }  

  unhighlightXLabel(d:any) : void {
    this.svg
      .selectAll('.x-axis text')
      .style('font-weight', 'normal');

    this.svg
        .selectAll('.x-axis .tick text')
        .filter((node: any) => node === d.Country)
        .style('font-weight','normal')

    this.svg
        .selectAll('.x-axis .tick text')
        .filter((node: any) => node !== d.Country)
        .attr('opacity',1)
  }

  highlightLineCountry(d:any){
    this.svg.selectAll('.result-rects')
           .filter((node:any) => node.Country !== d )
           .attr('opacity', 0.3);
  }

  unHighlightLineCountry(d:any){
    this.svg.selectAll('.result-rects')
           .filter((node:any) => node.Country !== d )
           .attr('opacity', 1);
  }
  

  highlightYaxis(d:any){
    this.svg.selectAll('.y-axis .tick')
          .filter((node: any) => node === d)
          .select('text')
          .style('font-weight', 'bold');
          this.svg.selectAll('.y-axis .tick')
          .filter((node: any) => node !== d)
          .select('text')
          .attr('opacity', 0.5);
  }

  unHighlightYaxis(d:any){
    this.svg.selectAll('.y-axis .tick')
          .filter((node: any) => node === d)
          .select('text')
          .style('font-weight', 'normal');
        this.svg.selectAll('.y-axis .tick')
          .filter((node: any) => node !== d)
          .select('text')
          .attr('opacity',1)
  }

  highlightRect(d:any) : void { 
    this.svg
    .selectAll('.result-rects')
    .filter((node: any) => node.Result !== d.Result)
    .attr('opacity', NOT_FOCUSED_OPACITY);
  }

  unHighlightRect(d:any) : void { 
    this.svg
    .selectAll('.result-rects')
    .attr('opacity', 1);
  }

  extractPhases(): string[] {
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

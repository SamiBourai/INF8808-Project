import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from "@angular/core";

import * as d3 from "d3";
import { HttpClient } from '@angular/common/http';


@Component({
  selector: "app-parallel-coordinates-chart",
  templateUrl: "./parallel-coordinates-chart.component.html",
  styleUrls: ["./parallel-coordinates-chart.component.css"],
})
export class ParallelCoordinatesChartComponent implements OnInit, AfterViewInit {
  @ViewChild('parallelChart') private chartContainer!: ElementRef
  private observer: IntersectionObserver | null = null;

  constructor(private http: HttpClient) { }

  private data: any;
  private element: any;
  private margin = { top: 100, right: 50, bottom: 10, left: 50 };
  private width = 500 - this.margin.left - this.margin.right;
  private height = 500 - this.margin.top - this.margin.bottom;
  private xScale : any;
  private colorScale: any;
  private countries = ["Ghana", "France", "Senegal"];
  public colors: string[] = [
    '#DB8500',
    '#4517EE',
    '#DB8500',
  ];
  private dimensions = [
    "pass","goal","recup","tacles","intercep"
  ];
  private xlabels = {
    pass : "Number of\nattempted passes\n/90min",
    goal: "Number of\ngoal-creating actions\n/90min",
    recup : "Number of\nrecoveries\n/90min",
    tacles: "Number of\ntackles\n/90min",
    intercep: "Number of\ninterceptions\n/90min"
  }

  private yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};

  private svg: any
  private color = d3
    .scaleOrdinal()
    .domain(this.countries)
    .range(this.colors);

  async loadData() {
    try {
        const data = await this.http.get('/assets/team_parallel_chart.csv', { responseType: 'text' }).toPromise();
        let rows = data.split('\n').filter((row) => row.trim() !== '');
        let headers = rows[0].split(',').map((header) => header.replace('\r', '').trim());
        this.data = [];
  
        for (let i = 1; i < rows.length; i++) {
          let cells = rows[i].split(',').map((row) => row.replace('\r', '').trim());
          let dataObject: { [key: string]: string | number } = {};
          headers.forEach((col, index) => {
            dataObject[col] = cells[index];
          });
          this.data.push(dataObject);
        }
    } catch (error) {
      console.error('An error occurred while loading player data:', error);
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
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

  ngAfterViewInit() {
    this.observeChart()
  }

  createChart(): void {
    this.element = this.chartContainer.nativeElement;
    this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
    this.xScale = d3.scalePoint().range([0, this.width]).domain(this.dimensions);
    this.colorScale = d3.scaleOrdinal()
                        .domain(this.countries)
                        .range(Object.values(this.colors))

    for (let dimension of this.dimensions) {
      const max = Math.max(...this.data.map((d:any) => parseFloat(d[dimension])));
      this.yScales[dimension] = d3
        .scaleLinear()
        .domain([0,1.1*max]) 
        .range([this.height, 0]);
    }
    this.buildSvg();
  }

  private highlight(d:any, color:any) {
    // first every group turns grey
    d3.selectAll(".line")
      .filter((node:any) => node.Country !== d.Country)
      .transition()
      .duration(200)
      .ease(d3.easeCubicInOut)
      .style("opacity", "0.3");
    // Second the hovered specie takes its color
    d3.selectAll("." + d.Country)
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(200)
      .style("stroke", color[d.Country]) 
      .style("opacity", "1");
  };

  doNotHighlight(d:any, color:any): void {
    d3.selectAll(".line")
      .transition()
      .ease(d3.easeCubicInOut)
      .duration(200)
      .style("stroke",color[d.Country])
      .style("opacity", "1");
  };

  buildSvg(): void {
    let element = this.chartContainer.nativeElement;
    this.svg = d3
              .select(element)
              .append("svg")
              .attr("width", this.width + this.margin.left + this.margin.right)
              .attr("height", this.height + this.margin.top + this.margin.bottom)
    this.svg
      .selectAll("g")
      // For each dimension of the dataset I add a 'g' element:
      .data(this.dimensions)
      .join('g')
      .attr("class", "y-axis")
      .attr("transform", (d:any) => `translate(${this.margin.left + this.xScale(d)},${this.margin.top})`)
      .each((d:any, i:number, nodes:any) => {  
        const axis = d3.axisLeft(this.yScales[d]).ticks(5);
        d3.select(nodes[i]).call(axis);
      })
    this.svg.selectAll(".tick text")
            .attr("font-size", "12px")
            .attr("font-family", "Arial");

    this.svg.append('g')
      .attr('class', 'lines-g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.svg.select('.lines-g')
      .selectAll("path")
      .data(this.data)
      .join("path")
      .attr("class", (d:any) => this.d_class(d)) // 2 class for each line: 'line' and the group name
      .attr("d", (d:any) => this.path(d))
      .attr("fill","none")
      .attr("stroke-width",5)
      .attr("stroke", (d:any) => this.d_species(d))
      .attr("opacity", 1)
      .on("mouseover", (e,d) => this.highlight(d,this.color))
      .on("mouseleave", (e,d) => this.doNotHighlight(d,this.color));


    this.svg.selectAll('.y-axis')
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -50)
      .style("fill", "white")
      .attr("font-size", "12px")
      .attr("font-family", "Arial")
      .each((d:any, i:number, nodes:any) => {
        let text = this.xlabels[d];
        let parts = text.split('\n');  // split on space, or choose your own criterion
        parts.forEach((part:any,index:number) => {
        
        d3.select(nodes[i])
          .append("tspan")
          .attr("x", 0)
          .attr("dy", `1.2em`) 
          .style('font-weight',index===1 ? 'bold':'none' )
          .text(part);
        });

      });
    

  
  }

  d_species(d) {
    return this.colorScale(d.Country);  // removed nullish coalescing
  }

  d_class(d) {
    return "line " + d.Country;
  }

  path(d:any) {
    return d3.line()(
      this.dimensions.map(p => [this.xScale(p), this.yScales[p](d[p])])
    );
  }
  removeChart():void{
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
  }
}

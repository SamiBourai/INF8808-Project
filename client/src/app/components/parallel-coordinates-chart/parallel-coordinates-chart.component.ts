import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from "@angular/core";

import * as d3 from "d3";

interface DataPoint {
  attribute1: number;
  attribute2: number;
  attribute3: number;
}

@Component({
  selector: "app-parallel-coordinates-chart",
  templateUrl: "./parallel-coordinates-chart.component.html",
  styleUrls: ["./parallel-coordinates-chart.component.css"],
})
export class ParallelCoordinatesChartComponent implements OnInit {
  @ViewChild('parallelChart') private chartContainer!: ElementRef
  constructor() {}

  private data: any;
  private margin = { top: 30, right: 10, bottom: 10, left: 10 };

  private width = 500 - this.margin.left - this.margin.right;
  private height = 300 - this.margin.top - this.margin.bottom;
  private x = d3.scalePoint();

  private dimensions = [
    "pass","goal","recup","tacles","intercep"
  ];

  private y: { [key: string]: d3.ScaleLinear<number, number> } = {};

  private svg: any
  private color = d3
    .scaleOrdinal()
    .domain(["Ghana", "France", "Senegal"])
    .range(["#440154ff", "#21908dff", "#fde725ff"]);

  ngOnInit(): void {
    this.create()
  }
  ngAfterViewInit() {

  }

  create(): void {
    d3.csv(
      "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv"
    ).then((data) => {
      console.log(data);
      this.data = data;
  

      const dimensions = [
        "pass","goal","recup","tacles","intercep"
      ];
      for (var i in dimensions) {
        var name = dimensions[i];
        this.y[name] = d3
          .scaleLinear()
          .domain([0, 8]) // --> Same axis range for each group
          // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
          .range([this.height, 0]);
        this.x = d3.scalePoint().range([0, this.width]).domain(dimensions);
      }
      const x = this.x;
      const y = this.y;

      function path(d) {
        return d3.line()(
          dimensions.map(function (p) {
            return [x[p], y[p][d[p]]];
          })
        );
      }

      this.buildSvg();
    });
  }

  buildSvg(): void {
    let element = this.chartContainer.nativeElement;
    const svg = d3
    .select(element)
    .append("svg")
    .attr("width", this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
    .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.create();
    const color = this.color;
    var highlight = function (d) {
      const selected_Country = d.Country;

      // first every group turns grey
      d3.selectAll(".line")
        .transition()
        .duration(200)
        .style("stroke", "lightgrey")
        .style("opacity", "0.2");
      // Second the hovered specie takes its color
      d3.selectAll("." + selected_Country)
        .transition()
        .duration(200)
        .style("stroke", color[selected_Country])
        .style("opacity", "1");
    };

    var doNotHighlight = function (d) {
      const selected_Country = d.Country;
      d3.selectAll(".line")
        .transition()
        .duration(200)
        .delay(1000)
        .style("stroke", function (d) {
          return color[selected_Country];
        })
        .style("opacity", "1");
    };

    const x = this.x;
    const y = this.y;

    svg
      .selectAll("myPath")
      .data(this.data)
      .enter()
      .append("path")
      .attr("class", (d) => this.d_class(d)) // 2 class for each line: 'line' and the group name
      .attr("d", (d) => this.path(d))
      .style("fill", "none")
      .style("stroke", (d) => this.d_species(d))
      .style("opacity", 0.5)
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight);

    svg
      .selectAll("myAxis")
      // For each dimension of the dataset I add a 'g' element:
      .data(this.dimensions)
      .enter()
      .append("g")
      .attr("class", "axis")

      .attr("transform", function (d) {
        return "translate(" + x[d] + ")";
      })

      .each(function (d) {
        d3.select(this).call(d3.axisLeft(y[d]).ticks[5].scale(y[d]));
      })
      // Add  title
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function (d) {
        return d;
      })
      .style("fill", "black");

    this.svg = svg

  }

  d_species(d) {
    const color = this.color;
    return color[d.Country ?? "blue"];
  }

  d_class(d) {
    return "line " + d.Country;
  }

  path(d) {
    const x = this.x;
    const y = this.y;
    return d3.line()(
      this.dimensions.map(function (p) {
        return [x[p], y[p][d[p]]];
      })
    );
  }
}

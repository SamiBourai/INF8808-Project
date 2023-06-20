import { 
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

export interface DataType {
  label: string;
  value: number;
  color: string;
}

export interface DataDetails {
  title: string;
  scale: number;
  tooltipTitle: string;
}

@Component({
  selector: 'app-polar-area-charts',
  templateUrl: './polar-area-charts.component.html',
  styleUrls: ['./polar-area-charts.component.css']
})
export class PolarAreaChartsComponent implements OnInit, AfterViewInit {
  @ViewChild('poloarChart') private chartContainer!: ElementRef;
  constructor() { } 

  private observer: IntersectionObserver | null = null;
  private dataSets: DataType[][] = [];
  private data: DataType[] = [];
  private currentDatasetIndex: number = 0;
  private dataDetails: DataDetails[] = [];


  ngOnInit(): void {

    this.dataSets = [
      [
        { label: 'Morroco', value: 78.6, color: '#e80284' },
        { label: 'Argentina', value: 84.6, color: '#4517EE' },
        { label: 'France', value: 82.6, color: '#4517EE' },
        { label: 'Croatia', value: 83.3 , color: '#4517EE' },
        { label: 'Senegal', value: 77.7 , color: '#DB8500' },
        { label: 'Tunisia', value: 73.8 , color: '#DB8500' },
        { label: 'Ghana', value: 77.4 , color: '#DB8500' },
      ],

      [
        { label: 'Morroco', value: 27.9, color: '#e80284' },
        { label: 'Argentina', value: 43.2, color: '#4517EE' },
        { label: 'France', value: 33.0, color: '#4517EE' },
        { label: 'Croatia', value: 32.9 , color: '#4517EE' },
        { label: 'Senegal', value: 23.5 , color: '#DB8500' },
        { label: 'Tunisia', value: 25.0 , color: '#DB8500' },
        { label: 'Ghana', value: 36.0 , color: '#DB8500' },
      ],

      [
        { label: 'Morroco', value: 60, color: '#e80284' },
        { label: 'Argentina', value: 60, color: '#4517EE' },
        { label: 'France', value: 55.2, color: '#4517EE' },
        { label: 'Croatia', value: 57.1 , color: '#4517EE' },
        { label: 'Senegal', value: 55.6 , color: '#DB8500' },
        { label: 'Tunisia', value: 50 , color: '#DB8500' },
        { label: 'Ghana', value: 55.6 , color: '#DB8500' },
      ]

    ];

    this.dataDetails = [
      {title:"% of Successful Passes", scale:70, tooltipTitle:"% of successful passes"},
      {title:"% of Successful Shots", scale:20, tooltipTitle:"% of successful shots"},
      {title:"% of Successful Goal Occasions", scale:45, tooltipTitle:"% of successful goal occasions"}
    ];

    this.data = this.dataSets[this.currentDatasetIndex]
    
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
    const margin = { top: 0, right: 50, bottom: 10, left: 10 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    const Max = (d3.max(this.data, function(d) { return d.value; }));
    
    const radiusScale = d3.scaleLinear()
    .domain([this.dataDetails[this.currentDatasetIndex].scale, Max as number])
    .range([0, radius - 50]);
    
    const tooltip = d3.select('#tooltip');

    const tooltipTitle = this.dataDetails[this.currentDatasetIndex].tooltipTitle;

    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<any>().value((d: any) => d.value);

    const arcs = pie(this.data);

    const arc = d3
      .arc<any>()
      .outerRadius(0)
      .innerRadius(0);

    svg
      .selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("opacity", 0.5);

        labels
        .filter((label) => label.data.label === d.data.label)
        .style("opacity", 0.5)
        .style('font-weight', 'bold');

        tooltip
          .style('opacity', 1)
          .style('border', `2px solid ${d.data.color}`)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
          <div>
          <div>${d.data.label}</div>
          <div>${tooltipTitle}</div>
          <div>${Math.abs(d.data.value)}</div>
          </div>
        `);
      })
      .on("mouseout", function(event, d) {
        tooltip.style('opacity', 0);
        d3.select(this)
          .style("opacity", 1);
        labels
          .filter((label) => label.data.label === d.data.label)
          .style("opacity", 1)
          .style('font-weight', 'normal');
      })
      .transition()
      .duration(1000)
      .attr("d", arc.outerRadius( d => radiusScale(d.data.value)).innerRadius(0));


    const labels = svg.selectAll("text")
      .data(arcs)
      .enter()
      .append("text")
      .attr("transform", (d) => {
        const x = arc.centroid(d)[0];
        const y = arc.centroid(d)[1];
        const angle = Math.atan2(y, x) * (180 / Math.PI);
        return `translate(${x}, ${y}) rotate(${angle}) translate(${radiusScale(d.value)/2 + 43}, 0) rotate(90)`;
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text((d) => d.data.label);

    labels
      .style("font-size", "16px")
      .style("font-weight", "normal")
      .style("fill", d => d.data.color);

    svg
      .append('text')
      .attr('class', 'Chart title')
      .attr('x', -width/4)
      .attr('y', -225)
      .style("fill", '#dadad2')
      .style("font-size", "15px")
      .text(this.dataDetails[this.currentDatasetIndex].title);

    var legend = svg
      .selectAll(".legend")
      .data(['Morroco', 'Top 3', 'African countries'])
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${(-width/3) + i * 100} , ${200})`);
    
    legend
      .append('rect')
      .attr('x', 0)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', function (d, i) {
        return ['#e80284', '#4517EE', '#DB8500'][i];
      });
    
    legend
      .append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .style("fill", '#dadad2')
      .text(d => d);

  }

  @HostListener('click', ['$event'])
  updateChartData($event: Event) {
    this.removeChart();

    this.currentDatasetIndex++;
    if (this.currentDatasetIndex >= this.dataSets.length) {
      this.currentDatasetIndex = 0;
    }

    this.data = this.dataSets[this.currentDatasetIndex];

    this.createChart();
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



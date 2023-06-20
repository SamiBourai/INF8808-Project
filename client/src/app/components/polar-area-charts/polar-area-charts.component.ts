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

@Component({
  selector: 'app-polar-area-charts',
  templateUrl: './polar-area-charts.component.html',
  styleUrls: ['./polar-area-charts.component.css']
})
export class PolarAreaChartsComponent implements OnInit, AfterViewInit {
  @ViewChild('poloarChart') private chartContainer!: ElementRef;
  constructor() { } 

  private observer: IntersectionObserver | null = null;
  private data: DataType[] = [];

  ngOnInit(): void {

    this.data = [
      { label: 'Morroco', value: 78.6, color: '#e80284' },
      { label: 'Argentina', value: 84.6, color: '#4517EE' },
      { label: 'France', value: 82.6, color: '#4517EE' },
      { label: 'Croatia', value: 83.3 , color: '#4517EE' },
      { label: 'Senegal', value: 77.7 , color: '#DB8500' },
      { label: 'Tunisia', value: 73.8 , color: '#DB8500' },
      { label: 'Ghana', value: 77.4 , color: '#DB8500' },
    ];
    
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
    const margin = { top: 50, right: 100, bottom: 50, left: 200 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;

    const Max = (d3.max(this.data, function(d) { return d.value; }));
    
    const radiusScale = d3.scaleLinear()
    .domain([70, Max as number])
    .range([0, radius - 50]);
    
    const tooltip = d3.select('#tooltip');

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
        .style('font-weight', 'bold');

        tooltip
          .style('opacity', 1)
          .style('left', event.pageX - 55 + 'px')
          .style('top', event.pageY - 75 + 'px').html(`
          <div>
          <div>${d.data.label}</div>
          <div>% of Successful Passes</div>
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
        return `translate(${x}, ${y}) rotate(${angle}) translate(${radiusScale(d.value)/2 + 30}, 0) rotate(90)`;
      })
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text((d) => d.data.label);

    labels
      .style("font-size", "14px")
      .style("font-weight", "normal")
      .style("fill", d => d.data.color);

    svg
      .append('text')
      .attr('class', 'Chart title')
      .attr('x', -width/8)
      .attr('y', -185)
      .style("fill", 'white')
      .text('% of succesful passes');
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



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
  private colors:string[] = []

  ngOnInit(): void {

    this.data = [
      { label: 'Morroco', value: 78.6 },
      { label: 'Argentina', value: 84.6 },
      { label: 'France', value: 82.6 },
      { label: 'Croatia', value: 83.3 },
      { label: 'Senegal', value: 77.7 },
      { label: 'Tunisia', value: 73.8 },
      { label: 'Ghana', value: 77.4 },
    ];

    this.colors = [
      '#e80284',
      '#4517EE',
      '#4517EE',
      '#4517EE',
      '#DB8500',
      '#DB8500',
      '#DB8500',
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
    .range([0, radius]);
    
    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      // .attr('transform', 'rotate(180 0 0)')
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    

    const pie = d3.pie<any>().value((d: any) => d.value);

    const arcs = pie(this.data);

    const arc = d3
      .arc<any>()
      .outerRadius(d => radiusScale(d.value))
      .innerRadius(0);

      svg
      .selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => this.colors[i])

      svg
      .selectAll('text')
      .data(arcs)
      .enter()
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.data.label);
    
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



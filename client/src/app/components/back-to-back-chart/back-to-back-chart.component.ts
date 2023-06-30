import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import * as d3 from 'd3';
import { CHART_POLICE, COUNTRIES, COUNTRY_COLOR_SCALE, NOM_PAYS_FONTSIZE, NOT_FOCUSED_OPACITY } from 'src/constants/constants';
import { LegendItem } from 'src/models/interfaces/pictogram';

interface GoalsData {
  country: string;
  scored: number;
  conceded: number;
}

@Component({
  selector: 'app-back-to-back-chart',
  templateUrl: './back-to-back-chart.component.html',
  styleUrls: ['./back-to-back-chart.component.css'],
})
export class BackToBackChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chart') private chartContainer!: ElementRef;

  private data: GoalsData[] = [];
  private observer: IntersectionObserver | null = null;
  private element: any;
  private margin!: { top: number, right: number, bottom: number, left: number };
  private width!: number;
  private height!: number;
  private svg: any;
  private xScale: any;
  private yScale: any;

  constructor() {}

  ngOnInit(): void {
    const scoredGoals: number[] = [6, 15, 16, 8, 5, 1, 5];
    const concededGoals: number[] = [5, 8, 8, 7, 7, 1, 7];

    

    this.data = COUNTRIES.map((country, i) => ({
      country: country,
      scored: scoredGoals[i],
      conceded: -concededGoals[i],
    }));

  }

  ngAfterViewInit() {
    this.observeChart();
  }

  observeChart(): void {
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
  onResize(event: any): void {
    this.removeChart()
    this.observer?.disconnect()
    this.observeChart()
  }

  private setupScales(): void {
    const maxAgePlayer = Math.max(
      ...this.data.map((goals: GoalsData) => [goals.scored, goals.conceded])
      .reduce((acc, val) => acc.concat(val), [])
    );
  
    this.xScale = d3.scaleLinear().domain([-maxAgePlayer, maxAgePlayer]).range([0, this.width]);
    this.yScale = d3.scaleBand().range([0, this.height]).domain(this.data.map((d) => d.country)).padding(NOT_FOCUSED_OPACITY);
  }
  
  private setupChart(): void {
    this.element = this.chartContainer.nativeElement;
    this.margin = { top: 70, right: 30, bottom: 50, left: 100 };
    this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
  
    this.setupScales();
  
    this.svg = d3
      .select(this.element)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }
  
  private drawgridLines(): void {
    Array.from({ length: 17 }, (_, index) => (index * 2) - 16).forEach((tick) => {
      this.svg
          .append('g')
          .attr('class', 'grid-line')
          .append('line')
          .attr('x1', this.xScale(tick))
          .attr('y1', 0)
          .attr('x2', this.xScale(tick))
          .attr('y2', this.height)
          .style('stroke', '#5a5858a8')
          .style('stroke-dasharray', '3, 3');
  });

    this.svg.append('line')
      .attr('x1', this.xScale(0))
      .attr('y1', 0)
      .attr('x2', this.xScale(0))
      .attr('y2', this.height)
      .attr('stroke', 'black');
  }

  private drawXAxis(): void {
    let xAxis = this.svg
      .append('g')
      .attr('transform', `translate(0,${-10})`)
      .call(
        d3
          .axisBottom(this.xScale)
          .tickValues(Array.from({ length: 17 }, (_, index) => (index * 2) - 16))
          .tickSizeOuter(0)
          .tickFormat((d: any) => Math.abs(d as number).toString())
      )
      .select('text')
      .attr("font-size", "12px")
      .attr("font-family", CHART_POLICE);
  
    xAxis.selectAll('.y-axis .tick text').attr('dy', -18)

    this.drawgridLines();
  }

  private drawYAxis(): void {
    let yAxis =this.svg.append('g').call(d3.axisLeft(this.yScale).tickSize(0).tickSizeOuter(0))
                        .attr('class', 'y-axis');
    yAxis.select(".domain").remove();
    yAxis.selectAll(".tick")
          .on('mouseover',(event:MouseEvent,country:string) => {
            this.svg.selectAll('.conceded-bar')
                    .filter((node:GoalsData)=>node.country !== country)
                    .attr('opacity',NOT_FOCUSED_OPACITY)
            this.svg.selectAll('.scored-bar')
                    .filter((node:GoalsData)=>node.country !== country)
                    .attr('opacity',NOT_FOCUSED_OPACITY)
            this.showGoal([country],true);
            this.showGoal([country],false);
            this.svg
                .selectAll('.y-axis .tick')
                .filter((country2: string) => country2 === country )
                .selectAll('text')
                .style('font-weight', 'bold');
            this.svg
                .selectAll('.y-axis .tick')
                .filter((country2: string) => country2 !== country)
                .attr('opacity',NOT_FOCUSED_OPACITY);

          })
          .on('mouseout',(event:MouseEvent,country:string) => {
            this.svg.selectAll('.conceded-bar')
                    .filter((node:GoalsData)=>node.country !== country)
                    .attr('opacity',1);
            this.svg.selectAll('.scored-bar')
                    .filter((node:GoalsData)=>node.country !== country)
                    .attr('opacity',1);
            this.hideGoal();
            this.svg
                .selectAll('.y-axis .tick')
                .filter((country2: string) => country2 === country )
                .selectAll('text')
                .style('font-weight', 'normal');
            this.svg
                .selectAll('.y-axis .tick')
                .filter((country2: string) => country2 !== country)
                .attr('opacity',1);
          })
          .select('text')
          .attr("font-size", "15px")
          .attr("font-family", CHART_POLICE)
          .attr("fill", (d:any,i:number) => COUNTRY_COLOR_SCALE(this.data[i].country) as string)
          .attr("y",-10)
    }

    private drawScoredGoalsBars(backToBackGroupingElement: any): void {
      backToBackGroupingElement.append('g')
      .attr('class','scored-g')
      .selectAll('g')
      .data(this.data)
      .join('g')
      .attr('class',`scored-bar`)
      .append('rect')
      .attr('class', (d: GoalsData) => `scored-${d.country}`)
      .attr('x', (d: GoalsData) => this.xScale(Math.min(0, d.scored)))
      .attr('y', (d: GoalsData) => this.yScale(d.country) ?? '')
      .attr('height', this.yScale.bandwidth())
      .attr('fill', '#21A179')
      .attr('stroke','none')
      .on('mouseover', (event: any, d: any) => {
        backToBackGroupingElement.selectAll(`.conceded-bar`).attr('opacity', NOT_FOCUSED_OPACITY);
        backToBackGroupingElement.selectAll('.scored-bar')
           .filter((goal:GoalsData) => goal.country !== d.country)
           .selectAll('rect')
           .attr('opacity', NOT_FOCUSED_OPACITY);

       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: string) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: string) => node !== d.country)
          .attr('opacity',NOT_FOCUSED_OPACITY);
       this.svg
          .selectAll('.legend-item')
          .filter((node:LegendItem) => node.type === "scored")
          .selectAll('text')
          .style('font-weight','bold');
       this.svg
          .selectAll('.legend-item')
          .filter((node:LegendItem) => node.type !== "scored")
          .attr('opacity',NOT_FOCUSED_OPACITY)
          this.showGoal([d.country],true);
      })
      .on('mouseout', (event: MouseEvent, d: GoalsData) => {
        backToBackGroupingElement.selectAll(`.conceded-bar`).attr('opacity', 1);
        backToBackGroupingElement.selectAll('.scored-bar')
           .filter((goal:GoalsData) => goal.country !== d.country)
           .selectAll('rect')
           .attr('opacity', 1);
        this.svg
          .selectAll('.y-axis .tick')
          .filter((node: string) => node === d.country)
          .selectAll('text')
          .style('font-weight', 'normal');
       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: string) => node !== d.country)
          .attr('opacity',1);
       this.svg
          .selectAll('.legend-item')
          .filter((node:LegendItem) => node.type === "scored")
          .select('text')
          .style('font-weight','normal');
       this.svg
          .selectAll('.legend-item')
          .filter((node:LegendItem) => node.type !== "scored")
          .attr('opacity',1)
        this.hideGoal();
        
      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d: GoalsData) => Math.abs(this.xScale(d.scored) - this.xScale(0)));
    }

    private drawConcededGoalsBars(backToBackGroupingElement: any): void {
      backToBackGroupingElement.append('g')
      .attr('class','conceded-g')
      .selectAll('g')
      .data(this.data)
      .join('g')
      .attr('class',`conceded-bar`)
      .append('rect')
      .attr('x', (d: GoalsData) => this.xScale(0))
      .attr('y', (d: GoalsData) => this.yScale(d.country) ?? '')
      .attr('height', this.yScale.bandwidth())
      .attr('fill', '#F3535B')
      .attr('stroke','none')
      .on('mouseover', (event: MouseEvent, d: GoalsData) => {
        backToBackGroupingElement.selectAll(`.scored-bar`).attr('opacity', NOT_FOCUSED_OPACITY);
        backToBackGroupingElement.selectAll('.conceded-bar')
           .filter((goal:GoalsData) => goal.country !== d.country)
           .selectAll('rect')
           .attr('opacity', NOT_FOCUSED_OPACITY);        
       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'bold');
       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity',NOT_FOCUSED_OPACITY)
       this.svg
          .selectAll('.legend-item')
          .filter((node:any) => node.type === "conceded")
          .select('text')
          .style('font-weight','bold')
       this.svg
          .selectAll('.legend-item')
          .filter((node:any) => node.type !== "conceded")
          .attr('opacity',NOT_FOCUSED_OPACITY)
        this.showGoal([d.country],false);

      })
      .on('mouseout', (event: MouseEvent, d: GoalsData) => {
        backToBackGroupingElement.selectAll(`.scored-bar`).attr('opacity', 1);
        backToBackGroupingElement.selectAll('.conceded-bar')
           .filter((goal:GoalsData) => goal.country !== d.country)
           .selectAll('rect')
           .attr('opacity', 1); 
       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node === d.country)
          .select('text')
          .style('font-weight', 'normal');
       this.svg
          .selectAll('.y-axis .tick')
          .filter((node: any) => node !== d.country)
          .attr('opacity',1);
       this.svg
          .selectAll('.legend-item')
          .filter((node:LegendItem) => node.type === "conceded")
          .select('text')
          .style('font-weight','normal');
       this.svg
          .selectAll('.legend-item')
          .filter((node:LegendItem) => node.type !== "conceded")
          .attr('opacity',1);
          this.hideGoal();

      })
      .attr('width', 0)
      .transition()
      .duration(1000)
      .attr('width', (d: GoalsData) => Math.abs(this.xScale(d.conceded) - this.xScale(0)))
      .attr('x', (d: GoalsData) => this.xScale(Math.min(0, d.conceded)));
    }

    private drawBars(): void {
      const backToBackGroupingElement =this.svg.append('g').attr('class','back2back-g')
      this.drawConcededGoalsBars(backToBackGroupingElement);
      this.drawScoredGoalsBars(backToBackGroupingElement);
    }

    private createLegendItems(): any {
      const legendItems : LegendItem[]= 
      [
        {type:'conceded', text:'Conceded goals', color: '#F3535B'},
        {type:'scored', text: 'Scored goals', color: '#21A179'}
      ]

      const typeGoalColorScale = d3.scaleBand()
      .domain(legendItems.map((d: LegendItem) => d.type));
      
      const legend = this.svg.append('g')
                      .attr('class','legend-g')
                      .selectAll('g')
                      .data(legendItems)
                      .join('g')
                      .attr('class', 'legend-item')
                      .attr('transform',  (d, i) => {
                        let legendX = (this.width - 2 * 150) / 2;
                        return 'translate(' + (legendX + i * 150) + ',' + (-60) + ')';
                      })
                      .on('mouseover',(event:any, d:LegendItem) => {
                       this.svg.selectAll('.legend-item')
                              .filter((item:LegendItem) => item.type === d.type)
                              .select('text')
                              .style('font-weight','bold');
                       this.svg.selectAll('.legend-item')
                       .filter((item:LegendItem) => {
                        console.log('filter', item);
                        return item.type !== d.type;
                      })                              
                      .attr('opacity',NOT_FOCUSED_OPACITY);
                        const countries: string[] = this.data.map((d:GoalsData) => d.country)
                        
                        if (d.type === 'conceded') {
                          this.svg.selectAll('.scored-g')
                                  .attr('opacity',NOT_FOCUSED_OPACITY)
                          this.showGoal(countries,false)
                        } else {
                          this.svg.selectAll('.conceded-g')
                                  .attr('opacity',NOT_FOCUSED_OPACITY)
                          this.showGoal(countries,true)
                          
                        }
                      })
                      .on('mouseout',(event:any, d:LegendItem) => {
                       this.svg.selectAll('.legend-item')
                              .filter((item:LegendItem) => item.type === d.type)
                              .select('text')
                              .style('font-weight','normal');
                       this.svg.selectAll('.legend-item')
                              .filter((item:LegendItem) => item.type !== d.type)
                              .attr('opacity',1);
                      if (d.type === 'conceded') {
                        this.svg.selectAll('.scored-g')
                                .attr('opacity',1)
                      } else {
                        this.svg.selectAll('.conceded-g')
                                .attr('opacity',1)
                        
                      }
                        this.hideGoal();

                      })
      return legend;              
    }

    private drawLegendRect(): void {
      this.svg.selectAll('.legend-item')
      .append('rect')
      .attr('x', 0)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', (d:LegendItem) => d.color);
    }

    private drawLegendText(): void {
      this.svg.selectAll('.legend-item')
      .append('text')
      .attr('x', 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .style('fill', 'white')
      .style("font-size", "12px")
      .style("font-family", CHART_POLICE)
      .text((d:LegendItem) => {
        return d.text;
      });
    }

    private drawLegend(): void {
      this.createLegendItems();
      this.drawLegendRect();
      this.drawLegendText();
    }

  createChart(): void {
    this.setupChart();
    this.drawXAxis();
    this.drawYAxis(); 
    this.drawBars();
    this.drawLegend();       

  }

  showGoal(countries: string[], scored: boolean): void {
    this.svg
      .selectAll(scored?'.scored-bar':'.conceded-bar')
      .filter((node: GoalsData) => countries.includes(node.country))
      .append('text')
      .text((d:GoalsData) =>scored?d.scored.toString():Math.abs(d.conceded).toString())
      .attr('x', (d:GoalsData)=>scored? this.xScale(d.scored) + 5 : this.xScale(d.conceded) - 10)
      .attr('y', (d:GoalsData) => this.yScale(d.country) + this.yScale.bandwidth()/2 + 4)
      .style('font-size', NOM_PAYS_FONTSIZE)
      .style('font-family', CHART_POLICE)
      .attr('text-anchor', scored?'right':'left')
      .attr('fill', scored?'#21A179':'#F3535B');
  }

  hideGoal(): void {
    this.svg
      .selectAll('.back2back-g text')
      .remove();
  }

  removeChart() {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
  }

}

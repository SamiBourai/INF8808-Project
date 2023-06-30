import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { CHART_POLICE, COUNTRY_COLOR_SCALE } from 'src/constants/constants';

import { Data, LegendData } from 'src/models/interfaces/multibar';

@Component({
  selector: 'multi-bar-chart',
  templateUrl: './multi-bar-chart.component.html',
  styleUrls: ['./multi-bar-chart.component.css'],
})
export class PolarAreaChartsComponent implements OnInit, AfterViewInit {
  @ViewChild('multiBarChart') private chartContainer!: ElementRef;

  constructor() {}

  private svg: any;
  private observer: IntersectionObserver | null = null;

  private dataSets: Data = {
    Morocco: {
      color: '#e80284',
      values: {
        passes: 78.6,
        shots: 27.9,
        occasions: 60,
      },
    },
    Argentina: {
      color: '#03a0c7',
      values: {
        passes: 84.6,
        shots: 43.2,
        occasions: 60,
      },
    },
    France: {
      color: '#03a0c7',
      values: {
        passes: 82.6,
        shots: 33.0,
        occasions: 55.2,
      },
    },
    Croatia: {
      color: '#03a0c7',
      values: {
        passes: 83.3,
        shots: 32.9,
        occasions: 57.1,
      },
    },
    Senegal: {
      color: '#DB8500',
      values: {
        passes: 77.7,
        shots: 23.5,
        occasions: 55.6,
      },
    },
    Tunisia: {
      color: '#DB8500',
      values: {
        passes: 73.8,
        shots: 25.0,
        occasions: 50,
      },
    },
    Ghana: {
      color: '#DB8500',
      values: {
        passes: 77.4,
        shots: 36.0,
        occasions: 55.6,
      },
    },
  };

  private colorLegend: string = '#69F0AE';

  private legendData: LegendData = {
    passes: {
      label: '% of Successful Passes',
      fill: this.colorLegend,
      tooltipLabel: '% of successful passes:',
    },
    shots: {
      label: '% of Shots on Target',
      fill: 'url(#dotted-pattern)',
      tooltipLabel: '% of shots on target:',
    },
    occasions: {
      label: '% of Successful Goal Occasions',
      fill: 'url(#striped-pattern)',
      tooltipLabel: '% of successful goal occasions:',
    },
  };
  private xSubgroupScale: any;
  private xScale: any;
  private yScale: any;

  ngOnInit(): void {
    this.dataSets = Object.entries(this.dataSets)
      .map(([country, data]) => ({
        country,
        ...data,
        sum: data.values.passes + data.values.shots + data.values.occasions,
      }))
      .reduce((acc, { country, ...data }) => {
        acc[country] = data;
        return acc;
      }, {});
  }

  ngAfterViewInit(): void {
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

  highlightBar(d: any, fCountry: boolean, fType: any): void {
    this.svg
      .selectAll('.bar-g rect')
      .filter((node: any) => {
        if (fCountry) {
          if (fType) {
            return node.country !== d.country || node.type !== d.type;
          }
          return node.country !== d.country;
        } else {
          if (fType) {
            return node.type !== d.type;
          }
          return false;
        }
      })
      .attr('opacity', 0.3);

    const barmargin = 5;
    this.svg
      .selectAll('.bar-g')
      .filter((node: any) => {
        if (fCountry) {
          if (fType) {
            return node.country === d.country && node.type === d.type;
          }
          return node.country === d.country;
        } else {
          if (fType) {
            return node.type === d.type;
          }
          return true;
        }
      })
      .append('text')
      .text((d: any) => d.value.toString())
      .style('font-size', 15)
      .style('font-family', CHART_POLICE)
      .attr('y', (d: any) => this.yScale(d.value) - barmargin)
      .attr('x', this.xSubgroupScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => COUNTRY_COLOR_SCALE(d.country));
  }

  unhighlightBar(d: any, fCountry: boolean, fType: boolean): void {
    this.svg
      .selectAll('.bar-g rect')
      .filter((node: any) => {
        if (fCountry) {
          if (fType) {
            return node.country !== d.country || node.type !== d.type;
          }
          return node.country !== d.country;
        } else {
          if (fType) {
            return node.type !== d.type;
          }
          return false;
        }
      })

      .attr('opacity', 1);
    this.svg
      .selectAll('.bar-g text')
      .filter((node: any) => {
        if (fCountry) {
          if (fType) {
            return node.country === d.country && node.type === d.type;
          }
          return node.country === d.country;
        } else {
          if (fType) {
            return node.type === d.type;
          }
          return true;
        }
      })
      .remove();
  }

  highlightXLabel(d: any): void {
    this.svg
      .selectAll('.x-axis')
      .filter((node: any) => node === d.country)
      .style('font-weight', 'bold');

    this.svg
      .selectAll('.x-axis .tick text')
      .filter((node: any) => node !== d.country)
      .attr('opacity', 0.3);
  }

  unhighlightXLabel(d: any): void {
    this.svg
      .selectAll('.x-axis .tick text')
      .filter((node: any) => node === d.country)
      .style('font-weight', 'normal');

    this.svg
      .selectAll('.x-axis .tick text')
      .filter((node: any) => node !== d.country)
      .attr('opacity', 1);
  }

  highlightLegend(d: any): void {
    this.svg
      .selectAll('.legend-item')
      .filter((node: any) => node.type !== d.type)
      .attr('opacity', 0.3);
    this.svg
      .selectAll('.legend-item')
      .filter((node: any) => node.type === d.type)
      .selectAll('text')
      .style('font-weight', 'bold');
  }

  unhighlightLegend(d: any): void {
    this.svg
      .selectAll('.legend-item')
      .filter((node: any) => node.type !== d.type)
      .attr('opacity', 1);
    this.svg
      .selectAll('.legend-item')
      .filter((node: any) => node.type === d.type)
      .selectAll('text')
      .style('font-weight', 'normal');
  }

  createChart(): void {
    const element: HTMLElement = this.chartContainer.nativeElement;
    const margin = { top: 50, right: 50, bottom: 20, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    this.yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);
    const keys = Object.keys(
      this.dataSets[Object.keys(this.dataSets)[0]].values
    );
    this.xScale = d3
      .scaleBand()
      .padding(0.15)
      .domain(Object.keys(this.dataSets))
      .range([0, width]);
    this.xSubgroupScale = d3
      .scaleBand()
      .padding(0.015)
      .domain(keys)
      .range([0, this.xScale.bandwidth()]);

    const tooltip = d3.select('#tooltip');

    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const defs = this.svg.append('defs');
    Object.entries(this.dataSets).forEach(([country, data]) => {
      let color = data.color;

      // dotted fill
      defs
        .append('pattern')
        .attr('id', `dotted-${country}`)
        .attr('width', '5')
        .attr('height', '5')
        .attr('patternUnits', 'userSpaceOnUse')
        .append('circle')
        .attr('cx', '2.5')
        .attr('cy', '2.5')
        .attr('r', '2')
        .attr('fill', color);

      // striped fill
      defs
        .append('pattern')
        .attr('id', `striped-${country}`)
        .attr('width', '10') 
        .attr('height', '10') 
        .attr('patternTransform', 'rotate(45 0 0)')
        .attr('patternUnits', 'userSpaceOnUse')
        .append('rect')
        .attr('width', '5') 
        .attr('height', '10') 
        .attr('fill', color);
    });

    // dotted fill
    defs
      .append('pattern')
      .attr('id', 'dotted-pattern')
      .attr('width', '5') 
      .attr('height', '5')
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle')
      .attr('cx', '2.5') 
      .attr('cy', '2.5') 
      .attr('r', '2') 
      .attr('fill', this.colorLegend);

    // striped fill
    defs
      .append('pattern')
      .attr('id', 'striped-pattern')
      .attr('width', '10') 
      .attr('height', '10') 
      .attr('patternTransform', 'rotate(45 0 0)')
      .attr('patternUnits', 'userSpaceOnUse')
      .append('rect')
      .attr('width', '5') 
      .attr('height', '10') 
      .attr('fill', this.colorLegend);

    const multibars_g = this.svg
      .append('g')
      .attr('class', 'multibars-g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const countrybars_g = multibars_g
      .selectAll('g')
      .data(Object.entries(this.dataSets))
      .join('g')
      .attr('class', 'countrybars-g')
      .attr('transform', (d: any) => `translate(${this.xScale(d[0])},0)`);

    const bars_g = countrybars_g
      .selectAll('g')
      .data((d: any) => {
        const country = d[0];
        const data = d[1];
        return Object.entries(data.values).map(([type, _]) => {
          return { type, value: data.values[type], country };
        });
      })
      .join('g')
      .attr('class', 'bar-g')
      .attr(
        'transform',
        (d: any) => `translate(${this.xSubgroupScale(d.type)},0)`
      );

    bars_g
      .append('rect')
      .attr('y', (d: any) => height)
      .attr('width', this.xSubgroupScale.bandwidth())
      .attr('height', (d: any) => 0)
      .attr('fill', (d: any) => {
        let color = COUNTRY_COLOR_SCALE(d.country);
        switch (d.type) {
          case 'passes':
            return color;
          case 'shots':
            return `url(#dotted-${d.country})`;
          case 'occasions':
            return `url(#striped-${d.country})`;
          default:
            return color;
        }
      })
      .on('mouseover', (event: any, d: any) => {
        this.highlightBar(d, true, true);
        this.highlightXLabel(d);
        this.svg
          .selectAll('.legend-item')
          .filter((node: any) => node.type === d.type)
          .each((dd: any) => {
            this.highlightLegend(dd);
          });
      })
      .on('mouseout', (event: any, d: any) => {
        this.unhighlightBar(d, true, true);
        this.unhighlightXLabel(d);
        this.svg
          .selectAll('.legend-item')
          .filter((node: any) => node.type === d.type)
          .each((dd: any) => {
            this.unhighlightLegend(dd);
          });
      })
      .transition()
      .duration(200)
      .ease(d3.easeCubicInOut)
      .delay((d, i) => {
        switch (d.type) {
          case 'passes':
            return 0;
          case 'shots':
            return 200;
          case 'occasions':
            return 400;
          default:
            return 400;
        }
      })
      .attr('height', (d: any) => height - this.yScale(d.value))
      .attr('y', (d: any) => this.yScale(d.value));

    const xAxis = d3.axisBottom(this.xScale);
    const yAxis = d3.axisLeft(this.yScale);

    // append the x axis to the chart
    this.svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(${margin.left}, ${height + margin.top})`)
      .call(xAxis);
    this.svg
      .selectAll('.x-axis text')
      .on('mouseover', (event: any, d: any) => {
        const f = 'country';
        this.svg
          .selectAll('.bar-g rect')
          .filter((node: any) => node[f] === d)
          .each((dd: any) => {
            this.highlightBar(dd, true, false);
            this.highlightXLabel(dd);
          });
      })
      .on('mouseout', (event: any, d: any) => {
        const f = 'country';
        this.svg
          .selectAll('.bar-g rect')
          .filter((node: any) => node[f] === d)
          .each((dd: any) => {
            this.unhighlightBar(dd, true, false);
            this.unhighlightXLabel(dd);
          });
      });

    this.svg.selectAll('.x-axis .tick line').attr('stroke', 'none');

    this.svg
      .selectAll('.x-axis .tick text')
      .attr('fill', (d) => COUNTRY_COLOR_SCALE(d))
      .style('font-size', 15)
      .style('font-family', CHART_POLICE);

    // append the y axis to the chart
    this.svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis);
    this.svg
      .selectAll('.y-axis .tick text')
      .style('font-size', 12)
      .style('font-family', CHART_POLICE);

    this.svg
      .append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('y', 0)
      .attr('x', -height / 2 - margin.top)
      .attr('dy', '.75em')
      .attr('fill', 'white')
      .attr('transform', 'rotate(-90)')
      .text('Percentages (%)')
      .style('font-size', 15)
      .style('font-family', CHART_POLICE);

    const legendItemSize = 20;
    const legendItemSpacing = 10;
    const legendHeight =
      Object.keys(this.legendData).length *
      (legendItemSize + legendItemSpacing);

    let legendWidth = 120;
    const legendX = width - legendWidth;
    const legend = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendX}, 0)`);

    const legendItems = legend
      .selectAll('.legend-item')
      .data(
        Object.entries(this.legendData).map(([type, values]) => ({
          type,
          values,
        }))
      )
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr(
        'transform',
        (d, i) => `translate(0, ${i * (legendItemSize + legendItemSpacing)})`
      )
      .attr('opacity', 1)
      .on('mouseover', (event: any, d: any) => {
        this.svg
          .selectAll('.bar-g rect')
          .filter((node: any) => node.type === d.type)
          .each((dd: any) => {
            this.highlightBar(dd, false, true);
            this.highlightXLabel(dd);
          });
        this.highlightLegend(d);
      })
      .on('mouseout', (event: any, d: any) => {
        this.svg
          .selectAll('.bar-g rect')
          .filter((node: any) => node.type === d.type)
          .each((dd: any) => {
            this.unhighlightBar(dd, false, true);
            this.unhighlightXLabel(dd);
          });
        this.unhighlightLegend(d);
      });

    legendItems
      .append('rect')
      .attr('width', legendItemSize)
      .attr('height', legendItemSize)
      .attr('fill', (d) => d.values.fill);

    legendItems
      .append('text')
      .attr('class', 'legend-item-text')
      .attr('x', legendItemSize + 5)
      .attr('y', legendItemSize / 2)
      .attr('dy', '0.35em')
      .text((d) => d.values.label)
      .attr('fill', 'white')
      .style('font-size', 12)
      .style('font-family', CHART_POLICE);
  }

  removeChart(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

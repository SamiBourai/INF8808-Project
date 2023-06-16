import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import d3Tip from 'd3-tip';
@Component({
  selector: 'app-touches-component',
  templateUrl: './touches-component.component.html',
  styleUrls: ['./touches-component.component.css'],
})
export class TouchesComponentComponent implements AfterViewInit {
  private className: string = 'waffle-chart';
  private svgs: Map<string, any> = new Map();

  data: any[] = [
    { Player: 'Sadio Mané', Sh: 99, SoT: 37, Gls: 16 },
    { Player: 'Rafael Leão', Sh: 97, SoT: 38, Gls: 11 },
    { Player: 'Karim Benzema', Sh: 118, SoT: 47, Gls: 27 },
    { Player: 'Mohamed Salah', Sh: 134, SoT: 49, Gls: 23 },
    { Player: 'Kylian Mbappé', Sh: 144, SoT: 60, Gls: 28 },
    { Player: 'Christopher Nkunku', Sh: 80, SoT: 39, Gls: 20 },
  ];
  width: number = 400;
  height: number = 140;

  private boxSize: number = 14; // Size of each box
  private boxGap: number = 3; // space between each box
  private howManyAcross: number = Math.floor(this.height / this.boxSize);
  private occurrences: any[] = [];

  private previousGroup: any = undefined;

  private colors: string[] = ['#21A179', '#1481BA', '#F3535B'];
  private tip = d3Tip()
    .attr('class', 'd3-tip')
    .html((d) => {
      return this.getTipContent(d);
    });

  constructor() {}

  ngAfterViewInit(): void {
    this.createSvg();
    this.drawWaffle();
    this.drawLegend();
  }

  private drawWaffle() {
    this.data.forEach((d, i) => {
      const currentSvg = this.svgs.get(d.Player);

      const { Player, ...rest } = d;

      const data: any[] = [];

      // Create an array of the keys
      Object.keys(rest).forEach((key) => {
        // Create an array of size value that contains the key
        data.push(...Array.from({ length: rest[key] }, () => key));
      });

      this.occurrences.push(
        data.reduce((acc, curr) => {
          return acc[curr] ? ++acc[curr] : (acc[curr] = 1), acc;
        }, {})
      );

      currentSvg.call(this.tip);

      currentSvg
        .append('g')
        .attr('class', 'all-rects')
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('class', (d) => `square-${d}`)
        .attr('x', (d, i) => this.boxSize * Math.floor(i / this.howManyAcross))
        .attr('y', (d, i) => this.boxSize * (i % this.howManyAcross))
        .attr('width', this.boxSize - this.boxGap)
        .attr('height', this.boxSize - this.boxGap)
        .attr('fill', (d) => this.colors[Object.keys(rest).indexOf(d)])
        .on('mouseover', (_event, d) => {
          if (this.previousGroup !== d) {
            currentSvg.selectAll('rect').attr('opacity', 0.5);
            currentSvg.selectAll(`.square-${d}`).attr('opacity', 1);

            let e = currentSvg.select('g.all-rects');

            this.tip.show(this.occurrences[i][d], e.node());
          }
        })
        .on('mouseleave', (_event, d) => {
          this.previousGroup = d;
        });
    });
  }

  private getTipContent(d: any): string {
    return `
            <div class="tip-content">
                <div class="tip-title">${d}</div>
            </div>
        `;
  }

  private drawLegend() {
    this.data.forEach((d, i) => {
      const currentSvg = this.svgs.get(d.Player);
      const { Player, ...rest } = d;
      const legend = currentSvg
        .append('g')
        .attr('class', `legend-${this.normalizePlayerName(Player)}`)
        .selectAll('g')
        .data(Object.keys(rest))
        .join('g')
        .attr('transform', (d, i) => {
          return `translate(0, ${i * 15})`;
        })
        .on('mouseenter', (_event, d) => {
          currentSvg.selectAll('rect').attr('opacity', 0.5);
          currentSvg.selectAll(`.square-${d}`).attr('opacity', 1);
          let e = currentSvg.select('g.all-rects');

          this.tip.show(this.occurrences[i][d], e.node());
        })
        .on('mouseleave', (_event, d) => {
          currentSvg.selectAll('rect').attr('opacity', 1);
        });
      legend
        .append('rect')
        .attr('class', (d) => `square-${d}`)
        .attr('x', this.width - 35)
        .attr('width', 11)
        .attr('height', 11)
        .attr('fill', (d) => this.colors[Object.keys(rest).indexOf(d)]);
      legend
        .append('text')
        .attr('x', this.width - 20)
        .attr('y', 5)
        .attr('font-size', '10px')
        .attr('dy', '0.35em')
        .text((d) => d);
    });
  }

  private createSvg(): void {
    this.data.forEach((d, i) => {
      this.svgs.set(d.Player, this.createSvgForPlayer(d, i));
    });
  }

  private createSvgForPlayer(d: any, i: number): any {
    return d3
      .select(`figure#waffle-chart-${i}`)
      .append('svg')
      .attr('class', `${this.className}-${this.normalizePlayerName(d.Player)}`)
      .attr('width', this.width)
      .attr('height', this.height)
      .on('mouseleave', (_event, d) => {
        this.previousGroup = d;
        d3.selectAll('rect').attr('opacity', 1);
        let e = d3.selectAll('g.all-rects');
        e.nodes().forEach((node) => {
          d3.select(node).call(this.tip.hide);
        });
      });
  }

  private normalizePlayerName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s/g, '-')
      .toLowerCase();
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  Renderer2,
} from '@angular/core';
import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { MatSlideToggleChange,MatSlideToggle } from '@angular/material/slide-toggle';


@Component({
  selector: 'app-horizontal-pictogram',
  templateUrl: './horizontal-pictogram.component.html',
  styleUrls: ['./horizontal-pictogram.component.css']
})
export class HorizontalPictogramComponent implements OnInit, AfterViewInit {
  @ViewChild('pictogram') private chartContainer!: ElementRef;
  @ViewChild('hscroll') private hscroll!: ElementRef;
  @ViewChild('toggle') private toggle!: MatSlideToggle;  // Add a ViewChild reference to your slide toggle

changeToggle() {
  this.toggle.checked = !this.toggle.checked;  // Change the state of the toggle
  this.toggle.change.emit(  // Emit the change event manually
    new MatSlideToggleChange(
      this.toggle, 
      this.toggle.checked
    )
  );
    }


  private observer: IntersectionObserver | null = null;
  public countries: string[] = [
    'Morocco',
    'Argentina',
    'France',
    'Croatia',
    'Senegal',
    'Tunisia',
    'Ghana',
  ];
  public championships : string[] = [
    'PremierLeague',
    'Ligue1',
    'SerieA',
    'Bundesliga',
    'Liga',
  ];
  public colors: string[] = [
    '#e80284',
    '#4517EE',
    '#4517EE',
    '#4517EE',
    '#DB8500',
    '#DB8500',
    '#DB8500',
  ];

  public legendItems: {[key: string]:any} = {
    'true' : {'color':'white','text':'Player plays in a club in the Top 5 of Top 5 european championship at the end of 2021-2022 season'},
    'false': {'color':'black','text':'Player plays in an other clubs'},
    'rect' : {'color': 'black', 'text': 'Average player age'},
  }
  private top5Data: {[key: string]: any} = {};
  private playerData: {[key: string]: any} = {};

  private element: any;
  private margin = { top: 50, right: 100, bottom: 20, left: 150 };
  private width: number = 0;
  private heightLegend: number = 150;
  private height: number = 500 - this.margin.top - this.margin.bottom - this.heightLegend;
  private svg: any;
  private xScale: any;
  private yScale: any;
  private ageScale: any;
  private colorScale: any;
  private countryColorScale: any;
  private scrollingdown: boolean = false;
  private transitiondone: boolean = true;





  
  constructor(private http: HttpClient, private renderer: Renderer2) { }
  

  async ngOnInit(): Promise<void> {

    await this.loadPlayers();
    await this.loadChampionships();
    this.cleanPos();
    this.cleanAge();
    this.cleanClub();
    this.orderPlayers();
  }

  async loadPlayers() {
    try {
      for (let country of this.countries) {
        const csvFileName = `${country}_Team.csv`;
        const data = await this.http.get('assets/Teams/' + csvFileName, { responseType: 'text' }).toPromise();
  
        let rows = data.split('\n').filter((row) => row.trim() !== '');
        let headers = rows[0].split(';').map((header) => header.replace('\r', '').trim());
        this.playerData[country] = [];
  
        for (let i = 1; i < rows.length; i++) {
          let cells = rows[i].split(';').map((row) => row.replace('\r', '').trim());
  
          let playerObject: { [key: string]: string | number } = {};
          headers.forEach((col, index) => {
            playerObject[col] = cells[index];
          });
          playerObject['Country'] = country;
          this.playerData[country].push(playerObject);
        }
      }
    } catch (error) {
      console.error('An error occurred while loading player data:', error);
    }
  }
  


  cleanAge() {
    Object.keys(this.playerData).forEach((country) => {
      Object.values(this.playerData[country] as { [key: string]: any }).forEach((player: { [key: string]: any }) => {
        let ageParts = (player['Age'] as string).split('-');
        let years = parseInt(ageParts[0]);
        let days = parseInt(ageParts[1]);
  
        if (!isNaN(years) && !isNaN(days)) {
          let fractionOfYear = days / 365;
          let age = years + fractionOfYear;
          player['Age'] = ageParts[0] + " years " + ageParts[0] + " days" ;
          player['AgeInYear'] = age;
        }
      });
    });
  }

  cleanPos() {
    const positionType: {[key: string]: any} = {
        'AT': 'Forward ',
        'MT': 'Midfielder',
        'DF': 'Defender ',
        'GB': 'Goalkeeper',
    }

    Object.keys(this.playerData).forEach((country) => {
        this.playerData[country].forEach((player: { [key: string]: any }) => {
            let playerPos = "";
            for(let pos of (player['Pos'] as string).split(',')){
                playerPos += positionType[pos.trim()] || pos.trim();
                playerPos += ',';
            }
            player['Pos'] = playerPos.slice(0, -1); // Removes the trailing comma
        });
    });
}


  sanitize(str : string) {
    return str.trim().replace(/\s/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } 


  cleanClub() {
    Object.keys(this.playerData).forEach((country) => {
      this.playerData[country].forEach((player: { [key: string]: any }) => {
        let clubParts = (player['Club'] as string).split('\u00A0');
        let clubCountry = '';

        if (clubParts[0]) {
          let clubCountryParts = clubParts[0].split('.');
          if (clubCountryParts[1]) {
            clubCountry = clubCountryParts[1].toUpperCase();
          }
        }        
        let clubName = clubParts[1];
        player['Club'] = this.sanitize(clubName);
        player['ClubCountry'] = this.sanitize(clubCountry);
        player['ClubInTop5'] = this.top5Data.includes(clubName);
      });
    });
  }

  
  
  async loadChampionships() {
    let championshipData: { [key: string]: string } = {};
    let teamNames: string[] = [];
    this.top5Data = [];
  
    for (let championship of this.championships) {
      championshipData[championship] = `${championship}_2021_2022.csv`;
    }
  
    for (let championship in championshipData) {
      try {
        const data = await this.http
          .get('assets/Championships/' + championshipData[championship], { responseType: 'text' })
          .toPromise();
  
        let rows = data.split('\n');
        let headers = rows[0].split(';').map((header) => header.replace('\r', '').trim());
        let teamNameIndex = headers.indexOf('Équipe');
        let rankIndex = headers.indexOf('Clt');
  
        if (teamNameIndex === -1 || rankIndex === -1) {
          console.error(`CSV file for ${championship} does not contain teamName and/or rank columns.`);
          continue;
        }
  
        let teamData: Array<{ name: string; rank: number }> = [];
  
        for (let i = 1; i < rows.length; i++) {
          let cells = rows[i].split(';');
          let teamName = cells[teamNameIndex];
          let teamRank = parseInt(cells[rankIndex]);
          if (teamName && !isNaN(teamRank)) {
            teamData.push({ name: teamName, rank: teamRank });
          }
        }
  
        // Sort the teams by rank
        teamData.sort((a, b) => a.rank - b.rank);
  
        // Only keep the top 5 teams
        let top5Teams = teamData.slice(0, 5);
  
        // Extract team names and add them to the teamNames array
        top5Teams.forEach((team) => {
          let sanitizedTeamName = this.sanitize(team.name);
          if (!teamNames.includes(sanitizedTeamName)) {
            teamNames.push(sanitizedTeamName);
            this.top5Data.push(sanitizedTeamName);
          }
        });
      } catch (error) {
        console.error(`An error occurred while loading CSV file for ${championship}:`, error);
      }
    }
  
    // Remove duplicates from teamNames array
    this.top5Data = teamNames;
  }

  orderPlayers(){
    this.playerData = Object.entries(this.playerData).reduce((acc: any, [country, players]: [string, any]) => {
      const sortedPlayers = Object.values(players).sort((a: any, b: any) => {
        if (a['ClubInTop5'] !== b['ClubInTop5']) {
          return b['ClubInTop5'] - a['ClubInTop5']; // Sort by 'ClubInTop5' in descending order
        }
        return a['Player'] - b['Player']; // Sort by 'Player' name in ascending order
      });
      return { ...acc, [country]: sortedPlayers };
    }, {});
  } 
  

 orderByAge() {
  this.transitiondone = false;
  this.svg.selectAll('.player-circle')
    .transition()
    .duration(1000)
    .ease(d3.easeCubicInOut)
    .attr('cx', (d: any) => this.ageScale(d['AgeInYear']))
    .on('end', () => this.transitiondone = true)

  this.svg.selectAll('.x-tick')
    .transition()
    .duration(1000)
    .ease(d3.easeCubicInOut)
    .attr("opacity",1)

  this.svg.selectAll('.x-axis')
    .transition()
    .duration(1000)
    .ease(d3.easeCubicInOut)
    .attr("opacity",1);
  this.svg.selectAll('.country-avg')
          .transition()
          .duration(1000)
          .ease(d3.easeCubicInOut)
          .attr('opacity',1);
  this.svg.selectAll('.x-axis')
          .transition()
          .duration(1000)
          .ease(d3.easeCubicInOut)
          .attr("opacity",1);
  this.svg.select('#avg-legend-item')
          .transition()
          .duration(1000)
          .ease(d3.easeCubicInOut)
          .attr('opacity',1);
 } 

 orderByClub() {
  this.transitiondone = false;
    this.svg.selectAll('.country-g').selectAll('.player-circle')
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .attr('cx', (d: any, i: number) => this.xScale(i))
      .on('end', () => this.transitiondone = true);


    this.svg.selectAll('.x-tick')
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .attr("opacity",0);

    this.svg.selectAll('.x-axis')
      .transition()
      .duration(1000)
      .ease(d3.easeCubicInOut)
      .attr("opacity",0);

    this.svg.selectAll('.country-avg')
            .transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr('opacity',0);

    this.svg.select('#avg-legend-item')
            .transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr('opacity',0);
  }
 
 onSlideToggleChange(event: any) {
  if (event.checked) {  
    this.orderByAge()

  } else {
    this.orderByClub()
  }
}

onWheelChange() { 
  this.renderer.listen(this.hscroll.nativeElement, 'wheel', (event) => {
    if (this.transitiondone) {
    if (event.deltaY < 0 && this.scrollingdown) {
      event.preventDefault();
      this.changeToggle();
      console.log('age off')
      this.scrollingdown = false;
    }
  
    if (event.deltaY > 0 && !this.scrollingdown) {
      event.preventDefault();
      this.changeToggle();
      console.log('age on')
      this.scrollingdown = true;
    }
  } else {
    event.preventDefault();
  }
  });
}
  
  ngAfterViewInit() {
    this.onWheelChange();
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
    this.element = this.chartContainer.nativeElement;
    this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
    this.createColorScale();
    this.createCountryColorScale();
    this.createXScale();
    this.createYScale();
    this.createAgeScale();
    this.createSVG();
    this.createYAxis();
    this.createAgeAxis();
    this.addLegend();
    this.createCountryG();
    this.addCircle();
    this.addAvg();
    
 
  }

  private createSVG(): void {
    this.svg = d3.select(this.chartContainer.nativeElement)
        .append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom + this.heightLegend);

    this.svg.append('g')
        .attr('class', 'pictogram-g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
}

  private createXScale(): void {
      this.xScale = d3.scaleLinear()
          .domain([0, 26])
          .range([0, this.width]);
  }

  private createAgeScale(): void {
    this.ageScale = d3.scaleLinear()
                      .domain([16,40])
                      .range([0, this.width])
  }

  private createYScale(): void {
      this.yScale = d3.scaleBand()
          .domain(Object.keys(this.playerData))
          .range([0, this.height])
          .padding(0.2);
  }

  private createColorScale() : void {
    this.colorScale = d3.scaleOrdinal()
                        .domain(Object.keys(this.legendItems))
                        .range(Object.values(this.legendItems).map((d:any) => d.color))
  }
  private createCountryColorScale() : void {
    this.countryColorScale = d3.scaleOrdinal()
                        .domain(this.countries)
                        .range(this.colors)
  }

  private countClub(d) {
    const dplayers = this.playerData[d];
    const countTot = dplayers.length;
    const  countIn = dplayers.reduce((accumulator, player) => accumulator + (player['ClubInTop5']? 1 : 0), 0);
    const countOut = countTot - countIn

    return countIn.toString() + "/" + countOut.toString() + "(" + countTot.toString() + "}"
  }

  private createYAxis() : void {
    let yAxis = this.svg.append('g')
                        .attr('class','y-axis')
                        .attr('transform', `translate(${this.margin.left-20}, ${this.margin.top})`)
                        .call(d3.axisLeft(this.yScale).tickSize(0).tickSizeOuter(0));
        yAxis.selectAll("text")
              .attr("font-size", "16px")
              .attr("font-family", "Arial")
              .attr("color", (d:string) => this.countryColorScale(d))
              .on('mouseover', (event: MouseEvent, d: any) => {
                this.svg
                  .selectAll('.y-axis .tick')
                  .filter((node: any) => node === d)
                  .select('text')
                  .style('font-weight', 'bold');
                this.svg
                  .selectAll('.y-axis .tick')
                  .filter((node: any) => node !== d)
                  .select('text')
                  .attr('opacity', 0.5);
                this.svg
                  .selectAll('.player-circle')
                  .filter((node: any) => node['Country'] !== d)
                  .attr('opacity', 0.5);
                d3.select('#tooltip')
                  .style('opacity', 0.85)
                  .style('left', event.pageX - 55 + 'px')
                  .style('top', event.pageY - 75 + 'px')
                  .style('border', `2px solid ${this.countryColorScale(d.Country)}`)
                  .style('background-color', 'white')
                  .style('color', 'black')
                  .html(`
                    <div>
                      ${this.countClub(d)}
                    </div>
                  `);
              })
              .on('mouseout', (event: MouseEvent, d: any) => {
                this.svg
                  .selectAll('.y-axis .tick')
                  .filter((node: any) => node === d)
                  .select('text')
                  .style('font-weight', 'normal');
                  this.svg
                  .selectAll('.y-axis .tick')
                  .filter((node: any) => node !== d)
                  .select('text')
                  .attr('opacity',1)
                  this.svg
                  .selectAll('.player-circle')
                  .filter((node: any) => node['Country'] !== d)
                  .attr('opacity',1)
                d3.select('#tooltip')
                  .style('opacity',0)
              });
  }
  private createAgeAxis() : void {
    let xAxis = this.svg.append('g')
                        .attr('class','x-axis')
                        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
                        .attr("opacity",0)
                        .call(d3.axisTop(this.ageScale).ticks(5));
    var axisSize = xAxis.node().getBBox();

    xAxis.append("text")
      .attr("class", "axis-label")
      .attr("x", axisSize.width/2) // Adjust the x position of the label
      .attr("y", -30) // Adjust the y position of the label
      .style("text-anchor", "middle")
      .attr('fill', 'white')
      .text("Player Age (years old)");
    xAxis.selectAll("text")
          .attr('class','x-tick')
          .attr("font-size", "12px")
          .attr("font-family", "Arial")
          .attr("color", "white")
          .attr("opacity",0)
  }

  private createCountryG(): void {
      const data = Object.entries(this.playerData).map(([country, players]) => ({ country, players }));
      this.svg.select('.pictogram-g')
          .selectAll('g')
          .data(data)
          .join('g')
          .attr('class','country-g')
          .attr('transform', (d:any) => `translate(0, ${this.yScale(d.country)})`);
  }


  private addCircle(): void {
    this.svg.selectAll('.country-g')
    .selectAll('circle')
    .data((d: any) => d.players)
    .join('circle')
    .attr('class', 'player-circle')
    .attr('cx', (d: any, i: number) => this.xScale(i))
    .attr('cy', this.yScale.bandwidth() / 2)
    .attr('r', this.yScale.bandwidth() / 4)
    .attr('stroke-width', this.yScale.bandwidth() / 32)
    .attr('stroke', (d: any) => this.countryColorScale(d['Country']))
    .attr('fill', 'transparent')
    .attr('opacity', 1)
    .on('mouseover', (event: MouseEvent, d: any) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node === d['Country'])
        .select('text')
        .style('font-weight', 'bold');
      this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node !== d['Country'])
        .select('text')
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.player-circle')
        .filter((node: any) => node !== d)
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.legend-item')
        .filter((node: any) => (node[0]==='true') !== d["ClubInTop5"] || node[0]==='rect' )
        .attr('opacity',0.5)
      d3.select('#tooltip')
        .style('opacity', 0.85)
        .style('left', event.pageX - 55 + 'px')
        .style('top', event.pageY - 75 + 'px')
        .style('border', `2px solid ${this.countryColorScale(d.Country)}`)
        .style('background-color', this.colorScale(d['ClubInTop5']))
        .style('color', this.colorScale(d['ClubInTop5']) === "white" ? 'black' : 'white')
        .html(`
          <div>
            <p>${d['Player']} #${d['#']}</p>
            <p>Club: ${d['Club']}, ${d['ClubCountry']} </p>
            <p>Age: ${d['Age']}</p>
            <p>Field Position: ${d['Pos']}</p>
          </div>
        `);
    })    
    .on('mouseout', (event: MouseEvent, d: any) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node === d['Country'])
        .select('text')
        .style('font-weight', 'normal');
        this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node !== d['Country'])
        .select('text')
        .attr('opacity',1)
        this.svg
        .selectAll('.player-circle')
        .filter((node: any) => node !== d)
        .attr('opacity',1)
        this.svg
        .selectAll('.legend-item')
        .filter((node: any) => (node[0]==='true') !== d["ClubInTop5"] || node[0]==='rect' )
        .attr('opacity',1)
      d3.select('#tooltip')
        .style('opacity', 0)
    })
    let n = this.svg.selectAll('.country-g').selectAll('circle').size();

    this.svg.selectAll('.country-g')
    .selectAll('circle')
    .transition()
    .delay((d: any, i: number) => i * 40) // Incremental delay for cascading effect
    .attr('fill', (d: any) => this.colorScale(d['ClubInTop5']))
    .attr('opacity', 1)
    .on('end', () => {
      n--;  // Decrement transition counter
      if (n === 0 && this.toggle.checked) {  // All transitions ended
          this.orderByAge();
      }
  });

  }
  private addLegend(): void {
    let legend = this.svg.append('g')
                        .attr('class','legend-g')
      legend.selectAll('g')
      .data(Object.entries(this.legendItems))
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (d:any, i:number) => `translate(${this.margin.left},
         ${this.height + this.margin.top + this.heightLegend/2 + (i - 1.5)*this.yScale.bandwidth()})`);

    // Draw legend rectangles
    legend.selectAll('.legend-item')
      .filter((node:any) => node[0] === 'true' || node[0] === 'false' )
      .append('circle')
      .attr('cx', 0)
      .attr('r', this.yScale.bandwidth() / 4)
      .attr('stroke-width',this.yScale.bandwidth() / 16)
      .attr('stroke','#69f0ae')
      .style('fill', (d:any) => d[1].color);
    legend.selectAll('.legend-item')
      .filter((node:any) => node[0] === 'rect')
      .attr('id','avg-legend-item')
    legend.select('#avg-legend-item')
      .attr('opacity',0)
      .append('rect')
      .attr('x', -2)
      .attr('y',-this.yScale.bandwidth()/2)
      .attr('stroke','#69f0ae')
      .attr('strok-width',1)
      .attr('width', 4)
      .attr('height',this.yScale.bandwidth() )
      .style('fill', (d:any) => d[1].color);
      

    // Draw legend text
    legend.selectAll('.legend-item')
      .append('text')
      .attr('x',20)
      .attr('y',0)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .text((d:any) => d[1].text)
      .attr('fill','white')
      var textSize = Math.max(...legend.selectAll('.legend-item').nodes().map((item: any) => (item as SVGGElement).getBBox().width));
      console.log(textSize);
      legend
      .append('text')
      .attr('transform', () => `translate(${this.margin.left + textSize + 25},
        ${this.height + this.margin.top + this.heightLegend/2 - 0.5*this.yScale.bandwidth()})`)
      .text('by')
      .attr('fill','white')
      legend
      .append('text')
      .attr('transform', () => `translate(${this.margin.left + textSize + 50},
        ${this.height + this.margin.top + this.heightLegend/2 - 0.5*this.yScale.bandwidth()})`)
      .text('Team')
      .attr('fill','#69f0ae')

    
}

private average(numbers:any) {
  if (numbers.length === 0) {
    return 0; // Return 0 for an empty array or handle it as needed
  }

  const sum = numbers.reduce((total, number) => total + number, 0);
  const average = sum / numbers.length;

  return average;
};
private addAvg(): void {
  this.svg.selectAll('.country-g')
    .append('rect')
    .attr('class','country-avg')
    .attr('width',4)
    .attr('height',this.yScale.bandwidth() )
    .attr('x',(d:any) => this.ageScale(this.average(d.players.map(e => e['AgeInYear']))))
    .attr('stroke-width',1)
    .attr('stroke', (d:any)=>this.countryColorScale(d.country))
    .attr('opacity',0)
    .on('mouseover', (event: MouseEvent, d: any) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node === d.country)
        .select('text')
        .style('font-weight', 'bold');
      this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node !== d.country)
        .select('text')
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.player-circle')
        .filter((node: any) => node !== d)
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.legend-item')
        .filter((node: any) => node[0] !== 'rect')
        .attr('opacity', 0.5);
      d3.select('#tooltip')
        .style('opacity', 0.85)
        .style('left', event.pageX - 55 + 'px')
        .style('top', event.pageY - 75 + 'px')
        .style('border', `2px solid ${this.countryColorScale(d.country)}`)
        .style('background-color', 'black')
        .style('color', 'white')
        .html(`
          <div>
            <p>Average Age : ${this.convertAgeToYearsAndDays(this.average(d.players.map(e => e['AgeInYear'])))}</p>
          </div>
        `);
    })    
    .on('mouseout', (event: MouseEvent, d: any) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node === d.country)
        .select('text')
        .style('font-weight', 'normal');
        this.svg
        .selectAll('.y-axis .tick')
        .filter((node: any) => node !== d.country)
        .select('text')
        .attr('opacity',1)
        this.svg
        .selectAll('.player-circle')
        .filter((node: any) => node !== d)
        .attr('opacity',1)
        this.svg
        .selectAll('.legend-item')
        .filter((node: any) => node[0] !== 'rect')
        .attr('opacity', 1);
      d3.select('#tooltip')
        .style('opacity', 0)
    })
    
}
convertAgeToYearsAndDays(age) {
  const daysInYear = 365; // Compte tenu des années bissextiles
  
  const years = Math.floor(age);
  const days = Math.round((age - years) * daysInYear);
  const agestr = years.toString() + " years " + days.toString() + " days";
  return agestr;
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

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

interface LegendItem {
    type: string,
    color: string,
    text : string,
}
interface Team {
  name: string,
  rank : number,
  country : string,
}

interface Player {
  numero : number ,
  name: string,
  position : string,
  club : string,
  age : string,
  ageInYear : number,
  country : string,
  clubCountry : string,
  playsInTop25 : boolean,
}



@Component({
  selector: 'app-horizontal-pictogram',
  templateUrl: './horizontal-pictogram.component.html',
  styleUrls: ['./horizontal-pictogram.component.css']
})
export class HorizontalPictogramComponent implements OnInit, AfterViewInit {
  @ViewChild('pictogram') private chartContainer!: ElementRef;
  @ViewChild('hscroll') private hscroll!: ElementRef; 
  @ViewChild('toggle') private toggle!: MatSlideToggle; 

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
    // '#03a0c7',
    '#03a0c7',
    '#03a0c7',
    '#03a0c7',
    '#DB8500',
    '#DB8500',
    '#DB8500',
  ];
  public textColor = 'white'

  public legendItems: LegendItem[] = [
    {type: 'true' ,color: 'white',text:'Player plays in a club in the Top 5 of Top 5 european championship at the end of 2021-2022 season'},
    {type: 'false', color:'black',text:'Player plays in an other clubs'},
    {type: 'rect', color: 'black', text: 'Average player age'},
  ]
  private top25TeamNamesData : string[]= [];
  private playerData: {[country: string]: Player[]} = {};


  private element: any;
  private margin = { top: 50, right: 100, bottom: 20, left: 150 };
  private width: number = 0;
  private heightLegend: number = 150;
  private height: number = 500 - this.margin.top - this.margin.bottom - this.heightLegend;
  private ageAxisOffset = -30;
  private svg: any;
  private xScale: any;
  private yScale: any;
  private ageScale: any;
  private legendColorScale: any;
  private countryColorScale: any;
  private scrollingdown: boolean = false;
  private transitiondone: boolean = true;
  private transitionDuration: number = 1000;


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
        const data = await this.http.get('assets/Teams/' + csvFileName, {responseType: 'text'}).toPromise();
  
        let rows = data.split('\n').filter((row) => row.trim() !== '');
        let headers = rows[0].split(';').map((header) => header.replace('\r', '').trim());
        this.playerData[country] = [];
  
        for (let i = 1; i < rows.length; i++) {
          let cells = rows[i].split(';').map((row) => row.replace('\r', '').trim());
  
          let playerObject: Player = { // Initialize playerObject as an empty object
                                      numero: 0,
                                      name: '',
                                      position: '',
                                      club: '',
                                      age: '',
                                      ageInYear: 0,
                                      country: '',
                                      clubCountry : '',
                                      playsInTop25 : false,

                                    }; 
          headers.forEach((col, index) => {
            let playerCol: any;
            let focusedCol: boolean = true;
            switch (col) {
              case '#':
                playerCol = 'numero';
                break;
              case 'Player':
                playerCol = 'name';
                break;
              case 'Club':
                playerCol = 'club';
                break;
              case 'Age':
                playerCol = 'age';
                break;
              case 'Pos':
                playerCol = 'position';
                break;
              default:
                focusedCol = false;
            }
            if (focusedCol) {
              playerObject[playerCol] = cells[index]; // Assign value to mapped column name
            }
          });
          playerObject.country = country;
          this.playerData[country].push(playerObject);
        }
      }
    } catch (error) {
      console.error('An error occurred while loading player data:', error);
    }
  }
  
  

  // Preprocess age to correct shape
  // Player.age : string = ?? years ?? days
  // Player.ageInYear : number = ?? 
  cleanAge() {
    Object.keys(this.playerData).forEach((country) => {
      Object.values(this.playerData[country]).forEach((player: Player ) => {
        let ageParts = player.age.split('-');
        let years = parseInt(ageParts[0]);
        let days = parseInt(ageParts[1]);
        if (!isNaN(years) && !isNaN(days)) {
          let fractionOfYear = days / 365.25;
          let age = years + fractionOfYear;
          player.age = ageParts[0] + " years " + ageParts[1] + " days" ;
          player.ageInYear = age;
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
        this.playerData[country].forEach((player: Player) => {
            let playerPos = "";
            for(let pos of player.position.split(',')){
                playerPos += positionType[pos.trim()] || pos.trim();
                playerPos += ',';
            }
            player.position = playerPos.slice(0, -1); // Removes the trailing comma
        });
    });
}


  sanitize(str : string) {
    return str.trim().replace(/\s/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } 


  cleanClub() {
    Object.keys(this.playerData).forEach((country) => {
      this.playerData[country].forEach((player:  Player) => {
        let clubParts = player.club.split('\u00A0');
        let clubCountry = '';

        if (clubParts[0]) {
          let clubCountryParts = clubParts[0].split('.');
          if (clubCountryParts[1]) {
            clubCountry = clubCountryParts[1].toUpperCase();
          }
        }        
        let clubName = clubParts[1];
        player.club = this.sanitize(clubName);
        player.clubCountry = this.sanitize(clubCountry);
        player.playsInTop25 = this.top25TeamNamesData.includes(clubName);
      });
    });
  }

  
  // Load Championships data 
  // For each championship, extracts the name of its Top5 in 2021-2022 season
  async loadChampionships() {
    let championshipData: {[key: string]: string} = {};
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
        let teamNameIndex = headers.indexOf('Team');
        let rankIndex = headers.indexOf('Clt');
        if (teamNameIndex === -1 || rankIndex === -1) {
          console.error(`CSV file for ${championship} does not contain teamName and/or rank columns.`);
          continue;
        }

        // Extract name, and rank of the teams of the championship
        let teamData: Array<Team> = [];
        for (let i = 1; i < rows.length; i++) {
          let cells = rows[i].split(';');
          let teamName = cells[teamNameIndex];
          let teamRank = parseInt(cells[rankIndex]);
          if (teamName && !isNaN(teamRank)) {
            teamData.push({ name: teamName, rank: teamRank, country:""});
          }
        }
        // Sort by ascending rank
        teamData.sort((a, b) => a.rank - b.rank);

        // Extract top5
        let top5Teams = teamData.slice(0, 5);
        // Add them to the top25
        this.top25TeamNamesData = [...this.top25TeamNamesData, ...top5Teams.map((team:Team) => this.sanitize(team.name))];
  
      } catch (error) {
        console.error(`An error occurred while loading CSV file for ${championship}:`, error);
      }
    }
  }
  

  // Order the players
  // For each team, put player that plays in top 5 first, and sort them by club name 
  // inside each category
  orderPlayers(){
    this.playerData = Object.entries(this.playerData).reduce((acc: any, [country, players]: [string, any]) => {
      const sortedPlayers = Object.values(players).sort((a: any, b: any) => {
        if (a.playsInTop25 !== b.playsInTop25) {
          return b.playsInTop25 - a.playsInTop25; // Sort by 'ClubInTop5' in descending order
        }
        return a['Team'] - b['Team']; // Sort by 'Team' name in ascending order
      });
      return { ...acc, [country]: sortedPlayers };
    }, {});
  } 
  
  
  
  ngAfterViewInit() {
    // Listen to wheel event in the hscroll element
    this.renderer.listen(this.hscroll.nativeElement, 'wheel', (event) => {
    this.onWheelChange(event);})
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
    this.drawYAxis();
    this.drawAgeAxis();
    this.drawLegend();
    this.createCountryG();
    this.addCircle();
    this.addAvg();
    
 
  }
  // Create the svg and a g to draw the graph 
  private createSVG(): void {
    this.svg = d3.select(this.chartContainer.nativeElement)
        .append('svg')
        .attr('width', this.width + this.margin.left + this.margin.right)
        .attr('height', this.height + this.margin.top + this.margin.bottom + this.heightLegend);

    this.svg.append('g')
        .attr('class', 'pictogram-g')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
  }

  // Define xScale (in order by club state)
  private createXScale(): void {
    // Maximum number of player per team
    const maxNumPlayer = Math.max(...Object.values(this.playerData).map(array => array.length));
    this.xScale = d3.scaleLinear()
          .domain([0, maxNumPlayer])
          .range([0, this.width]);
  }

  // Define ageScale (in order by age state)
  private createAgeScale(): void {
    // Minimum age amongst players
    const minAgePlayer = Math.floor(Math.min(...Object.values(this.playerData)
                                                      .map(team => team.map(player => player.ageInYear))
                                                      .reduce((acc, val) => acc.concat(val), [])));
    // Maximum age amongst playerss
    const maxAgePlayer = Math.floor(Math.max(...Object.values(this.playerData)
                                                      .map(team => team.map(player => player.ageInYear))
                                                      .reduce((acc, val) => acc.concat(val), [])));
    this.ageScale = d3.scaleLinear()
                      .domain([minAgePlayer,maxAgePlayer])
                      .range([0, this.width])
  }

  // Define yScale
  private createYScale(): void {
      this.yScale = d3.scaleBand()
          .domain(Object.keys(this.playerData))
          .range([this.height, 0])
          .padding(0.2);
  }

  private createColorScale() : void {
    this.legendColorScale = d3.scaleOrdinal()
                        .domain(this.legendItems.map((item:LegendItem) => item.type))
                        .range(this.legendItems.map((item:LegendItem) => item.color))
  }
  private createCountryColorScale() : void {
    this.countryColorScale = d3.scaleOrdinal()
                        .domain(this.countries)
                        .range(this.colors)
  }

  private countClub(d) {
    const dplayers = this.playerData[d];
    const countTot = dplayers.length;
    const countIn = dplayers.reduce((accumulator, player) => accumulator + (player.playsInTop25? 1 : 0), 0);
    const countOut = countTot - countIn

    return countIn.toString() + "/" + countOut.toString() + "(" + countTot.toString() + "}"
  }

  private drawYAxis() : void {
    let yAxis = this.svg.append('g')
                        .attr('class','y-axis')
                        .attr('transform', `translate(${this.margin.left-20}, ${this.margin.top})`)
                        .call(d3.axisLeft(this.yScale).tickSize(0).tickSizeOuter(0));
        yAxis.selectAll("text")
              .attr("font-size", "15px")
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
                  .filter((node: any) => node['country'] !== d)
                  .attr('opacity', 0.5);
                d3.select('#tooltip')
                  .style('opacity', 0.85)
                  .style('left', event.pageX - 55 + 'px')
                  .style('top', event.pageY - 75 + 'px')
                  .style('border', `2px solid ${this.countryColorScale(d.country)}`)
                  .style('background-color', this.textColor)
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
                  .filter((node: any) => node['country'] !== d)
                  .attr('opacity',1)
                d3.select('#tooltip')
                  .style('opacity',0)
              });
  }
  private drawAgeAxis() : void {
    let xAxis = this.svg.append('g')
                        .attr('class','x-axis')
                        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
                        .attr("opacity",0)
                        .call(d3.axisTop(this.ageScale).ticks(5));
    var axisSize = xAxis.node().getBBox();

    xAxis.append("text")
      .attr("class", "axis-label")
      .attr("x", axisSize.width/2) 
      .attr("y", this.ageAxisOffset) 
      .style("text-anchor", "middle")
      .attr('fill', this.textColor)
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
    .data((team:any) => team.players)
    .join('circle')
    .attr('class', 'player-circle')
    .attr('cx', (player: Player, i: number) => this.xScale(i))
    .attr('cy', this.yScale.bandwidth() / 2)
    .attr('r', this.yScale.bandwidth() / 4)
    .attr('stroke-width', this.yScale.bandwidth() / 32)
    .attr('stroke', (player: Player) => this.countryColorScale(player.country))
    .attr('fill', 'black')
    .attr('opacity', 1)
    .on('mouseover', (event: MouseEvent, player: Player, i:number) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick === player.country)
        .select('text')
        .style('font-weight', 'bold');
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick !== player.country)
        .select('text')
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.player-circle')
        .filter((player2: Player) => player2 !== player)
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.legend-item')
        .filter((item: LegendItem) => (item.type==='true') !== player.playsInTop25 || item.type==='rect' )
        .attr('opacity',0.5)
      d3.select('#tooltip')
        .style('opacity', 0.85)
        .style('left', this.xScale(i - 1)  +  'px')
        .style('top', this.yScale(player.country) + 'px')
        .style('border', `2px solid ${this.countryColorScale(player.country)}`)
        .style('background-color', this.legendColorScale(player.playsInTop25))
        .style('color', this.legendColorScale(player.playsInTop25) === "white" ? 'black' : this.textColor)
        .html(`
          <div>
            <span style='font-weight:bold;font-size:15px'>${player.name}</span> #${player.numero}<br><br>
            <span style='font-weight:bold'>Club:</span> ${player.club}, ${player.clubCountry}<br>
            <span style='font-weight:bold'>Age:</span> ${player.age}<br>
            <span style='font-weight:bold'>Field Position:</span> ${player.position}<br>
          </div>
        `);
    })    
    .on('mouseout', (event: MouseEvent, player: Player) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick === player.country)
        .select('text')
        .style('font-weight', 'normal');
        this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick !== player.country)
        .select('text')
        .attr('opacity',1)
        this.svg
        .selectAll('.player-circle')
        .filter((player2: Player) => player2 !== player)
        .attr('opacity',1)
        this.svg
        .selectAll('.legend-item')
        .filter((item: LegendItem) => (item.type ==='true') !== player.playsInTop25 || item.type==='rect' )
        .attr('opacity',1)
      d3.select('#tooltip')
        .style('opacity', 0)
    })
    let n = this.svg.selectAll('.country-g').selectAll('circle').size();

    this.svg.selectAll('.country-g')
    .selectAll('circle')
    .transition()
    .delay((_: any, i: number) => i * 40) // Incremental delay for cascading effect
    .attr('fill', (player: Player) => this.legendColorScale(player.playsInTop25))
    .attr('opacity', 1)
    .on('end', () => {
      n--;  // Decrement transition counter
      if (n === 0 && this.toggle.checked) {  // All transitions ended
          this.orderByAge();
      }
  });

  }
  private drawLegend(): void {
    // Create a g for the legend
    let legend = this.svg.append('g')
                        .attr('class','legend-g');
      
    // For each item of the legend create a g          
    legend.selectAll('g')
    .data(this.legendItems)
    .join('g')
    .attr('class', 'legend-item')
    // Place it below the image
    .attr('transform', (d:any, i:number) => `translate(${this.margin.left},
        ${this.height + this.margin.top + this.heightLegend/2 + (i - 1.5)*this.yScale.bandwidth()})`);

    // Draw legend item colored rectangles for players in/out top25
    legend.selectAll('.legend-item')
      .filter((item:LegendItem) => item.type === 'true' || item.type === 'false' )
      .append('circle')
      .attr('cx', 0)
      .attr('r', this.yScale.bandwidth() / 4)
      .attr('stroke-width',this.yScale.bandwidth() / 16)
      .attr('stroke','#69f0ae')
      .style('fill', (item:LegendItem) => item.color)
      .attr("font-size", "12px")
      .attr("font-family", "Arial")
    // Draw 
    legend.selectAll('.legend-item')
      .filter((item:LegendItem) => item.type === 'rect')
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
      .style('fill', (item:LegendItem) => item.color);
      

    // Draw legend text
    legend.selectAll('.legend-item')
      .append('text')
      .attr('x',20)
      .attr('y',0)
      .attr('dy', '.35em')
      .style('text-anchor', 'start')
      .text((item:LegendItem) => item.text)
      .attr('fill',this.textColor)
      .attr("font-size", "12px")
      .attr("font-family", "Arial")
      var textSize = Math.max(...legend.selectAll('.legend-item').nodes().map((itemNode: SVGGElement) => itemNode.getBBox().width));

      legend
      .append('text')
      .attr('transform', () => `translate(${this.margin.left + textSize + 25},
        ${this.height + this.margin.top + this.heightLegend/2 - 0.5*this.yScale.bandwidth()})`)
      .text('by')
      .attr('fill',this.textColor)
      .attr("font-size", "12px")
      .attr("font-family", "Arial")
      legend
      .append('text')
      .attr('transform', () => `translate(${this.margin.left + textSize + 50},
        ${this.height + this.margin.top + this.heightLegend/2 - 0.5*this.yScale.bandwidth()})`)
      .text('Team')
      .attr('fill','#69f0ae')
      .attr("font-size", "12px")
      .attr("font-family", "Arial")

    
}

convertAgeToYearsAndDays(age) {
  const daysInYear = 365; // Compte tenu des années bissextiles
  
  const years = Math.floor(age);
  const days = Math.round((age - years) * daysInYear);
  const agestr = years.toString() + " years " + days.toString() + " days";
  return agestr;
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
    .attr('x',(team:any) => this.ageScale(this.average(team.players.map(player => player.ageInYear))))
    .attr('stroke-width',1)
    .attr('stroke', (team:any)=>this.countryColorScale(team.country))
    .attr('opacity',0)
    .on('mouseover', (event: MouseEvent, team: any) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick === team.country)
        .select('text')
        .style('font-weight', 'bold');
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick !== team.country)
        .select('text')
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.player-circle')
        // .filter((player: Player) => player.country !== i)
        .attr('opacity', 0.5);
      this.svg
        .selectAll('.legend-item')
        .filter((item: LegendItem) => item.type !== 'rect')
        .attr('opacity', 0.5);
      d3.select('#tooltip')
        .style('opacity', 0.85)
        .style('left', event.pageX - 55 + 'px')
        .style('top', event.pageY - 75 + 'px')
        .style('border', `2px solid ${this.countryColorScale(team.country)}`)
        .style('background-color', 'black')
        .style('color', this.textColor)
        .html(`
          <div>
            <p>Average Age : ${this.convertAgeToYearsAndDays(this.average(team.players.map(player => player.ageInYear)))}</p>
          </div>
        `);
    })    
    .on('mouseout', (event: MouseEvent, team: any) => {
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick === team.country)
        .select('text')
        .style('font-weight', 'normal');
        this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: any) => tick !== team.country)
        .select('text')
        .attr('opacity',1)
        this.svg
        .selectAll('.player-circle')
        // .filter((node: any) => node !== d)
        .attr('opacity',1)
        this.svg
        .selectAll('.legend-item')
        .filter((item: LegendItem) => item.type !== 'rect')
        .attr('opacity', 1);
      d3.select('#tooltip')
        .style('opacity', 0)
    })
    
}



 // Transition the graph its sorted by club ztate
// Place dots, hide age scale, hide average age bar and corresponding item legend
orderByClub() {
  this.transitiondone = false;
    // Place dots
    this.svg.selectAll('.country-g').selectAll('.player-circle')
      .transition()
      .duration(this.transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr('cx', (_: any, i: number) => this.xScale(i))
      .on('end', () => this.transitiondone = true);

    // Hide age scale
    this.svg.selectAll('.x-tick')
      .transition()
      .duration(this.transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr("opacity",0);

    this.svg.selectAll('.x-axis')
      .transition()
      .duration(this.transitionDuration)
      .ease(d3.easeCubicInOut)
      .attr("opacity",0);

    // Hide average age bar
    this.svg.selectAll('.country-avg')
            .transition()
            .duration(this.transitionDuration)
            .ease(d3.easeCubicInOut)
            .attr('opacity',0);

    // Hide average bar legend item
    this.svg.select('#avg-legend-item')
            .transition()
            .duration(this.transitionDuration)
            .ease(d3.easeCubicInOut)
            .attr('opacity',0);
  }

  // Transition the graph its sorted by age state
  // Place dots, show age scale, the average age bar and corresponding item legend
 orderByAge() {
  this.transitiondone = false;
  // Place dots
  this.svg.selectAll('.player-circle')
    .transition()
    .duration(this.transitionDuration)
    .ease(d3.easeCubicInOut)
    .attr('cx', (player: Player) => this.ageScale(player.ageInYear))
    .on('end', () => this.transitiondone = true);

  // Show Age Scale
  this.svg.selectAll('.x-tick')
    .transition()
    .duration(this.transitionDuration)
    .ease(d3.easeCubicInOut)
    .attr("opacity",1);

  this.svg.selectAll('.x-axis')
    .transition()
    .duration(this.transitionDuration)
    .ease(d3.easeCubicInOut)
    .attr("opacity",1);

  // Show average age bar
  this.svg.selectAll('.country-avg')
          .transition()
          .duration(this.transitionDuration)
          .ease(d3.easeCubicInOut)
          .attr('opacity',1);

  // Show average age legend item
  this.svg.select('#avg-legend-item')
          .transition()
          .duration(this.transitionDuration)
          .ease(d3.easeCubicInOut)
          .attr('opacity',1);
 } 

 
 // Call the toggle button changes state
 // Button check order by age, otherwise order by club
 onSlideToggleChange(event: any) {
  if (event.checked) {  
    this.orderByAge()

  } else {
    this.orderByClub()
  }
}

// Force change the toggle state 
changeToggle() {
  this.toggle.checked = !this.toggle.checked;  // Change the state of the toggle
  this.toggle.change.emit(  // Emit the change event manually
    new MatSlideToggleChange(
      this.toggle, 
      this.toggle.checked
    )
  );
}

  // Trigger when the event listener detect wheel change
  // If user is going dowm for the first time, force him to view the graph order
  // by age
  onWheelChange(event:WheelEvent) { 
      if (this.transitiondone) {
      if (event.deltaY < 0 && this.scrollingdown) {
        event.preventDefault();
        this.changeToggle();
        this.scrollingdown = false;
      }
    
      if (event.deltaY > 0 && !this.scrollingdown) {
        event.preventDefault();
        this.changeToggle();
        this.scrollingdown = true;
      }
    } else {
      event.preventDefault();
    }
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

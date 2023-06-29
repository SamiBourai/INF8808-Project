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

import {Team,Player,LegendItem} from 'src/models/interfaces/pictogram';


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
  /* Constants */
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

  public legendItems: LegendItem[] = [
    {type: 'true' ,color: 'white',text:'Player plays in a club in the Top 5 of Top 5 european championship at the end of 2021-2022 season'},
    {type: 'false', color:'black',text:'Player plays in an other clubs'},
    {type: 'rect', color: 'black', text: 'Average player age'},
  ]

  private  positionType: {[key: string]: any} = {
    'AT': 'Forward ',
    'MT': 'Midfielder',
    'DF': 'Defender ',
    'GB': 'Goalkeeper',
  }

  public colors: string[] = [
    '#e80284',
    '#03a0c7',
    '#03a0c7',
    '#03a0c7',
    '#DB8500',
    '#DB8500',
    '#DB8500',
  ];
  public defaultCircleColor : string = '#000000'
  public legendStrokeColor : string = '#69f0ae';
  public textColor = 'white'


  // Data 
  private top25TeamNamesData : string[]= [];
  private playerData: {[country: string]: Player[]} = {};
  private noPlayer:Player = { numero: 0,name: '',position: '',club: '',age: '',ageInYear: 0,
                            country: '', clubCountry: '', playsInTop25: false}

  // SVG Parameters
  private svg: any;
  private element: any;
  private margin = { top: 50, right: 100, bottom: 20, left: 150 };
  private width: number = 0;
  private heightLegend: number = 150;
  private height: number = 500 - this.margin.top - this.margin.bottom - this.heightLegend;
  private ageAxisOffset = -30;

  // D3 Elements and Parameters
  private xScale: any;
  private yScale: any;
  private ageScale: any;
  private legendColorScale: any;
  private countryColorScale: any;
  private scrollingdown: boolean = false;
  private transitiondone: boolean = true;
  private transitionDuration: number = 1000;
  private notFocusedOpacity: number = 0.3;



  constructor(private http: HttpClient, private renderer: Renderer2) { }
  
  // --------------------------------------------------------------------------//
  // --------------------------------------------------------------------------//
  // Init
  async ngOnInit(): Promise<void> {

    await this.loadPlayers();
    await this.loadChampionships();
    this.cleanPosition();
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

  // Clean Position format 
  cleanPosition() {
    Object.keys(this.playerData).forEach((country) => {
        this.playerData[country].forEach((player: Player) => {
            let playerPos = "";
            for(let pos of player.position.split(',')){
                playerPos += this.positionType[pos.trim()] || pos.trim();
                playerPos += ',';
            }
            player.position = playerPos.slice(0, -1); // Removes the trailing comma
        });
    });
}
  // Sanitize text
  // Trim, normalize space, ...
  sanitize(str : string) {
    return str.trim().replace(/\s/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } 

  // Clean club format (isolate club name and club country)
  // "1.it Parma" => Player.club = Parma
  //                 Player.clubCountry = IT
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
  


// --------------------------------------------------------------------------//
// --------------------------------------------------------------------------//
  // After Init
  ngAfterViewInit() {
    // Listen to wheel event in the hscroll element
    this.renderer.listen(this.hscroll.nativeElement, 'wheel', (event) => {
    this.onWheelChange(event);})
    this.observeChart();
  }
  
  // Check the element is on the screem
  // If intersecting, create the chart
  // Otherwise remove the chart
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

  // Event listener on windows risizing. 
  // If event occurs, delete and recreate the chart
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.removeChart()
    this.observer?.disconnect()
    this.observeChart()
  }

  // Create the chart
  // (Call the creation and drawing of all the elements that compose the SVG
  // Scale, Axis, Legend, Pictogramm ... )
  createChart(): void {
    this.element = this.chartContainer.nativeElement;
    this.width = this.element.offsetWidth - this.margin.left - this.margin.right;
    this.createLegendColorScale();
    this.createCountryColorScale();
    this.createXScale();
    this.createYScale();
    this.createAgeScale();
    this.createSVG();
    this.drawYAxis();
    this.drawAgeAxis();
    this.drawLegend();
    this.createCountryG();
    this.drawCircle();
    this.drawAvg();
    
 
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
          .range([0, this.height])
          .padding(0.2);
  }

  // Define the color scale for the graph
  private createLegendColorScale() : void {
    this.legendColorScale = d3.scaleOrdinal()
                        .domain(this.legendItems.map((item:LegendItem) => item.type))
                        .range(this.legendItems.map((item:LegendItem) => item.color))
  }

  // Define the color scale for the country color code
  private createCountryColorScale() : void {
    this.countryColorScale = d3.scaleOrdinal()
                        .domain(this.countries)
                        .range(this.colors)
  }

  private showYAxisTootltip(event:MouseEvent,country:string) {
    d3.select('#tooltip')
                  .style('opacity', 0.85)
                  .style('left', event.pageX - 55 + 'px')
                  .style('top', event.pageY - 75 + 'px')
                  .style('border', `2px solid ${this.countryColorScale(country)}`)
                  .style('background-color', this.textColor)
                  .style('color', 'black')
                  .html( () => {
                    const counts = this.countClub(country)
                    return `
                    <div>
                    <span style='font-weight:bold;font-size:15px;color:${this.countryColorScale(country)};'> ${country}</span><br><br>
                    <span style='font-weight:bold'>In Top 5's Top5 :</span> ${counts.in}<br>
                    <span style='font-weight:bold'>Not In Top 5's Top5 :</span> ${counts.out}<br>
                    <span style='font-weight:bold'>Total Players :</span> ${counts.total} <br>
                    </div>
                  `});
  }
  // Draw the y axis
  private drawYAxis() : void {
    let yAxis = this.svg.append('g')
                        .attr('class','y-axis')
                        .attr('transform', `translate(${this.margin.left-20}, ${this.margin.top})`)
                        .call(d3.axisLeft(this.yScale).tickSize(0).tickSizeOuter(0));
        yAxis.selectAll("text")
              .attr("font-size", "15px")
              .attr("font-family", "Arial")
              .attr("color", (d:string) => this.countryColorScale(d))
              .on('mouseover', (event: MouseEvent, country: string) => {
                this.highlightYAxis(country)
                const players: Player[] = Object.values(this.playerData)
                                        .reduce((acc : Player[], players: Player[]) => acc.concat(players), [])
                                        .filter((player:Player) => player.country === country); 
                this.highlightPlayer(players);  
                this.showYAxisTootltip(event,country);
              })
              .on('mouseout', (event: MouseEvent, country: string) => {
                this.unhighlightYAxis(country)
                const players: Player[] = Object.values(this.playerData)
                                        .reduce((acc : Player[], players: Player[]) => acc.concat(players), [])
                                        .filter((player:Player) => player.country === country); 
                this.unhighlightPlayer(players);
                this.hideToolTip();
              });
  }

  // Draw the age axis above the graph
  private drawAgeAxis() : void {
    let xAxis = this.svg.append('g')
                        .attr('class','x-axis')
                        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
                        .attr("opacity",0)
                        .call(d3.axisTop(this.ageScale).ticks(5));
    // Size of the axis
    const axisSize = xAxis.node().getBBox();

    // Place the title of the axi a thee center
    xAxis.append("text")
      .attr("class", "axis-label")
      .attr("x", axisSize.width/2) 
      .attr("y", this.ageAxisOffset) 
      .style("text-anchor", "middle")
      .attr('fill', this.textColor)
      .text("Player Age (years old)");
    // Initially set the opacity to 0, only appearing when toggle button is checked
    xAxis.selectAll("text")
          .attr('class','x-tick')
          .attr("font-size", "12px")
          .attr("font-family", "Arial")
          .attr("color", "white")
          .attr("opacity",0)
  }

  // Add a g to the pictogram for each country
  private createCountryG(): void {
      const data = Object.entries(this.playerData).map(([country, players]) => ({ country, players }));
      this.svg.select('.pictogram-g')
          .selectAll('g')
          .data(data)
          .join('g')
          .attr('class','country-g')
          // use yScale to place it
          .attr('transform', (d:any) => `translate(0, ${this.yScale(d.country)})`);
  }

  private highlightYAxis(country:string) {
    this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick === country)
        .select('text')
        .style('font-weight', 'bold');
      this.svg
        .selectAll('.y-axis .tick')
        .filter((tick: string) => tick !== country)
        .select('text')
        .attr('opacity', this.notFocusedOpacity);
  }
  private unhighlightYAxis(country:string) {
    this.svg
      .selectAll('.y-axis .tick')
      .filter((tick: string) => tick === country)
      .select('text')
      .style('font-weight', 'normal');
    this.svg
      .selectAll('.y-axis .tick')
      .filter((tick: string) => tick !== country)
      .select('text')
      .attr('opacity',1)
  };

  // Highlight Player by lowering opacity of not focused player
  private highlightPlayer(players:Player[]) {
    this.svg
        .selectAll('.player-circle')
        .filter((player2: Player) => !players.includes(player2))
        .attr('opacity', this.notFocusedOpacity);
  };

  private unhighlightPlayer(players:Player[]) {
    this.svg
        .selectAll('.player-circle')
        .filter((player2: Player) => !players.includes(player2))
        .attr('opacity', 1);
  };

  private highlightAvg(country:string) {
    this.svg.selectAll('.country-avg')
            .filter((team:Team) => team.country !== country)
            .attr('opacity', this.notFocusedOpacity)
  }

  private unhighlightAvg(country:string) {
    this.svg.selectAll('.country-avg')
            .filter((team:Team) => team.country !== country)
            .attr('opacity', 1)
  }



  private highlightLegendItem(type:string) {

    this.svg
      .selectAll('.legend-item')
      .filter((item: LegendItem) => item.type !== type)
      .attr('opacity',this.notFocusedOpacity) 
    if (!this.toggle.checked) { 
      this.svg
      .selectAll('#avg-legend-item')
      .attr('opacity',0) 
    }
  };
  private unhighlightLegendItem(type:string) {
    this.svg
      .selectAll('.legend-item')
      .filter((item: LegendItem) => this.toggle.checked?item.type !== type:!['rect',item.type].includes(type))
      .attr('opacity',1) 
    if (!this.toggle.checked) { 
      this.svg
      .selectAll('#avg-legend-item')
      .attr('opacity',0) 
    }
    
  };

  private showTootltip(e:MouseEvent,player:Player) {
      d3.select('#tooltip')
        .style('opacity', 0.85)
        .style('left', e.pageX - 55 + 'px')
        .style('top', e.pageY - 75 + 'px')
        .style('border', `2px solid ${this.countryColorScale(player.country)}`)
        .style('background-color', this.legendColorScale(player.playsInTop25))
        .style('color', this.legendColorScale(player.playsInTop25) === "white" ? 'black' : this.textColor)
        .html(`
          <div>
            <span style='font-weight:bold;font-size:15px;'>${player.name}</span> #${player.numero}</span><br><br>
            <span style='font-weight:bold'>Club:</span> ${player.club}, ${player.clubCountry}<br>
            <span style='font-weight:bold'>Age:</span> ${player.age}<br>
            <span style='font-weight:bold'>Field Position:</span> ${player.position}<br>
          </div>
        `)
  }

  private hideToolTip() {
    d3.select('#tooltip')
    .style('opacity', 0)
  }
  // Draw the circle representing the data
  private drawCircle(): void {
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
    .attr('fill', this.defaultCircleColor)
    .attr('opacity', 1)
    .on('mouseover', (event: MouseEvent, player: Player, i:number) => {
      this.highlightYAxis(player.country);
      this.highlightPlayer([player]);
      player.playsInTop25 ? this.highlightLegendItem('true') : this.highlightLegendItem('false')
      this.showTootltip(event,player);
    })    
    .on('mouseout', (event: MouseEvent, player: Player) => {
      this.unhighlightYAxis(player.country)
      this.unhighlightPlayer([player]);
      player.playsInTop25 ? this.unhighlightLegendItem('true') : this.unhighlightLegendItem('false')
      this.hideToolTip();
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
    
    // Draw legend for the colored dot items of the legend
    legend.selectAll('.legend-item')
      .filter((item:LegendItem) => item.type === 'true' || item.type === 'false' )
      // Add mouseover/mouseout highlighting 
      .on("mouseover", (event:any,item:LegendItem) => {
        const players: Player[] = Object.values(this.playerData)
                                        .reduce((acc : Player[], players: Player[]) => acc.concat(players), [])
                                        .filter((player:Player) => player.playsInTop25 === (item.type === 'true')); 
        this.highlightPlayer(players);  
        this.highlightLegendItem(item.type);
      })
      .on("mouseout", (event:any,item:LegendItem) => {
        const players: Player[] = Object.values(this.playerData)
                                        .reduce((acc : Player[], players: Player[]) => acc.concat(players), [])
                                        .filter((player:Player) => player.playsInTop25 === (item.type === 'true')); 
        this.unhighlightPlayer(players);  
        this.unhighlightLegendItem(item.type);
  
      })
    // Draw circles 
      .append('circle')
      .attr('cx', 0)
      .attr('r', this.yScale.bandwidth() / 4)
      .attr('stroke-width',this.yScale.bandwidth() / 16)
      .attr('stroke',this.legendStrokeColor)
      .style('fill', (item:LegendItem) => item.color)
      .attr("font-size", "12px")
      .attr("font-family", "Arial")
    
      // Draw legend item colored rectangle for age average for each team
    legend.selectAll('.legend-item')
      .filter((item:LegendItem) => item.type === 'rect')
      .attr('id','avg-legend-item')
      .attr('opacity',0)
      .on("mouseover", (event:any,item:LegendItem) => {
        if (this.toggle.checked) {
        this.highlightPlayer([]);  
        this.highlightLegendItem(item.type);
      }

      })
      // Add mouseover/mouseout highlighting 
      .on("mouseout", (event:any,item:LegendItem) => {
        if (this.toggle.checked) {
          this.unhighlightPlayer([]);  
          this.unhighlightLegendItem(item.type);
        }
      })
      .append('rect')
      .attr('x', -2)
      .attr('y',-this.yScale.bandwidth()/2)
      .attr('stroke',this.legendStrokeColor)
      .attr('strok-width',1)
      .attr('width', 4)
      .attr('height',this.yScale.bandwidth() )
      .style('fill', (item:LegendItem) => item.color)
      

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
      .attr('fill',this.legendStrokeColor)
      .attr("font-size", "12px")
      .attr("font-family", "Arial")

    
}

private showAvgTooltip(event:MouseEvent,team:any) {
  d3.select('#tooltip')
        .style('opacity', 0.85)
        .style('left', event.pageX + 100 + 'px')
        .style('top', event.pageY + 100 + 'px')
        .style('border', `2px solid ${this.countryColorScale(team.country)}`)
        .style('background-color', 'black')
        .style('color', this.textColor)
        .html(`
          <div>
            <span style='font-weight:bold'>Average Age :</span> ${this.convertAgeToYearsAndDays(this.average(team.players.map(player => player.ageInYear)))}
          </div>
        `);
}

private drawAvg(): void {
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
      if (this.toggle.checked) {
        this.highlightYAxis(team.country);
        this.highlightPlayer([]);
        this.highlightAvg(team.country);
        this.highlightLegendItem('rect');
        this.showAvgTooltip(event,team);
      }
    })    
    .on('mouseout', (event: MouseEvent, team: any) => {
      if (this.toggle.checked) {
        this.unhighlightYAxis(team.country);
        this.unhighlightPlayer([]);
        this.unhighlightAvg(team.country);
        this.unhighlightLegendItem('rect');
        this.hideToolTip();
      }
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
// ----------------------------------------------------------------------------//
// Util functinos //
// Convert numerical age in years + 
convertAgeToYearsAndDays(age:number) {
  const daysInYear = 365; // Compte tenu des années bissextiles
  
  const years = Math.floor(age);
  const days = Math.round((age - years) * daysInYear);
  const agestr = years.toString() + " years " + days.toString() + " days";
  return agestr;
}

 // Count the number of players in each group
 private countClub(d) {
  const dplayers = this.playerData[d];
  const countTot = dplayers.length;
  const countIn = dplayers.reduce((accumulator, player) => accumulator + (player.playsInTop25? 1 : 0), 0);
  const countOut = countTot - countIn

  return {in:countIn, out:countOut,total:countTot}
}

private average(numbers:any) {
  if (numbers.length === 0) {
    return 0; // Return 0 for an empty array or handle it as needed
  }

  const sum = numbers.reduce((total, number) => total + number, 0);
  const average = sum / numbers.length;

  return average;
};



}

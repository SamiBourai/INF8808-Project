import { gridPlaceData } from 'src/models/interfaces/grid';
import { Team } from 'src/models/interfaces/parallel';
import * as d3 from 'd3';




const COLORS_COUNTRIES: {[country:string]:string}= {
  Morocco:'#e80284',
  Argentina:'#03a0c7',
  France:'#03a0c7',
  Croatia:'#03a0c7',
  Senegal:'#DB8500',
  Tunisia:'#DB8500',
  Ghana:'#DB8500',
};

export const COUNTRIES: string[] = [
  'Morocco',
  'Argentina',
  'France',
  'Croatia',
  'Senegal',
  'Tunisia',
  'Ghana',
];

export const COUNTRIES_TOP4: string[] = [
  'Morocco',
  'Argentina',
  'France',
  'Croatia',
];

export const COUNTRY_COLOR_SCALE = d3.scaleOrdinal()
                                      .domain(Object.keys(COLORS_COUNTRIES))
                                      .range(Object.values(COLORS_COUNTRIES));



// PARAMETER CONSTANTS
export const NOT_FOCUSED_OPACITY: number = 0.3;
export const NOM_PAYS_FONTSIZE: number = 15;
export const CHART_POLICE: string = 'Arial';



// DATA                                  
export const POSSESSION_CHART_DATA: number[] = [
  37, 66.6, 58.6, 54, 46.6, 43.3, 42,
];




export const POSSESSION_DATA_TOP3: number[] = [39, 51.3, 56.5, 54.3];

export const GRID_PLACE: gridPlaceData[] = [
  { country: 'Morocco', gridplace: 2 },
  { country: 'Argentina', gridplace: 4 },
  { country: 'France', gridplace: 5 },
  { country: 'Croatia', gridplace: 6 },
  { country: 'Senegal', gridplace: 7 },
  { country: 'Tunisia', gridplace: 8 },
  { country: 'Ghana', gridplace: 9 },
];

export const TEAM_STATS: Team[] = [
{
  country: 'Senegal',
  pass: 327.5,
  goal: 5,
  recup:48,
  tacles:3,
  intercep:7.75
},
{
  country: 'Ghana',
  pass: 324.0,
  goal: 5,
  recup:48.7,
  tacles:11.3,
  intercep:6.33
},
{
  country: 'France',
  pass: 448.9,
  goal: 16,
  recup:49.9,
  tacles:12.1,
  intercep:10.4
},
{
  country: 'Morocco',
  pass: 311.0,
  goal: 6,
  recup:50.5,
  tacles:10.8,
  intercep:9.32
},
{
  country: 'Croatia',
  pass: 489.1,
  goal: 5,
  recup:53.1,
  tacles:10.8,
  intercep:6.88
},
{
  country: 'Argentina',
  pass: 507.9,
  goal: 15,
  recup:46.4,
  tacles:8.96,
  intercep:6.75
}, {
  country: 'Tunisia',
  pass: 332.7,
  goal: 1,
  recup:56.7,
  tacles:8,
  intercep:8.33
}
]

export const WAFFLE_FIELD_COLORS: { [key: string]: string } = {
  defense: '#21A179',
  middle: '#1481BA',
  attack: '#F3535B',
};


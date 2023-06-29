export interface LegendItem {
    type: string,
    color: string,
    text : string,
}
export interface Team {
  name: string,
  rank : number,
  country : string,
}

export interface Player {
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

export interface Data {
    [key: string]: {
      color: string;
      values: {
        passes: number;
        shots: number;
        occasions: number;
      };
    };
}

export interface LegendData {
    [key: string]: {
      label: string;
      fill: string;
      tooltipLabel: string;
    };
}
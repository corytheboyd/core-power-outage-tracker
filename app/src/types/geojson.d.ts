interface Base {
  type: string;
}

export interface Point extends Base {
  type: "Point";
  /**
   * (longitude, latitude)
   * */
  coordinates: [number, number];
}

namespace geojson {
  interface Base {
    type: string;
  }

  interface Point extends Base {
    type: "Point"
    /**
     * (longitude, latitude)
     * */
    coordinates: [number, number]
  }
}

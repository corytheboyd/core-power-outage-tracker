# Core Electric Cooperative Outage Tracker

## Address data

Colorado publishes it: 
- [Download link here](https://geodata.colorado.gov/datasets/5adef0b3cdce44c5925be0f6e2c0e3d7_0)
    - You have to filter it down to download it, there is a 2GB limit
      - Use ZIP codes from core map https://oms.core.coop/
      
```js
data = await (await fetch("https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER")).json()
zipCodes = data.reportData.reports[1].polygons.map(p => p.name)
//=> [
//     "80015",
//     "80016",
//     "80102",
//     "80103",
//     "80104",
//     "80105",
//     "80106",
//     "80107",
//     "80108",
//     "80109",
//     "80112",
//     "80116",
//     "80117",
//     "80118",
//     "80125",
//     "80127",
//     "80131",
//     "80132",
//     "80133",
//     "80134",
//     "80135",
//     "80136",
//     "80137",
//     "80138",
//     "80401",
//     "80421",
//     "80425",
//     "80432",
//     "80433",
//     "80439",
//     "80440",
//     "80448",
//     "80449",
//     "80452",
//     "80456",
//     "80465",
//     "80470",
//     "80475",
//     "80642",
//     "80643",
//     "80813",
//     "80814",
//     "80816",
//     "80819",
//     "80820",
//     "80827",
//     "80863",
//     "80921",
//     "81211",
//     "81212"
// ]
```

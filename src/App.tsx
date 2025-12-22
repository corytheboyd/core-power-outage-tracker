import "./App.css";
import { useEffect } from "react";
import * as zip from "@zip.js/zip.js";
import * as shapefile from "shapefile";

function App() {
  useEffect(() => {
    const filePath = "/data/Colorado_Public_Address_Composite.zip";
    fetch(filePath).then((r) =>
      r.blob().then((b) => {
        const blobReader = new zip.BlobReader(b);
        const zipReader = new zip.ZipReader(blobReader);

        zipReader
          .getEntries()
          .then((entries) => {
            const entry = entries
              .filter((e) => !e.directory)
              .find((e) => e.filename.endsWith(".shp"));
            if (!entry) {
              throw new Error("File not found");
            }
            return entry;
          })
          .then((entry) => {
            return entry.getData(new zip.Uint8ArrayWriter());
          })
          .then((buffer) => {
            shapefile.open(buffer).then((source) => {
              source.read().then(
                // @ts-ignore
                function log(result) {
                  if (result.done) return;
                  // console.log(result.value);
                  return source.read().then(log);
                },
              );
            });
          });
      }),
    );
  }, []);

  return (
    <>
      <h1>Core Power Outage Tracker</h1>
    </>
  );
}

export default App;

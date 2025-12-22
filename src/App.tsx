import "./App.css";
import { useShapefileWorker } from "./hooks/useShapefileWorker";
import { Search } from "./components/Search";

function App() {
  const { status, progress, error, totalFeatures, search, searchResults } =
    useShapefileWorker("/data/Colorado_Public_Address_Composite.zip");

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Core Power Outage Tracker</h1>
        <p>{progress.stage}...</p>
        <progress value={progress.loaded} max={progress.total} />
      </div>
    );
  }

  return (
    <Search
      totalFeatures={totalFeatures}
      searchResults={searchResults}
      onSearch={search}
    />
  );
}

export default App;

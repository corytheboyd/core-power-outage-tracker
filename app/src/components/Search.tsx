import { useState } from "react";

interface SearchProps {
  totalFeatures: number;
  searchResults: GeoJSON.Feature[];
  onSearch: (query: string) => void;
}

export function Search({ totalFeatures, searchResults, onSearch }: SearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Core Power Outage Tracker</h1>
      {/*<p>Total addresses loaded: {totalFeatures.toLocaleString()}</p>*/}

      <form onSubmit={handleSearch} style={{ marginTop: "1rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address, city, zip code..."
          style={{
            padding: "0.5rem",
            fontSize: "1rem",
            width: "100%",
            maxWidth: "500px",
            marginRight: "0.5rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            marginTop: "0.5rem",
          }}
        >
          Search
        </button>
      </form>

      {searchResults.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>
            Results ({searchResults.length}
            {searchResults.length === 100 ? "+" : ""})
          </h2>
          <div
            style={{
              maxHeight: "600px",
              overflow: "auto",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "#f5f5f5" }}>
                <tr>
                  {searchResults[0]?.properties &&
                    Object.keys(searchResults[0].properties).map((key) => (
                      <th
                        key={key}
                        style={{
                          padding: "0.5rem",
                          textAlign: "left",
                          borderBottom: "2px solid #ccc",
                        }}
                      >
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {searchResults.map((feature, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    {feature.properties &&
                      Object.values(feature.properties).map((value, i) => (
                        <td key={i} style={{ padding: "0.5rem" }}>
                          {String(value)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

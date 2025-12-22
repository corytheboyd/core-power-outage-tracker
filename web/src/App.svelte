<script lang="ts">
  import { onMount } from "svelte";
  import { initDuckDB, checkOutage } from "./duckdb";

  let addressQuery = $state("");
  let loading = $state(false);
  let results = $state<any>(null);
  let error = $state("");
  let dbReady = $state(false);

  onMount(async () => {
    try {
      await initDuckDB();
      dbReady = true;
      console.log("CORE Power Outage Checker ready!");
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Failed to initialize database";
    }
  });

  async function handleSearch() {
    const query = addressQuery.trim();

    if (!query) {
      error = "Please enter an address to search";
      return;
    }

    if (!dbReady) {
      error = "Database is still loading, please wait...";
      return;
    }

    loading = true;
    error = "";
    results = null;

    try {
      results = await checkOutage(query);
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }
</script>

<div class="container">
  <h1>CORE Power Outage Checker</h1>
  <p class="subtitle">Check if your address is affected by a power outage</p>

  <div class="search-box">
    <input
      type="text"
      bind:value={addressQuery}
      onkeypress={handleKeyPress}
      placeholder="Enter street address (e.g., 44 Hy-Vu Dr)"
      autocomplete="off"
      disabled={!dbReady}
    />
    <button onclick={handleSearch} disabled={!dbReady || loading}>
      {loading ? "Checking..." : "Check Outage"}
    </button>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Checking for outages...</p>
    </div>
  {/if}

  {#if error}
    <div class="error">
      {error}
    </div>
  {/if}

  {#if results && !loading}
    {#if !results.found}
      <div class="error">
        No addresses found matching your search. Please try a different address.
      </div>
    {:else}
      {#each results.addresses as addr}
        {#if addr.hasOutage}
          <div class="result-card has-outage">
            <div class="result-title">⚠️ Outage Detected</div>
            <div class="result-details">
              <p>
                <strong>Address:</strong>
                {addr.street}, {addr.city}, CO {addr.zip}
              </p>
              <p>
                <strong>Distance to outage:</strong>
                {addr.outageDetails.distanceMiles !== null
                  ? `${(addr.outageDetails.distanceMiles * 5280).toFixed(0)} feet`
                  : "N/A"}
              </p>
              <p>
                Your address is within 450 feet of a power line currently
                experiencing an outage.
              </p>
            </div>
          </div>
        {:else}
          <div class="result-card no-outage">
            <div class="result-title">✓ No Outage</div>
            <div class="result-details">
              <p>
                <strong>Address:</strong>
                {addr.street}, {addr.city}, CO {addr.zip}
              </p>
              <p>No power outages detected within 450 feet of this address.</p>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  {/if}
</div>

<style>
  .container {
    max-width: 600px;
    width: 100%;
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  h1 {
    font-size: 2rem;
    color: #333;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #666;
    margin-bottom: 30px;
  }

  .search-box {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
  }

  input {
    flex: 1;
    padding: 12px 16px;
    font-size: 16px;
    border: 2px solid #ddd;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.3s;
  }

  input:focus {
    border-color: #667eea;
  }

  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  button {
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: #667eea;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
  }

  button:hover:not(:disabled) {
    background: #5568d3;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .loading {
    text-align: center;
    padding: 40px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 16px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .result-card {
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .no-outage {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  .has-outage {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .result-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .result-details {
    line-height: 1.6;
  }

  .result-details strong {
    display: inline-block;
    min-width: 140px;
  }

  .error {
    padding: 16px;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    color: #856404;
  }
</style>

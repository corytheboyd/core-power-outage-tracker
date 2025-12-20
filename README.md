# Core Electric Cooperative Outage Checker

A simple CLI tool to check power outage status for Core Electric Cooperative without opening a browser.

## Quick Start

```bash
# Check system-wide outage status
node check-outage.js

# Check your specific zip code
node check-outage.js 80421
```

## Setup

This project uses Nix flakes and direnv for environment management:

```bash
# Allow direnv (if not already done)
direnv allow

# Node.js will be automatically available
node --version
```

## Example Output

### System-wide status:
```
📊 CORE ELECTRIC SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Accounts: 182,660
Affected: 8,551 (4.68%)
Active Outages: 71
Crews Deployed: 4
Oldest Outage: 12/17/2025, 1:04:03 PM

🔴 AFFECTED ZIP CODES (15 total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 80421    -  3478 out (73.5% of 4733)
🟠 80439    -  1645 out (72.7% of 2264)
...
```

### Specific zip code check:
```
✅ POWER ON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zip Code: 80134
Total Accounts: 30,928
Affected: 0 (0%)
Status: Power is ON in your area
```

## How It Works

- **API**: `https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER`
- **Updates**: Data refreshes every 60 seconds on the Core Electric servers
- **Coverage**: Supports all Core Electric service areas in Colorado
- **Data**: Shows outages by County, Zip Code, District, and Service Area

## Web Alternative

Visit https://oms.core.coop/ to view the interactive map

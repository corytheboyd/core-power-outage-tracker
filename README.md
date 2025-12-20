# Core Electric Cooperative Outage Checker

A CLI tool and web application to check power outage status for Core Electric Cooperative.

## Web Version

Open `index.html` in your browser or host it anywhere (GitHub Pages, Netlify, Vercel, etc.)

**Features:**
- 🔍 Search by full address (e.g., "123 Main St, Conifer, CO 80433")
- 📊 View system-wide outage status
- 🔴 See all affected areas sorted by severity
- 🔄 Auto-refresh every 60 seconds (optional)
- 📱 Mobile-friendly responsive design
- 🗺️ Geocoding powered by OpenStreetMap (no API key required)

## CLI Version

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

## Deployment

The web version (`index.html`) is a single static HTML file with no dependencies. Deploy it anywhere:

### GitHub Pages
1. Push to GitHub
2. Go to Settings → Pages
3. Select the branch and root folder
4. Your site will be live at `https://username.github.io/repo-name/`

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

### Simple HTTP Server (Local Testing)
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

Then visit `http://localhost:8000`

## Official Map

Visit https://oms.core.coop/ to view Core Electric's official outage map

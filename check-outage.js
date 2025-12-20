#!/usr/bin/env node

/**
 * Core Electric Cooperative Outage Checker
 * Checks if there's a power outage for a specific address or zip code
 */

const https = require('https');

const OUTAGE_API = 'https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER';

/**
 * Fetch outage data from Core Electric API
 */
function fetchOutageData() {
  return new Promise((resolve, reject) => {
    https.get(OUTAGE_API, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse API response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Check outage status for a specific zip code
 */
function checkZipCode(outageData, zipCode) {
  const zipReport = outageData.reportData.reports.find(r => r.id === 'Zip');
  if (!zipReport) {
    return null;
  }

  const area = zipReport.polygons.find(p => p.name === zipCode);
  return area || null;
}

/**
 * Get overall summary
 */
function getSummary(outageData) {
  return outageData.reportData.summary;
}

/**
 * Format outage info for display
 */
function formatOutageInfo(area) {
  if (!area) {
    return 'Zip code not found in service area';
  }

  const status = area.affected > 0 ? '🔴 OUTAGE DETECTED' : '✅ POWER ON';
  const lines = [
    `\n${status}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Zip Code: ${area.name}`,
    `Total Accounts: ${area.accounts.toLocaleString()}`,
    `Affected: ${area.affected.toLocaleString()} (${area.percentAffected}%)`,
  ];

  if (area.affected > 0) {
    if (area.crewCount) {
      lines.push(`Crews Working: ${area.crewCount}`);
    }
    lines.push(`Status: Power is currently OUT for ${area.affected} customers`);
  } else {
    lines.push(`Status: Power is ON in your area`);
  }

  return lines.join('\n');
}

/**
 * Format system-wide summary
 */
function formatSummary(summary) {
  const lines = [
    `\n📊 CORE ELECTRIC SYSTEM STATUS`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Total Accounts: ${summary.accounts.toLocaleString()}`,
    `Affected: ${summary.affected.toLocaleString()} (${summary.percentAffected.toFixed(2)}%)`,
    `Active Outages: ${summary.outages}`,
    `Crews Deployed: ${summary.crewCount}`,
  ];

  if (summary.outageStart) {
    const startDate = new Date(summary.outageStart);
    lines.push(`Oldest Outage: ${startDate.toLocaleString()}`);
  }

  return lines.join('\n');
}

/**
 * List all affected areas
 */
function listAffectedAreas(outageData) {
  const zipReport = outageData.reportData.reports.find(r => r.id === 'Zip');
  if (!zipReport) return;

  const affected = zipReport.polygons
    .filter(p => p.affected > 0)
    .sort((a, b) => b.percentAffected - a.percentAffected);

  if (affected.length === 0) {
    console.log('\n✅ No outages reported');
    return;
  }

  console.log(`\n🔴 AFFECTED ZIP CODES (${affected.length} total):`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  affected.forEach(area => {
    const severity = area.percentAffected === 100 ? '🔴' :
                     area.percentAffected > 50 ? '🟠' :
                     area.percentAffected > 10 ? '🟡' : '🟢';
    console.log(
      `${severity} ${area.name.padEnd(8)} - ${area.affected.toString().padStart(5)} out ` +
      `(${area.percentAffected.toFixed(1)}% of ${area.accounts})`
    );
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  try {
    const data = await fetchOutageData();
    const summary = getSummary(data);

    // If no args, show summary
    if (args.length === 0) {
      console.log(formatSummary(summary));
      listAffectedAreas(data);
      console.log('\nUsage: node check-outage.js [ZIP_CODE]');
      console.log('Example: node check-outage.js 80421\n');
      return;
    }

    // Check specific zip code
    const zipCode = args[0];
    const area = checkZipCode(data, zipCode);
    console.log(formatOutageInfo(area));

  } catch (error) {
    console.error('Error fetching outage data:', error.message);
    process.exit(1);
  }
}

main();

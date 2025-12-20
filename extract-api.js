// Run this in browser console on https://oms.core.coop/
// This will extract the actual API endpoints being used

console.log('=== Core Electric Outage API Extractor ===\n');

// Wait for page to fully load
setTimeout(() => {
  try {
    // Try to get the config object
    if (typeof config !== 'undefined') {
      console.log('Configuration found:');
      console.log('Outage URL:', config.outageURL);
      console.log('Crew URL:', config.crewURL);
      console.log('Check for Update URL:', config.checkForUpdateURL);
      console.log('Refresh Interval:', config.refreshInterval, 'ms');
      console.log('\nFull config:', JSON.stringify(config, null, 2));
    }

    // Try to get the dataset object
    if (typeof dataset !== 'undefined') {
      console.log('\nDataset object found');
      console.log('Dataset config:', dataset.config);
    }

    // Intercept XHR requests to capture API calls
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalFetch = window.fetch;

    console.log('\n=== Monitoring API Calls ===');
    console.log('(Refresh the page or wait for auto-refresh)\n');

    XMLHttpRequest.prototype.open = function(method, url) {
      if (url.includes('outage') || url.includes('api')) {
        console.log('XHR:', method, url);
      }
      return originalOpen.apply(this, arguments);
    };

    if (originalFetch) {
      window.fetch = function(url, options) {
        if (url.includes('outage') || url.includes('api')) {
          console.log('Fetch:', options?.method || 'GET', url);
        }
        return originalFetch.apply(this, arguments);
      };
    }

  } catch (e) {
    console.error('Error extracting config:', e);
  }
}, 3000);

// Also capture jQuery AJAX calls
setTimeout(() => {
  if (typeof $ !== 'undefined' && $.ajax) {
    const originalAjax = $.ajax;
    $.ajax = function(url, options) {
      if (typeof url === 'string' && (url.includes('outage') || url.includes('api') || url.includes('data'))) {
        console.log('jQuery AJAX:', url, options);
      } else if (typeof url === 'object') {
        console.log('jQuery AJAX:', url.url, url);
      }
      return originalAjax.apply(this, arguments);
    };
  }
}, 3000);

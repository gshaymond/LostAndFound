const http = require('http');
const https = require('https');

const urlArg = process.argv[2];
const port = process.env.PORT || 5000;
const url = urlArg || process.env.HEALTH_URL || `http://localhost:${port}/api/health`;

const maxAttempts = 10;
const delayMs = 1000;

function get(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(parsed, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.abort();
        reject(new Error('Request timed out'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

(async function () {
  console.log(`Checking health endpoint: ${url}`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { statusCode, body } = await get(url);
      if (statusCode >= 200 && statusCode < 300) {
        try {
          const json = JSON.parse(body || '{}');
          // Verify database health reported in JSON response
          const db = json.db || {};
          if (db.status === 'ok' && db.state === 1) {
            console.log('Health OK:', json);
            process.exit(0);
          } else {
            console.error('Health endpoint returned OK status but reported unhealthy DB:', json);
            // continue retrying
          }
        } catch (e) {
          console.log('Health returned non-JSON response:', body);
          // continue retrying
        }
      } else {
        console.error(`Unexpected status ${statusCode}. Attempt ${attempt}/${maxAttempts}`);
      }
    } catch (err) {
      console.error(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
    }
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.error('Health check failed after all attempts.');
  process.exit(1);
})();

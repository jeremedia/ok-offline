const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8001;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse the request URL
  const parsedUrl = url.parse(req.url, true);
  
  // Only proxy requests to /api/*
  if (!parsedUrl.pathname.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Build the Burning Man API URL
  const apiPath = parsedUrl.pathname.replace('/api/', '');
  const apiUrl = `https://api.burningman.org/api/${apiPath}${parsedUrl.search || ''}`;
  
  console.log(`Proxying request to: ${apiUrl}`);

  // Extract X-API-Key from request headers
  const apiKey = req.headers['x-api-key'];
  
  // Make the request to Burning Man API
  const options = {
    headers: {
      'X-API-Key': apiKey || '',
      'Accept': 'application/json'
    }
  };

  https.get(apiUrl, options, (apiRes) => {
    res.writeHead(apiRes.statusCode, apiRes.headers);
    apiRes.pipe(res);
  }).on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(500);
    res.end('Proxy error');
  });
});

server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Proxying Burning Man API requests to avoid CORS issues');
});
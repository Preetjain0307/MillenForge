const http = require('http');

const data = JSON.stringify({
  prompt: 'create a college website background color is yellow and button should green',
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        console.log('=== API RESPONSE VERIFICATION ===');
        console.log('API SUCCESS:', parsed.success);
        console.log('PAGE DOMAIN:', parsed.page?.meta?.domain);
        console.log('PROPS THEME TOKENS:', JSON.stringify(parsed.page?.props?.themeTokens, null, 2));
        console.log('PAGE THEME TOKENS:', JSON.stringify(parsed.page?.themeTokens, null, 2));
        console.log('META PROPS:', JSON.stringify(parsed.page?.meta, null, 2));
      } catch (e) {
        console.log('RAW RESPONSE:', body);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('Request Error:', err);
});

req.write(data);
req.end();

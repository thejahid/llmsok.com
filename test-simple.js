const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Test Server</title></head>
      <body>
        <h1>Server is working!</h1>
        <p>Port: ${server.address()?.port}</p>
        <p>Time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

const port = 4000;
server.listen(port, '127.0.0.1', () => {
  console.log(`✅ Simple test server running at http://127.0.0.1:${port}`);
  console.log(`✅ Also try: http://localhost:${port}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
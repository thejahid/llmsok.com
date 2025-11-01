import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 4004;

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>LLM.txt Mastery Test</title></head>
      <body>
        <h1>🎉 Server is working!</h1>
        <p>Coffee tier test page</p>
        <p>Port: ${port}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <div style="background: orange; padding: 20px; margin: 20px 0;">
          <h2>☕ Coffee Tier Test</h2>
          <p>If you can see this, the server is working!</p>
        </div>
      </body>
    </html>
  `);
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'working',
    message: 'API endpoints functional',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Simple Express server running at:`);
  console.log(`   http://localhost:${port}`);
  console.log(`   http://127.0.0.1:${port}`);
  console.log(`   http://0.0.0.0:${port}`);
});

app.on('error', (err) => {
  console.error('❌ Server error:', err);
});
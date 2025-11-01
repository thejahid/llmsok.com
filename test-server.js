#!/usr/bin/env node
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001; // Use a different port to avoid conflicts

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test server is working!', 
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Serve the app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`✅ Test server running at http://localhost:${port}`);
  console.log(`📡 API test endpoint: http://localhost:${port}/api/test`);
});
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { SimulationRequest } from './src/types';
import { handleSimulation } from './src/handlers/simulationHandler';
import { serializeBigInts } from './src/utils/serialization';

let server;

try {
  // Try to load SSL certificates
  const options = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
  };

  server = https.createServer(options, requestHandler);
  console.log('Starting server in HTTPS mode');
} catch (error) {
  server = http.createServer(requestHandler);
  console.log('SSL certificates not found, starting server in HTTP mode');
}

const port = process.env.PORT || 3000;

// Export the request handler for testing
export async function requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Basic routing
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Welcome to the server' }));
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  } else if (req.url === '/api/simulate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const simulationRequest = JSON.parse(body) as SimulationRequest;
        const result = await handleSimulation(simulationRequest);
        
        // Serialize BigInts before JSON.stringify
        const serializedResult = serializeBigInts(result);
        
        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(serializedResult));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Invalid request format'
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}

// Only start the server if this file is being run directly
if (require.main === module) {
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  // Error handling
  server.on('error', (error) => {
    console.error('Server error:', error);
  });

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
} 
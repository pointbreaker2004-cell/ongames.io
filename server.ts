import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { setupSocketHandlers } from './server/src/socketHandler.js';

const dev = process.env.NODE_ENV !== 'production';
const defaultPort = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: '0.0.0.0' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  setupSocketHandlers(io);

  let currentPort = defaultPort;

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`! Port ${currentPort} is currently in use. Trying port ${currentPort + 1}...`);
      currentPort++;
      httpServer.listen(currentPort, '0.0.0.0');
    } else {
      console.error('Server error:', err);
    }
  });

  httpServer.on('listening', () => {
    console.log(`\n==================================================`);
    console.log(`> OnGames server ready on: http://localhost:${currentPort}`);
    console.log(`> WebSockets connected and active on the same port.`);
    console.log(`==================================================\n`);
  });

  httpServer.listen(currentPort, '0.0.0.0');
});

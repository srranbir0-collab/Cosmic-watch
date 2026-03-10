
import dotenv from 'dotenv';
// Load env vars before importing app which might use them immediately
dotenv.config();

import { app } from './src/server/app';
import logger from './src/server/utils/logger';
import process from 'process';
import http from 'http';
import { initSocket } from './src/server/socket';

// Pterodactyl assigns dynamic ports via SERVER_PORT or PORT env var
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10);
// Critical for Docker/Pterodactyl: Must bind to 0.0.0.0, not localhost
const HOST = '0.0.0.0';

async function bootstrap() {
  try {
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, HOST, () => {
      logger.info(`🌌 Cosmic Watch Server Online on ${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Mode: Stateless (In-Memory Only)`);
      
      // Debug info for connection issues
      if (process.env.SERVER_PORT && process.env.SERVER_PORT !== String(PORT)) {
          logger.warn(`⚠️ Mismatch detected: SERVER_PORT is ${process.env.SERVER_PORT} but app bound to ${PORT}. Connection may fail.`);
      }
    });

    // Graceful Shutdown Logic
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Closing server gracefully...`);
      httpServer.close(() => {
        logger.info('HTTP server closed.');
      });
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

import { app } from './app';
import logger from './utils/logger';
import dotenv from 'dotenv';
import process from 'process';
import http from 'http';
import { initSocket } from './socket';

dotenv.config();

const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10);
const HOST = '0.0.0.0';

async function bootstrap() {
  try {
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, HOST, () => {
      logger.info(`🌌 Cosmic Watch Server Online on ${HOST}:${PORT}`);
      logger.info(`Mode: Stateless (In-Memory Only)`);
    });

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
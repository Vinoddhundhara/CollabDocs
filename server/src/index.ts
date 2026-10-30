import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';

const app = createApp();

const startServer = async () => {
  // Connect to MongoDB
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    console.warn(
      '⚠️ [Warning]: MongoDB is not currently reachable. The server will run, but persistent storage requests may fail until MongoDB is connected.'
    );
  }

  const server = app.listen(config.port, () => {
    console.log(`\n🚀 [CollabDocs Server]: Running on http://localhost:${config.port}`);
    console.log(`📡 [Health Check]: http://localhost:${config.port}/api/health`);
    console.log(`🔒 [Environment]: ${config.nodeEnv}\n`);
  });

  const shutdown = async () => {
    console.log('\n🛑 Gracefully shutting down server...');
    server.close(async () => {
      await disconnectDatabase();
      console.log('✅ Server and database disconnected cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();


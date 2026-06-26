import { buildApp } from './app.js';
import { config } from './config/index.js';

const app = buildApp();

const start = async () => {
  try {
    // Bind to the configured host and port
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`🚀 QueueStorm Investigator listening on http://${config.HOST}:${config.PORT}`);
    console.log(`📄 Swagger Docs available at http://${config.HOST}:${config.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

import Fastify from 'fastify';
import swaggerPlugin from './plugins/swagger.js';
import corsPlugin from './plugins/cors.js';
import { healthRoutes } from './routes/health.js';
import { analyzeRoutes } from './routes/analyze.js';
import { loggerConfig } from './utils/logger.js';

/**
 * Builds the Fastify application instance.
 */
export function buildApp() {
  const fastify = Fastify({
    logger: loggerConfig,
  });

  // Register plugins
  fastify.register(swaggerPlugin);
  fastify.register(corsPlugin);

  // Register application routes
  fastify.register(healthRoutes);
  fastify.register(analyzeRoutes);

  // Global Error Handler to block sensitive information leakage
  fastify.setErrorHandler((error: any, request, reply) => {
    fastify.log.error({ err: error }, 'Unhandled error caught in Fastify handler');

    // Handle Client-side validation errors
    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ 
        error: error.message 
      });
    }

    // Default Internal Server Error response (hides stack traces)
    return reply.status(500).send({
      error: 'An internal server error occurred while processing the request.'
    });
  });

  return fastify;
}

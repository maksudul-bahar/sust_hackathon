import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

/**
 * Registers CORS headers for the application.
 * Wrapped with fastify-plugin to apply at the root scope.
 */
export default fp(async function corsPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });
});

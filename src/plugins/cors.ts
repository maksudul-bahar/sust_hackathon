import type { FastifyInstance } from 'fastify';

/**
 * Registers CORS headers for the application.
 * Install @fastify/cors to enable full CORS support:
 *   npm install @fastify/cors
 *
 * For now, this plugin adds basic permissive CORS headers via a hook.
 */
export async function corsPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });
}

import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

/**
 * Registers Swagger (OpenAPI spec) and Swagger UI plugins.
 * Wrapped with fastify-plugin to break encapsulation so routes are visible.
 */
export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'QueueStorm Investigator API',
        description: 'AI/API SupportOps challenge service for Digital Finance',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
  });
});

/**
 * Logger configuration constants.
 * Centralizes logger setup for consistent log formatting across the app.
 */

/** Fastify logger options with safe request serializer */
export const loggerConfig = {
  level: 'info',
  // Safe serializer to ensure we don't log authorization headers or secrets
  serializers: {
    req(req: any) {
      return {
        method: req.method,
        url: req.url,
        hostname: req.hostname,
      };
    },
  },
};

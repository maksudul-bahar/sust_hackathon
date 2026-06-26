import { z } from 'zod';

/**
 * Zod schema defining and validating all environment variables.
 * Separating this from config/index.ts keeps env validation logic isolated.
 */
export const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  HOST: z.string().default('0.0.0.0'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

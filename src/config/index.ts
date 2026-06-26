import dotenv from 'dotenv';
import { envSchema } from './env.js';

// Load environment variables from .env file
dotenv.config();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

// Warning if GEMINI_API_KEY is missing
if (!parsed.data.GEMINI_API_KEY) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined. The service will operate using rule-based fallback logic.');
}

export const config = parsed.data;
export type Config = typeof config;

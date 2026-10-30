import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  corsOrigin: string[];
}

export const getEnv = (): AppConfig => {
  const port = parseInt(process.env.PORT || '5002', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mongodbUri = process.env.MONGODB_URI || '';
  const jwtSecret = process.env.JWT_SECRET || '';
  const corsOriginRaw = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
  const corsOrigin = corsOriginRaw.split(',').map((origin) => origin.trim()).filter(Boolean);

  return {
    port,
    nodeEnv,
    mongodbUri,
    jwtSecret,
    corsOrigin,
  };
};

export const config = getEnv();

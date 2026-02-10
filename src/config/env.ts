import 'dotenv/config';

type NodeEnv = 'development' | 'test' | 'production';

interface EnvConfig {
  port: number;
  mongoUri: string;
  nodeEnv: NodeEnv;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const config: EnvConfig = {
  port: Number(getEnvVar('PORT', '3000')),
  mongoUri: getEnvVar('MONGO_URI', 'mongodb://localhost:27017/pms-task'),
  nodeEnv: (getEnvVar('NODE_ENV', 'development') as NodeEnv),
};

export const env = config;


import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validTimezone(name: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name });
    return name;
  } catch {
    throw new Error(`Invalid APP_TIMEZONE "${name}". Use an IANA name such as Asia/Kolkata or UTC.`);
  }
}

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT "${process.env.PORT}"`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port,
  mongoUri: required('MONGODB_URI'),
  timezone: validTimezone(process.env.APP_TIMEZONE ?? 'Asia/Kolkata'),
} as const;

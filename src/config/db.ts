import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectToDatabase(): Promise<typeof mongoose> {
  // If already connected, return the instance
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    logger.info('Using existing MongoDB connection');
    return mongoose;
  }

  try {
    // Configure connection options
    const options: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable
      autoIndex: env.nodeEnv !== 'production', // Don't build indexes automatically in production
    };

    // Establish connection
    await mongoose.connect(env.mongoUri, options);

    logger.info('MongoDB Connected successfully');

    // Setup event listeners for runtime issues
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return mongoose;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    // Fail-fast: if initial connection fails, exit the process
    process.exit(1);
  }
}

import mongoose from 'mongoose';
import { env } from './env';

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose;
  }

  try {
    await mongoose.connect(env.mongoUri);
    // MongoDB Replica Set varsayımı README'de ayrıca belirlenecek.
    return mongoose;
  } catch (error) {
    // Fail-fast: bağlantı yoksa uygulamayı ayakta tutmaktansa erken patlat.
    // Uygulama seviyesinde loglama ileride eklenecek.
    // eslint-disable-next-line no-console
    console.error('MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
}


import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectToDatabase } from './config/db';

async function bootstrap() {
  await connectToDatabase();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
}

void bootstrap();

